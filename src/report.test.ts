import { describe, expect, it } from "vitest";
import {
	confidenceTier,
	formatDocumentScores,
	formatJson,
	formatLineReport,
	formatStats,
	indexToRuleKey,
} from "./report.ts";
import type { FlagMap, Line } from "./types.ts";

describe("report", () => {
	it("indexToRuleKey generates bijective base-26 letter keys", () => {
		const indices = [0, 25, 26, 27, 51, 52, 701, 702];
		const mapped = indices.map((i) => ({ index: i, key: indexToRuleKey(i) }));
		expect(mapped).toMatchInlineSnapshot(`
			[
			  {
			    "index": 0,
			    "key": "A",
			  },
			  {
			    "index": 25,
			    "key": "Z",
			  },
			  {
			    "index": 26,
			    "key": "AA",
			  },
			  {
			    "index": 27,
			    "key": "AB",
			  },
			  {
			    "index": 51,
			    "key": "AZ",
			  },
			  {
			    "index": 52,
			    "key": "BA",
			  },
			  {
			    "index": 701,
			    "key": "ZZ",
			  },
			  {
			    "index": 702,
			    "key": "AAA",
			  },
			]
		`);
	});
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

	it("formatLineReport indicates when no line rule violations are found", () => {
		const lines: Line[] = [
			{ lineNum: 1, text: "Clean line one" },
			{ lineNum: 2, text: "Clean line two" },
		];
		const flags: FlagMap = new Map();
		const questions = {
			banned_word: { type: "noul" as const, instructions: "Check banned" },
			puffery: { type: "noul" as const, instructions: "Check puffery" },
		};

		const report = formatLineReport(lines, flags, questions);
		expect(report).toMatchInlineSnapshot(`
			[
			  "A=banned_word, B=puffery",
			  "",
			  "No line rule violations found.",
			]
		`);
	});

	it("formatLineReport handles more than 26 rules using AA-style keys", () => {
		const lines: Line[] = [
			{ lineNum: 1, text: "Empowering our users" },
			{ lineNum: 2, text: "Some typo or issue" },
		];
		const ruleNames = [
			"banned_word",
			"empty_adverb",
			"empty_phrase",
			"binary_contrast",
			"throat_clearing",
			"faux_insight",
			"colon_reveal",
			"negative_listing",
			"dramatic_fragmentation",
			"rhetorical_setup",
			"superficial_analysis",
			"importance_puffery",
			"interpretive_meta",
			"weasel_attribution",
			"fake_strong_verb",
			"synonym_cycling",
			"fake_profound_kicker",
			"summary_recap",
			"formatting_slop",
			"em_dash_crutch",
			"minimizing_complexity",
			"undefined_jargon",
			"ambiguous_reference",
			"missing_version_qualifier",
			"magic_value",
			"stale_placeholder",
			"typo_or_misspelling",
			"passive_voice_overuse",
			"comma_splice",
			"dangling_modifier",
			"run_on_sentence",
			"subject_verb_disagreement",
			"wrong_homophone",
			"noun_pile_up",
		];
		const questions = Object.fromEntries(
			ruleNames.map((name) => [
				name,
				{ type: "noul" as const, instructions: name },
			]),
		);
		const flags: FlagMap = new Map([
			[1, ["banned_word", "stale_placeholder", "typo_or_misspelling"]],
			[2, ["noun_pile_up"]],
		]);
		const report = formatLineReport(lines, flags, questions);
		expect(report).toMatchInlineSnapshot(`
			[
			  "A=banned_word, B=empty_adverb, C=empty_phrase, D=binary_contrast, E=throat_clearing, F=faux_insight, G=colon_reveal, H=negative_listing, I=dramatic_fragmentation, J=rhetorical_setup, K=superficial_analysis, L=importance_puffery, M=interpretive_meta, N=weasel_attribution, O=fake_strong_verb, P=synonym_cycling, Q=fake_profound_kicker, R=summary_recap, S=formatting_slop, T=em_dash_crutch, U=minimizing_complexity, V=undefined_jargon, W=ambiguous_reference, X=missing_version_qualifier, Y=magic_value, Z=stale_placeholder, AA=typo_or_misspelling, AB=passive_voice_overuse, AC=comma_splice, AD=dangling_modifier, AE=run_on_sentence, AF=subject_verb_disagreement, AG=wrong_homophone, AH=noun_pile_up",
			  "",
			  "A,Z,AA          | L0001: Empowering our users",
			  "AH              | L0002: Some typo or issue",
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
			## Document Scores
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

	it("formatStats formats execution stats with breakdown when mixed scopes", () => {
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
			## Stats
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
			## Stats
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
