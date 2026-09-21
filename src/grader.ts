import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { basename, resolve } from "node:path";
import type { Answers } from "@openrouter/sdk/models/decisionsresponse";
import type { DecisionsScoreAnswer } from "@openrouter/sdk/models/decisionsscoreanswer";
import { parseMarkdownRules } from "./markdown/rules.ts";
import type { Provider } from "./provider.ts";
import type {
	FlagMap,
	Line,
	NoulQuestion,
	Question,
	Rule,
	RuleSet,
	RulesetInfo,
	RulesetScope,
} from "./types.ts";

export type { RuleSet, RulesetInfo, RulesetScope };

const MODEL = "~typesafe/jev-latest";
const THRESHOLD = 0.8;
const BATCH_SIZE = 255;

// ── Pure / Deterministic ─────────────────────────────────────────────────────

export function parseLines(text: string): Line[] {
	return text
		.split(/\r?\n/)
		.map((line, i) => ({ lineNum: i + 1, text: line.replace(/\r$/, "") }))
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

export function splitRules(raw: Record<string, Rule>[]): RuleSet {
	const lineRules: Record<string, NoulQuestion> = {};
	const docRules: Record<string, Question> = {};

	for (const ruleMap of raw) {
		for (const [key, rule] of Object.entries(ruleMap)) {
			assert(
				!(key in lineRules) && !(key in docRules),
				`Duplicate rule "${key}": rule identifiers must be unique across rulesets`,
			);
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
	}

	return { lineRules, docRules };
}

export function buildBatchRequest(
	batch: Line[],
	qDef: NoulQuestion,
): { state: string; batchQuestions: Record<string, NoulQuestion> } {
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

export function extractDocumentFlags(
	answers: Record<string, Answers>,
	threshold = THRESHOLD,
): string[] {
	const flags: string[] = [];
	for (const [key, answer] of Object.entries(answers)) {
		if (answer.type === "noul" && answer.noul > threshold) {
			flags.push(key);
		}
	}
	return flags;
}

// ── Side Effects (I/O & Providers) ───────────────────────────────────────────

export async function loadRuleset(
	filePath: string,
): Promise<RulesetInfo & { rules: Record<string, Rule> }> {
	const content = await readFile(filePath, "utf8");
	let description = "";
	let rules: Record<string, Rule> = {};

	if (filePath.endsWith(".md")) {
		const parsed = parseMarkdownRules(content, filePath);
		description = parsed.description;
		rules = parsed.rules;
	} else {
		const parsed = JSON.parse(content) as Record<string, unknown>;
		if (typeof parsed.description === "string") {
			description = parsed.description;
		}
		if (
			parsed.rules &&
			typeof parsed.rules === "object" &&
			!Array.isArray(parsed.rules)
		) {
			rules = parsed.rules as Record<string, Rule>;
		} else {
			const { description: _, ...rest } = parsed;
			rules = rest as Record<string, Rule>;
		}
	}

	const { lineRules, docRules } = splitRules([rules]);
	const lineRuleKeys = Object.keys(lineRules);
	const docRuleKeys = Object.keys(docRules);
	const lineRulesCount = lineRuleKeys.length;
	const docRulesCount = docRuleKeys.length;
	const rulesCount = lineRulesCount + docRulesCount;

	const scope: RulesetScope =
		lineRulesCount > 0 && docRulesCount > 0
			? "mixed"
			: lineRulesCount > 0
				? "line"
				: "document";

	const baseName = basename(filePath);
	const name = baseName.replace(/\.(md|json)$/, "");

	return {
		name,
		path: resolve(filePath),
		description,
		scope,
		rulesCount,
		lineRulesCount,
		docRulesCount,
		lineRules: lineRuleKeys,
		docRules: docRuleKeys,
		rules,
	};
}

export async function loadRules(paths: string[]): Promise<RuleSet> {
	const rulesets = await Promise.all(paths.map((p) => loadRuleset(p)));
	return splitRules(rulesets.map((r) => r.rules));
}

export async function gradeLines(
	lines: Line[],
	questions: Record<string, NoulQuestion>,
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
	questions: Record<string, Question>,
	provider: Provider,
): Promise<{
	scores: Record<string, DecisionsScoreAnswer>;
	flags: string[];
}> {
	if (!Object.keys(questions).length) return { scores: {}, flags: [] };
	const decision = await provider.createDecision({
		model: MODEL,
		state: text,
		questions,
	});
	return {
		scores: extractDocumentScores(decision.answers),
		flags: extractDocumentFlags(decision.answers),
	};
}
