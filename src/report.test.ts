import { describe, expect, it } from "vitest";
import {
	confidenceTier,
	formatDocumentScores,
	formatJson,
	formatLineReport,
} from "./report.ts";
import type { FlagMap, Line } from "./types.ts";

describe("report", () => {
	it("confidenceTier classifies confidence levels", () => {
		const levels = [0.9, 0.8, 0.7, 0.5, 0.4, 0.0].map((c) => ({
			conf: c,
			tier: confidenceTier(c),
		}));
		expect(levels).toMatchSnapshot();
	});

	it("formatLineReport formats flagged lines with letter keys", () => {
		const lines: Line[] = [
			{ lineNum: 1, text: "Empowering our users" },
			{ lineNum: 2, text: "Clean line here" },
			{ lineNum: 3, text: "Another bad line" },
		];
		const flags: FlagMap = new Map([
			[1, ["banned_word", "puffery"]],
			[3, ["banned_word"]],
		]);
		const questions = {
			banned_word: { type: "noul" as const, instructions: "Check banned" },
			puffery: { type: "noul" as const, instructions: "Check puffery" },
		};

		const report = formatLineReport(lines, flags, questions);
		expect(report).toMatchSnapshot();
	});

	it("formatDocumentScores formats scores with criteria and confidence", () => {
		const scores = {
			engagement: {
				type: "score" as const,
				score: 2.5,
				confidence: 0.6,
			},
			clarity: {
				type: "score" as const,
				score: 2.0,
				confidence: 0.9,
			},
		};
		const questions = {
			engagement: {
				type: "score" as const,
				instructions: "Rate engagement",
				criteria: [
					"Dull — lacks energy",
					"Fair — readable",
					"Good — engaging",
					"Exceptional — captivating",
				],
			},
			clarity: {
				type: "score" as const,
				instructions: "Rate clarity",
				criteria: ["Confusing", "Readable", "Crystal clear"],
			},
		};

		const formatted = formatDocumentScores(scores, questions);
		expect(formatted).toMatchSnapshot();
	});

	it("formatJson produces structured JSON output", () => {
		const lines: Line[] = [
			{ lineNum: 1, text: "Empowering our users" },
			{ lineNum: 2, text: "Clean line" },
		];
		const flags: FlagMap = new Map([[1, ["banned_word"]]]);
		const scores = {
			engagement: {
				type: "score" as const,
				score: 2.0,
				confidence: 0.85,
			},
		};
		const docQuestions = {
			engagement: {
				type: "score" as const,
				instructions: "Rate engagement",
				criteria: ["Low", "Mid", "High"],
			},
		};

		const jsonStr = formatJson(
			"/path/to/file.txt",
			["/path/to/rules.json"],
			lines,
			flags,
			scores,
			docQuestions,
		);
		expect(JSON.parse(jsonStr)).toMatchSnapshot();
	});
});
