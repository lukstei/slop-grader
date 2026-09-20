import type { Questions } from "@openrouter/sdk/models/decisionsrequest";
import type { DecisionsScoreAnswer } from "@openrouter/sdk/models/decisionsscoreanswer";
import type { DecisionsScoreQuestion } from "@openrouter/sdk/models/decisionsscorequestion";
import { lineMarker } from "./grader.ts";
import type { FlagMap, Line } from "./types.ts";

export const CONF_HIGH = 0.8;
export const CONF_MID = 0.5;

export function confidenceTier(conf: number): "low" | "mid" | "high" {
	if (conf >= CONF_HIGH) return "high";
	if (conf >= CONF_MID) return "mid";
	return "low";
}

export function formatLineReport(
	lines: Line[],
	flags: FlagMap,
	questions: Record<string, Questions>,
): string[] {
	if (!Object.keys(questions).length) return [];
	const ids = Object.keys(questions).map(
		(k, i) => [k, String.fromCharCode("A".charCodeAt(0) + i)] as const,
	);
	const keyToLetter = new Map(ids.map(([k, v]) => [k, v]));

	const out: string[] = [];
	out.push(ids.map(([k, v]) => `${v}=${k}`).join(", "));
	out.push("");

	for (const { lineNum, text } of lines) {
		const lineFlags = flags.get(lineNum);
		if (!lineFlags?.length) continue;
		const letters = lineFlags.map((k) => keyToLetter.get(k) ?? k);
		out.push(
			`${letters.join(",").padEnd(15)} | ${lineMarker(lineNum)}: ${text}`,
		);
	}
	return out;
}

export function formatDocumentScores(
	scores: Record<string, DecisionsScoreAnswer>,
	questions: Record<string, DecisionsScoreQuestion>,
): string[] {
	if (!Object.keys(scores).length) return [];

	const separator = "─".repeat(52);
	const out: string[] = [];
	out.push(`\n── Document Scores ${separator}\n`);

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
			const trim = (s: string) => s.split(" — ")[0] ?? s;
			label = `"${trim(lo)}" ↔ "${trim(hi)}"`;
		} else {
			label = `"${criteria[Math.round(score)] ?? ""}"`;
		}

		const name = key.padEnd(nameWidth);
		const scoreStr = `${score.toFixed(1)}/${max}`;
		out.push(
			`${name}  ${scoreStr.padEnd(6)}  (confidence ${tier.padEnd(4)})  ${label}`,
		);
	}
	return out;
}

export function formatJson(
	filePath: string,
	rulesPaths: string[],
	lines: Line[],
	flags: FlagMap,
	scores: Record<string, DecisionsScoreAnswer>,
	docQuestions: Record<string, DecisionsScoreQuestion>,
): string {
	const flaggedLines = lines
		.filter(({ lineNum }) => flags.has(lineNum))
		.map(({ lineNum, text }) => ({
			lineNum,
			text,
			rules: flags.get(lineNum) ?? [],
		}));

	const document: Record<
		string,
		{ score: number; max: number; confidence: number; label: string }
	> = {};
	for (const [key, answer] of Object.entries(scores)) {
		const q = docQuestions[key];
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
			const trim = (s: string) => s.split(" — ")[0] ?? s;
			label = `${trim(lo)} ↔ ${trim(hi)}`;
		} else {
			label = criteria[Math.round(score)] ?? "";
		}
		document[key] = { score, max, confidence, label };
	}

	return JSON.stringify(
		{
			file: filePath,
			rules: rulesPaths,
			violations: { lines: flaggedLines, document },
		},
		null,
		2,
	);
}
