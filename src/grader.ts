import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { basename, resolve } from "node:path";
import type { Answers } from "@openrouter/sdk/models/decisionsresponse";
import type { DecisionsScoreAnswer } from "@openrouter/sdk/models/decisionsscoreanswer";
import { batchRegions, buildBatchRequest, lineMarker } from "./batch.ts";
import { hashLine, type LineCacheManager } from "./cache.ts";
import { parseMarkdownRules } from "./markdown/rules.ts";
import type { Provider } from "./provider.ts";
import { buildRegions } from "./region.ts";
import type {
	FlagMap,
	LineIndex,
	NoulQuestion,
	Question,
	Rule,
	RuleSet,
	RulesetInfo,
	RulesetScope,
} from "./types.ts";

export type { RuleSet, RulesetInfo, RulesetScope };

const THRESHOLD = 0.8;

// ── Pure / Deterministic ─────────────────────────────────────────────────────

export function parseLines(text: string): string[] {
	return text.split(/\r?\n/);
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

export function extractLineFlags(
	results: Array<{ qKey: string; answers: Record<string, Answers> }>,
	threshold = THRESHOLD,
): FlagMap {
	const flags: FlagMap = new Map();
	for (const { qKey, answers } of results) {
		for (const [id, answer] of Object.entries(answers)) {
			if (answer.type !== "noul" || answer.noul <= threshold) continue;
			const lineIndex = parseInt(id.slice(1), 10) - 1;
			const existing = flags.get(lineIndex) ?? [];
			existing.push(qKey);
			flags.set(lineIndex, existing);
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

type RuleJob = {
	ruleId: string;
	qDef: NoulQuestion;
	answers: Record<string, Answers>;
	uncachedLines: LineIndex[];
};

function indexLines(
	allLines: string[],
	targetIndices: LineIndex[],
): Map<string, LineIndex[]> {
	const lineHashes = new Map<string, LineIndex[]>();
	for (const idx of targetIndices) {
		const hash = hashLine(allLines[idx]);
		const existing = lineHashes.get(hash);
		if (existing) {
			existing.push(idx);
		} else {
			lineHashes.set(hash, [idx]);
		}
	}
	return lineHashes;
}

async function prefilterJobs(
	questions: Record<string, NoulQuestion>,
	targetIndices: LineIndex[],
	lineHashes: Map<string, LineIndex[]>,
	cacheManager?: LineCacheManager,
): Promise<{ jobs: RuleJob[]; cacheHits: number }> {
	let cacheHits = 0;
	const jobs: RuleJob[] = [];

	for (const [ruleId, qDef] of Object.entries(questions)) {
		if (cacheManager) {
			const { cachedScores, uncachedLines } = await cacheManager.prefilterRule(
				ruleId,
				qDef,
				targetIndices,
				lineHashes,
			);
			cacheHits += cachedScores.size;
			const answers: Record<string, Answers> = {};
			for (const [lineIndex, score] of cachedScores) {
				answers[lineMarker(lineIndex)] = { type: "noul", noul: score };
			}
			jobs.push({ ruleId, qDef, answers, uncachedLines });
		} else {
			jobs.push({ ruleId, qDef, answers: {}, uncachedLines: targetIndices });
		}
	}

	return { jobs, cacheHits };
}

export function assertCompleteAnswers(
	answers: Record<string, Answers> | undefined,
	expectedIds: string[],
	providerName: string,
): asserts answers is Record<string, Answers> {
	if (typeof answers !== "object" || answers === null) {
		throw new Error(
			`Provider (${providerName}) returned invalid response: missing answers object`,
		);
	}
	const missing = expectedIds.filter((id) => !(id in answers));
	if (missing.length > 0) {
		throw new Error(
			`Provider (${providerName}) returned incomplete answers: missing ${missing.length} of ${expectedIds.length} answers`,
		);
	}
}

async function evaluateJobs(
	dirtyJobs: RuleJob[],
	allLines: string[],
	provider: Provider,
): Promise<void> {
	await Promise.all(
		dirtyJobs.map(async (job) => {
			const regions = buildRegions(job.uncachedLines);
			const batches = batchRegions(regions, allLines, job.ruleId, job.qDef);
			await Promise.all(
				batches.map(async (batch) => {
					const { state, batchQuestions } = buildBatchRequest(batch, allLines);
					const decision = await provider.createDecision({
						model: provider.model,
						state,
						questions: batchQuestions,
					});
					const expectedIds = Object.keys(batchQuestions);
					assertCompleteAnswers(decision?.answers, expectedIds, provider.name);
					for (const [id, answer] of Object.entries(decision.answers)) {
						job.answers[id] = answer;
					}
				}),
			);
		}),
	);
}

/**
 * Saves evaluated line scores back to rule caches. Saves run sequentially to avoid
 * concurrently inflating multiple 25,000-entry payloads in memory.
 */
async function writebackCaches(
	dirtyJobs: RuleJob[],
	allLines: string[],
	cacheManager: LineCacheManager,
): Promise<void> {
	for (const job of dirtyJobs) {
		const freshScores: Array<[string, number]> = [];
		for (const lineIndex of job.uncachedLines) {
			const id = lineMarker(lineIndex);
			const answer = job.answers[id];
			if (answer?.type === "noul" && typeof answer.noul === "number") {
				freshScores.push([hashLine(allLines[lineIndex]), answer.noul]);
			}
		}
		if (freshScores.length > 0) {
			await cacheManager.saveRuleScores(job.ruleId, job.qDef, freshScores);
		}
	}
}

export async function gradeLines(
	allLines: string[],
	questions: Record<string, NoulQuestion>,
	provider: Provider,
	cacheManager?: LineCacheManager,
): Promise<{ flags: FlagMap; cacheHits: number }> {
	const targetIndices: LineIndex[] = [];
	for (let i = 0; i < allLines.length; i++) {
		if (allLines[i].trim().length > 0) {
			targetIndices.push(i);
		}
	}
	if (!targetIndices.length || !Object.keys(questions).length) {
		return { flags: new Map(), cacheHits: 0 };
	}

	const lineHashes = indexLines(allLines, targetIndices);
	const { jobs, cacheHits } = await prefilterJobs(
		questions,
		targetIndices,
		lineHashes,
		cacheManager,
	);

	const dirtyJobs = jobs.filter((j) => j.uncachedLines.length > 0);
	if (dirtyJobs.length > 0) {
		await evaluateJobs(dirtyJobs, allLines, provider);
		if (cacheManager) {
			await writebackCaches(dirtyJobs, allLines, cacheManager);
		}
	}

	const results = jobs.map(({ ruleId, answers }) => ({
		qKey: ruleId,
		answers,
	}));

	return { flags: extractLineFlags(results), cacheHits };
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
		model: provider.model,
		state: text,
		questions,
	});
	const expectedIds = Object.keys(questions);
	assertCompleteAnswers(decision?.answers, expectedIds, provider.name);
	return {
		scores: extractDocumentScores(decision.answers),
		flags: extractDocumentFlags(decision.answers),
	};
}
