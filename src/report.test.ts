import { describe, expect, it } from "vitest";
import {
	confidenceTier,
	formatDocumentScores,
	formatJson,
	formatLineReport,
	formatStats,
} from "./report.ts";
import type { FlagMap, Line } from "./types.ts";

describe("report", () => {
	it("confidenceTier classifies confidence levels", () => {
		const levels = [0.9, 0.8, 0.7, 0.5, 0.4, 0.0].map((c) => ({
			conf: c,
			tier: confidenceTier(c),
		}));
		expect(levels).toMatchInlineSnapshot(`
			[
			  {
			    "conf": 0.9,
			    "tier": "high",
			  },
			  {
			    "conf": 0.8,
			    "tier": "high",
			  },
			  {
			    "conf": 0.7,
			    "tier": "mid",
			  },
			  {
			    "conf": 0.5,
			    "tier": "mid",
			  },
			  {
			    "conf": 0.4,
			    "tier": "low",
			  },
			  {
			    "conf": 0,
			    "tier": "low",
			  },
			]
		`);
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
		expect(report).toMatchInlineSnapshot(`
			[
			  "A=banned_word, B=puffery",
			  "",
			  "A,B             | L0001: Empowering our users",
			  "A               | L0003: Another bad line",
			]
		`);
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
		expect(formatted).toMatchInlineSnapshot(`
			[
			  "
			── Document Scores ────────────────────────────────────────────────────
			",
			  "engagement  2.5/3   (confidence mid )  "Good" ↔ "Exceptional"",
			  "clarity     2.0/2   (confidence high)  "Crystal clear"",
			]
		`);
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
		expect(JSON.parse(jsonStr)).toMatchInlineSnapshot(`
			{
			  "file": "/path/to/file.txt",
			  "rules": [
			    "/path/to/rules.json",
			  ],
			  "violations": {
			    "document": {
			      "engagement": {
			        "confidence": 0.85,
			        "label": "High",
			        "max": 2,
			        "score": 2,
			      },
			    },
			    "lines": [
			      {
			        "lineNum": 1,
			        "rules": [
			          "banned_word",
			        ],
			        "text": "Empowering our users",
			      },
			    ],
			  },
			}
		`);
	});

	it("formatStats formats execution stats with breakdown", () => {
		const stats = {
			rules: 6,
			lineRules: 5,
			docRules: 1,
			lines: 12,
			questions: 61,
			apiCalls: 6,
		};
		expect(formatStats(stats)).toMatchInlineSnapshot(`
			[
			  "
			── Stats ────────────────────────────────────────────────────
			",
			  "Rules applied:    6 (5 line, 1 document)",
			  "Lines evaluated:  12",
			  "Questions asked:  61",
			  "API calls:        6",
			]
		`);
	});

	it("formatStats formats execution stats without breakdown when single scope", () => {
		const stats = {
			rules: 5,
			lineRules: 5,
			docRules: 0,
			lines: 10,
			questions: 50,
			apiCalls: 5,
		};
		expect(formatStats(stats)).toMatchInlineSnapshot(`
			[
			  "
			── Stats ────────────────────────────────────────────────────
			",
			  "Rules applied:    5",
			  "Lines evaluated:  10",
			  "Questions asked:  50",
			  "API calls:        5",
			]
		`);
	});

	it("formatJson includes stats when provided", () => {
		const lines: Line[] = [{ lineNum: 1, text: "Sample text" }];
		const flags: FlagMap = new Map();
		const scores = {};
		const docQuestions = {};
		const stats = {
			rules: 1,
			lineRules: 1,
			docRules: 0,
			lines: 1,
			questions: 1,
			apiCalls: 1,
		};

		const jsonStr = formatJson(
			"/path/to/file.txt",
			["/path/to/rules.json"],
			lines,
			flags,
			scores,
			docQuestions,
			stats,
		);
		expect(JSON.parse(jsonStr)).toMatchInlineSnapshot(`
			{
			  "file": "/path/to/file.txt",
			  "rules": [
			    "/path/to/rules.json",
			  ],
			  "stats": {
			    "apiCalls": 1,
			    "docRules": 0,
			    "lineRules": 1,
			    "lines": 1,
			    "questions": 1,
			    "rules": 1,
			  },
			  "violations": {
			    "document": {},
			    "lines": [],
			  },
			}
		`);
	});
});
