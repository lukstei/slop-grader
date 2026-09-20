import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import type { Questions } from "@openrouter/sdk/models/decisionsrequest";
import type { Answers } from "@openrouter/sdk/models/decisionsresponse";
import type { DecisionsScoreAnswer } from "@openrouter/sdk/models/decisionsscoreanswer";
import type { DecisionsScoreQuestion } from "@openrouter/sdk/models/decisionsscorequestion";
import type { Provider } from "./provider.ts";
import type { FlagMap, Line, Rule } from "./types.ts";

export const MODEL = "typesafe/jev-latest";
export const THRESHOLD = 0.8;
export const BATCH_SIZE = 255;

// ── Pure / Deterministic ─────────────────────────────────────────────────────

export function parseLines(text: string): Line[] {
	return text
		.split("\n")
		.map((line, i) => ({ lineNum: i + 1, text: line }))
		.filter(({ text: lineText }) => lineText.trim().length > 0);
}

export function chunk<T>(arr: T[], size: number): T[][] {
	assert(size > 0, "chunk size must be greater than 0");
	const out: T[][] = [];
	for (let i = 0; i < arr.length; i += size) {
		out.push(arr.slice(i, i + size));
	}
	return out;
}

export function lineMarker(lineNum: number): string {
	return `L${String(lineNum).padStart(4, "0")}`;
}

export function splitRules(raw: Record<string, Rule>[]): {
	lineRules: Record<string, Questions>;
	docRules: Record<string, DecisionsScoreQuestion>;
} {
	const merged = Object.assign({}, ...raw) as Record<string, Rule>;
	const lineRules: Record<string, Questions> = {};
	const docRules: Record<string, DecisionsScoreQuestion> = {};

	for (const [key, rule] of Object.entries(merged)) {
		assert(
			rule.scope === "line" || rule.scope === "document",
			`Rule "${key}" is missing a valid "scope" field ("line" or "document")`,
		);
		if (rule.scope === "line") {
			const { scope: _, ...rest } = rule;
			lineRules[key] = rest;
		} else {
			const { scope: _, ...rest } = rule;
			docRules[key] = rest;
		}
	}

	return { lineRules, docRules };
}

export function buildBatchRequest(
	batch: Line[],
	qDef: Questions,
): { state: string; batchQuestions: Record<string, Questions> } {
	const state = batch
		.map(({ lineNum, text }) => `${lineMarker(lineNum)}| ${text}`)
		.join("\n");
	const batchQuestions = Object.fromEntries(
		batch.map(({ lineNum }) => {
			const id = lineMarker(lineNum);
			return [
				id,
				{
					...qDef,
					instructions: `For the line ${id} answer: ${qDef.instructions}`,
				},
			];
		}),
	);
	return { state, batchQuestions };
}

export function extractLineFlags(
	results: Array<{ qKey: string; answers: Record<string, Answers> }>,
	threshold = THRESHOLD,
): FlagMap {
	const flags: FlagMap = new Map();
	for (const { qKey, answers } of results) {
		for (const [id, answer] of Object.entries(answers)) {
			if (answer.type !== "noul" || answer.noul <= threshold) continue;
			const lineNum = parseInt(id.slice(1), 10);
			const existing = flags.get(lineNum) ?? [];
			existing.push(qKey);
			flags.set(lineNum, existing);
		}
	}
	return flags;
}

export function extractDocumentScores(
	answers: Record<string, Answers>,
): Record<string, DecisionsScoreAnswer> {
	const scores: Record<string, DecisionsScoreAnswer> = {};
	for (const [key, answer] of Object.entries(answers)) {
		if (answer.type === "score") {
			scores[key] = answer;
		}
	}
	return scores;
}

// ── Side Effects (I/O & Providers) ───────────────────────────────────────────

export async function loadRules(paths: string[]): Promise<{
	lineRules: Record<string, Questions>;
	docRules: Record<string, DecisionsScoreQuestion>;
}> {
	const raw = await Promise.all(
		paths.map((p) =>
			readFile(p, "utf8").then((s) => JSON.parse(s) as Record<string, Rule>),
		),
	);
	return splitRules(raw);
}

export async function loadLines(filePath: string): Promise<Line[]> {
	const content = await readFile(filePath, "utf8");
	return parseLines(content);
}

export async function gradeLines(
	lines: Line[],
	questions: Record<string, Questions>,
	provider: Provider,
): Promise<FlagMap> {
	if (!Object.keys(questions).length) return new Map();
	const batches = chunk(lines, BATCH_SIZE);

	const results = await Promise.all(
		Object.entries(questions).flatMap(([qKey, qDef]) =>
			batches.map(async (batch) => {
				const { state, batchQuestions } = buildBatchRequest(batch, qDef);
				const decision = await provider.createDecision({
					model: MODEL,
					state,
					questions: batchQuestions,
				});
				return { qKey, answers: decision.answers };
			}),
		),
	);

	return extractLineFlags(results);
}

export async function gradeDocument(
	text: string,
	questions: Record<string, DecisionsScoreQuestion>,
	provider: Provider,
): Promise<Record<string, DecisionsScoreAnswer>> {
	if (!Object.keys(questions).length) return {};
	const decision = await provider.createDecision({
		model: MODEL,
		state: text,
		questions,
	});
	return extractDocumentScores(decision.answers);
}
