import { readFile } from "node:fs/promises";
import { parseArgs } from "node:util";
import type { Questions } from "@openrouter/sdk/models/decisionsrequest";
import type { DecisionsScoreAnswer } from "@openrouter/sdk/models/decisionsscoreanswer";
import type { DecisionsScoreQuestion } from "@openrouter/sdk/models/decisionsscorequestion";
import {
	createProvider,
	type Provider,
	type ProviderName,
} from "./provider.ts";

const MODEL = "typesafe/jev-1.13";
const THRESHOLD = 0.8;
const BATCH_SIZE = 255;
const CONF_HIGH = 0.8;
const CONF_MID = 0.5;

// ── Types ────────────────────────────────────────────────────────────────────

type Line = { lineNum: number; text: string };
type FlagMap = Map<number, string[]>;
type Scope = "line" | "document";
type RawRule = (Questions | DecisionsScoreQuestion) & { scope: Scope };

// ── Helpers ──────────────────────────────────────────────────────────────────

const RULES_DIR = new URL("../rules/", `file://${import.meta.dirname}/`)
	.pathname;

function resolveRulePath(r: string): string {
	// Bare name (no path separator, no extension) → look up in rules/
	if (!r.includes("/") && !r.includes("\\") && !r.includes("."))
		return `${RULES_DIR}${r}.json`;
	return new URL(r, `file://${process.cwd()}/`).pathname;
}

function parseCliArgs(): {
	rulesPaths: string[];
	file: string;
	provider?: ProviderName;
} {
	const { values, positionals } = parseArgs({
		args: process.argv.slice(2),
		options: {
			rules: { type: "string", multiple: true, short: "r" },
			provider: { type: "string", short: "p" },
		},
		allowPositionals: true,
	});

	const rulesPaths = (values.rules ?? []).map(resolveRulePath);
	const [file] = positionals;

	if (!rulesPaths.length || !file)
		throw new Error(
			"usage: node main.ts -r <name|path> [-r ...] [--provider <jev|openrouter>] <file>",
		);

	const provider = values.provider as ProviderName | undefined;
	if (provider !== undefined && provider !== "openrouter" && provider !== "jev")
		throw new Error(
			`Unknown provider "${provider}". Valid values: jev, openrouter`,
		);

	return { rulesPaths, file, provider };
}

function splitRules(
	paths: string[],
	raw: Record<string, Record<string, unknown>>[],
): {
	lineRules: Record<string, Questions>;
	docRules: Record<string, DecisionsScoreQuestion>;
} {
	const merged = Object.assign({}, ...raw) as Record<string, RawRule>;
	const lineRules: Record<string, Questions> = {};
	const docRules: Record<string, DecisionsScoreQuestion> = {};

	for (const [key, rule] of Object.entries(merged)) {
		if (rule.scope !== "line" && rule.scope !== "document")
			throw new Error(
				`Rule "${key}" is missing a valid "scope" field ("line" or "document")`,
			);
		const { scope: _, ...rest } = rule;
		if (rule.scope === "line") lineRules[key] = rest as Questions;
		else docRules[key] = rest as DecisionsScoreQuestion;
	}

	return { lineRules, docRules };
}

async function loadRules(paths: string[]): Promise<{
	lineRules: Record<string, Questions>;
	docRules: Record<string, DecisionsScoreQuestion>;
}> {
	const raw = await Promise.all(
		paths.map((p) =>
			readFile(p, "utf8").then(
				(s) => JSON.parse(s) as Record<string, Record<string, unknown>>,
			),
		),
	);
	return splitRules(paths, raw);
}

async function loadLines(filePath: string): Promise<Line[]> {
	return (await readFile(filePath, "utf8"))
		.split("\n")
		.map((text, i) => ({ lineNum: i + 1, text }))
		.filter(({ text }) => text.trim());
}

function chunk<T>(arr: T[], size: number): T[][] {
	const out: T[][] = [];
	for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
	return out;
}

const lineMarker = (lineNum: number) => `L${String(lineNum).padStart(4, "0")}`;

async function gradeLines(
	lines: Line[],
	questions: Record<string, Questions>,
	provider: Provider,
): Promise<FlagMap> {
	if (!Object.keys(questions).length) return new Map();
	const batches = chunk(lines, BATCH_SIZE);

	const results = await Promise.all(
		Object.entries(questions).flatMap(([qKey, qDef]) =>
			batches.map(async (batch) => {
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
				const decision = await provider.createDecision({
					model: MODEL,
					state,
					questions: batchQuestions,
				});
				return { qKey, answers: decision.answers };
			}),
		),
	);

	const flags: FlagMap = new Map();
	for (const { qKey, answers } of results) {
		for (const [id, answer] of Object.entries(answers)) {
			if (answer.type !== "noul" || answer.noul <= THRESHOLD) continue;
			const lineNum = parseInt(id.slice(1));
			const existing = flags.get(lineNum) ?? [];
			existing.push(qKey);
			flags.set(lineNum, existing);
		}
	}
	return flags;
}

async function gradeDocument(
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
	return Object.fromEntries(
		Object.entries(decision.answers).filter(([, a]) => a.type === "score"),
	) as Record<string, DecisionsScoreAnswer>;
}

// ── Reporting ─────────────────────────────────────────────────────────────────

function confidenceTier(conf: number): "low" | "mid" | "high" {
	if (conf >= CONF_HIGH) return "high";
	if (conf >= CONF_MID) return "mid";
	return "low";
}

function printLineReport(
	lines: Line[],
	flags: FlagMap,
	questions: Record<string, Questions>,
): void {
	if (!Object.keys(questions).length) return;
	const ids = Object.keys(questions).map(
		(k, i) => [k, String.fromCharCode("A".charCodeAt(0) + i)] as const,
	);
	const keyToLetter = new Map(ids.map(([k, v]) => [k, v]));

	console.log(ids.map(([k, v]) => `${v}=${k}`).join(", "));
	console.log();

	for (const { lineNum, text } of lines) {
		const lineFlags = flags.get(lineNum);
		if (!lineFlags?.length) continue;
		const letters = lineFlags.map((k) => keyToLetter.get(k) ?? k);
		console.log(
			`${letters.join(",").padEnd(15)} | ${lineMarker(lineNum)}: ${text}`,
		);
	}
}

function printDocumentScores(
	scores: Record<string, DecisionsScoreAnswer>,
	questions: Record<string, DecisionsScoreQuestion>,
): void {
	if (!Object.keys(scores).length) return;

	const separator = "─".repeat(52);
	console.log(`\n── Document Scores ${separator}\n`);

	const nameWidth = Math.max(...Object.keys(scores).map((k) => k.length));

	for (const [key, answer] of Object.entries(scores)) {
		const q = questions[key];
		const criteria = q?.criteria as string[] | undefined;
		if (!criteria) continue;

		const max = criteria.length - 1;
		const { score, confidence = 0 } = answer;
		const tier = confidenceTier(confidence);
		const frac = score % 1;
		const isBetween = frac > 0.2 && frac < 0.8;
		const showBoth = isBetween && tier !== "high";

		let label: string;
		if (showBoth) {
			const lo = criteria[Math.floor(score)] ?? "";
			const hi = criteria[Math.ceil(score)] ?? "";
			// Trim to first clause (before " — ") for compactness
			const trim = (s: string) => s.split(" — ")[0] ?? s;
			label = `"${trim(lo)}" ↔ "${trim(hi)}"`;
		} else {
			label = `"${criteria[Math.round(score)] ?? ""}"`;
		}

		const name = key.padEnd(nameWidth);
		const scoreStr = `${score.toFixed(1)}/${max}`;
		console.log(
			`${name}  ${scoreStr.padEnd(6)}  (confidence ${tier.padEnd(4)})  ${label}`,
		);
	}
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
	const { rulesPaths, file, provider: providerName } = parseCliArgs();
	const provider = createProvider(providerName);

	const skillPath = new URL("../SKILL.md", `file://${import.meta.dirname}/`)
		.pathname;
	const filePath = new URL(file, `file://${process.cwd()}/`).pathname;
	console.log(`Use the SKILL \`${skillPath}\` to improve \`${filePath}\`.\n`);

	console.log("Rules:");
	for (const p of rulesPaths) console.log(`  ${p}`);
	console.log();

	const [{ lineRules, docRules }, lines, fullText] = await Promise.all([
		loadRules(rulesPaths),
		loadLines(file),
		readFile(file, "utf8"),
	]);

	const [flags, scores] = await Promise.all([
		gradeLines(lines, lineRules, provider),
		gradeDocument(fullText, docRules, provider),
	]);

	printLineReport(lines, flags, lineRules);
	printDocumentScores(scores, docRules);
}

main();
