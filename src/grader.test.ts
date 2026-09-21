import { readdir } from "node:fs/promises";
import { join } from "node:path";
import type { Answers } from "@openrouter/sdk/models/decisionsresponse";
import { describe, expect, it } from "vitest";
import {
	buildBatchRequest,
	chunk,
	extractDocumentFlags,
	extractDocumentScores,
	extractLineFlags,
	gradeDocument,
	gradeLines,
	lineMarker,
	loadRules,
	loadRuleset,
	parseLines,
	splitRules,
} from "./grader.ts";
import type { Provider } from "./provider.ts";
import type { Rule } from "./types.ts";

describe("grader", () => {
	it("parseLines splits non-empty lines and preserves line numbers", () => {
		const input = `First line

Second line with whitespace
   
Third line`;
		const result = parseLines(input);
		expect(result).toMatchInlineSnapshot(`
			[
			  {
			    "lineNum": 1,
			    "text": "First line",
			  },
			  {
			    "lineNum": 3,
			    "text": "Second line with whitespace",
			  },
			  {
			    "lineNum": 5,
			    "text": "Third line",
			  },
			]
		`);
	});

	it("parseLines handles CRLF Windows newlines without retaining carriage returns", () => {
		const input = "First line\r\n\r\nSecond line\r\nThird line";
		const result = parseLines(input);
		expect(result).toMatchInlineSnapshot(`
			[
			  {
			    "lineNum": 1,
			    "text": "First line",
			  },
			  {
			    "lineNum": 3,
			    "text": "Second line",
			  },
			  {
			    "lineNum": 4,
			    "text": "Third line",
			  },
			]
		`);
	});

	it("lineMarker formats line numbers with zero-padding", () => {
		const markers = [1, 10, 100, 1000].map(lineMarker);
		expect(markers).toMatchInlineSnapshot(`
			[
			  "L0001",
			  "L0010",
			  "L0100",
			  "L1000",
			]
		`);
	});

	it("chunk splits array into chunks of given size", () => {
		const items = [1, 2, 3, 4, 5, 6, 7];
		const result = chunk(items, 3);
		expect(result).toMatchInlineSnapshot(`
			[
			  [
			    1,
			    2,
			    3,
			  ],
			  [
			    4,
			    5,
			    6,
			  ],
			  [
			    7,
			  ],
			]
		`);
	});

	it("splitRules separates line and document scoped rules", () => {
		const raw: Record<string, Rule>[] = [
			{
				banned_word: {
					scope: "line",
					type: "noul",
					instructions: "Check for banned words",
				},
			},
			{
				narrative_arc: {
					scope: "document",
					type: "score",
					instructions: "Evaluate narrative arc",
					criteria: ["Weak", "Medium", "Strong"],
				},
			},
		];
		const result = splitRules(raw);
		expect(result).toMatchInlineSnapshot(`
			{
			  "docRules": {
			    "narrative_arc": {
			      "criteria": [
			        "Weak",
			        "Medium",
			        "Strong",
			      ],
			      "instructions": "Evaluate narrative arc",
			      "type": "score",
			    },
			  },
			  "lineRules": {
			    "banned_word": {
			      "instructions": "Check for banned words",
			      "type": "noul",
			    },
			  },
			}
		`);
	});

	it("splitRules throws when rule scope is invalid", () => {
		const invalidRule: Record<string, Rule> = {
			bad_rule: {
				scope: "paragraph" as "line",
				type: "noul",
				instructions: "Invalid scope test",
			},
		};
		expect(() => splitRules([invalidRule])).toThrowErrorMatchingInlineSnapshot(
			`[AssertionError: Rule "bad_rule" is missing a valid "scope" field ("line" or "document")]`,
		);
	});

	it("splitRules throws when duplicate rule IDs exist across rulesets", () => {
		const ruleA: Record<string, Rule> = {
			same_rule: {
				scope: "line",
				type: "noul",
				instructions: "First",
			},
		};
		const ruleB: Record<string, Rule> = {
			same_rule: {
				scope: "document",
				type: "noul",
				instructions: "Second",
			},
		};
		expect(() => splitRules([ruleA, ruleB])).toThrowErrorMatchingInlineSnapshot(
			`[AssertionError: Duplicate rule "same_rule": rule identifiers must be unique across rulesets]`,
		);
	});

	it("buildBatchRequest generates formatted state and question prompts", () => {
		const lines = [
			{ lineNum: 1, text: "Hello world" },
			{ lineNum: 2, text: "Second line" },
		];
		const qDef = {
			type: "noul" as const,
			instructions: "Does this contain slop?",
		};
		const result = buildBatchRequest(lines, qDef);
		expect(result).toMatchInlineSnapshot(`
			{
			  "batchQuestions": {
			    "L0001": {
			      "instructions": "For the line L0001 answer: Does this contain slop?",
			      "type": "noul",
			    },
			    "L0002": {
			      "instructions": "For the line L0002 answer: Does this contain slop?",
			      "type": "noul",
			    },
			  },
			  "state": "L0001| Hello world
			L0002| Second line",
			}
		`);
	});

	it("extractLineFlags filters answers exceeding threshold", () => {
		const results: Array<{ qKey: string; answers: Record<string, Answers> }> = [
			{
				qKey: "rule_a",
				answers: {
					L0001: { type: "noul", noul: 0.9 },
					L0002: { type: "noul", noul: 0.5 },
				},
			},
			{
				qKey: "rule_b",
				answers: {
					L0001: { type: "noul", noul: 0.85 },
					L0003: { type: "noul", noul: 0.95 },
				},
			},
		];
		const flags = extractLineFlags(results, 0.8);
		expect(Array.from(flags.entries())).toMatchInlineSnapshot(`
			[
			  [
			    1,
			    [
			      "rule_a",
			      "rule_b",
			    ],
			  ],
			  [
			    3,
			    [
			      "rule_b",
			    ],
			  ],
			]
		`);
	});

	it("extractDocumentScores extracts score answers", () => {
		const answers = {
			clarity: {
				type: "score" as const,
				score: 2.5,
				confidence: 0.9,
			},
			other: {
				type: "noul" as const,
				noul: 0.1,
			},
		};
		const scores = extractDocumentScores(answers);
		expect(scores).toMatchInlineSnapshot(`
			{
			  "clarity": {
			    "confidence": 0.9,
			    "score": 2.5,
			    "type": "score",
			  },
			}
		`);
	});

	it("extractDocumentFlags extracts answers exceeding threshold", () => {
		const answers = {
			has_summary: { type: "noul" as const, noul: 0.95 },
			clean: { type: "noul" as const, noul: 0.2 },
			ignored: { type: "score" as const, score: 2 },
		};
		expect(extractDocumentFlags(answers, 0.8)).toEqual(["has_summary"]);
	});

	it("gradeLines and gradeDocument with mock provider", async () => {
		const mockProvider: Provider = {
			async createDecision(req) {
				const answers: Record<string, Answers> =
					typeof req.state === "string" && req.state.startsWith("L0001")
						? { L0001: { type: "noul", noul: 0.95 } }
						: {
								engagement: {
									type: "score",
									score: 2.8,
									confidence: 0.85,
								},
							};
				return { answers };
			},
		};

		const lines = [{ lineNum: 1, text: "Empowering innovation" }];
		const lineRules = {
			banned_word: {
				type: "noul" as const,
				instructions: "Detect buzzwords",
			},
		};
		const flags = await gradeLines(lines, lineRules, mockProvider);
		expect(Array.from(flags.entries())).toMatchInlineSnapshot(`
			[
			  [
			    1,
			    [
			      "banned_word",
			    ],
			  ],
			]
		`);

		const docRules = {
			engagement: {
				type: "score" as const,
				instructions: "Check engagement",
				criteria: ["Low", "Mid", "High"],
			},
		};
		const docResult = await gradeDocument(
			"Sample text",
			docRules,
			mockProvider,
		);
		expect(docResult).toMatchInlineSnapshot(`
			{
			  "flags": [],
			  "scores": {
			    "engagement": {
			      "confidence": 0.85,
			      "score": 2.8,
			      "type": "score",
			    },
			  },
			}
		`);
	});

	it("gradeDocument extracts document noul flags exceeding threshold", async () => {
		const mockProvider: Provider = {
			async createDecision() {
				return {
					answers: {
						has_exec_summary: { type: "noul", noul: 0.95 },
						clean_doc: { type: "noul", noul: 0.3 },
					},
				};
			},
		};
		const docRules = {
			has_exec_summary: {
				type: "noul" as const,
				instructions: "Check summary",
			},
			clean_doc: {
				type: "noul" as const,
				instructions: "Check clean",
			},
		};
		const result = await gradeDocument("Sample text", docRules, mockProvider);
		expect(result).toMatchInlineSnapshot(`
			{
			  "flags": [
			    "has_exec_summary",
			  ],
			  "scores": {},
			}
		`);
	});

	it("loadRules loads and splits markdown rule files", async () => {
		const { lineRules, docRules } = await loadRules([
			"rules/no-ai-slop.md",
			"rules/article-scores.md",
		]);
		expect(Object.keys(lineRules).length).toBe(21);
		expect(Object.keys(docRules).length).toBe(8);
		expect(lineRules.banned_word).toBeDefined();
		expect(docRules.engagement).toBeDefined();
	});

	it("loads and validates all rules in the rules directory cleanly", async () => {
		const files = (await readdir("rules")).filter((f) => f.endsWith(".md"));
		expect(files.length).toBeGreaterThan(0);

		for (const file of files) {
			const { lineRules, docRules } = await loadRules([join("rules", file)]);
			expect(
				Object.keys(lineRules).length + Object.keys(docRules).length,
			).toBeGreaterThan(0);
		}
	});

	it("loadRules loads grammar-german.md with all discrete rules", async () => {
		const { lineRules, docRules } = await loadRules([
			"rules/grammar-german.md",
		]);
		expect(Object.keys(lineRules)).toMatchInlineSnapshot(`
			[
			  "spelling_and_typos",
			  "compound_spacing",
			  "confused_words",
			  "comparison_particles",
			  "unnecessary_anglicisms",
			  "grammatical_agreement",
			  "double_perfect",
			  "subordinate_verb_position",
			  "negation_placement",
			  "comma_placement",
			  "salutation_comma",
			  "hyphen_and_dash",
			  "quotation_marks",
			]
		`);
		expect(docRules).toEqual({});
	});

	it("loadRules loads grammar-english.md with all discrete rules", async () => {
		const { lineRules, docRules } = await loadRules([
			"rules/grammar-english.md",
		]);
		expect(Object.keys(lineRules)).toMatchInlineSnapshot(`
			[
			  "spelling_and_typos",
			  "homophones_and_contractions",
			  "confused_words",
			  "grammatical_agreement",
			  "verb_inflection",
			  "tense_and_sequence",
			  "subjunctive_mood",
			  "verb_complementation",
			  "preposition_and_collocation",
			  "pronoun_case",
			  "pronoun_antecedent_and_order",
			  "possessive_apostrophe",
			  "run_on_and_comma_splice",
			  "dangling_modifier",
			  "double_negative",
			  "redundant_conjunction",
			  "comparatives_and_superlatives",
			  "determiners_and_quantifiers",
			  "article_usage",
			  "passive_voice_overuse",
			  "noun_pile_up",
			]
		`);
		expect(docRules).toEqual({});
	});

	it("loadRuleset loads a ruleset with full metadata", async () => {
		const info = await loadRuleset("rules/tech-docs.md");
		expect({
			name: info.name,
			scope: info.scope,
			rulesCount: info.rulesCount,
			lineRulesCount: info.lineRulesCount,
			docRulesCount: info.docRulesCount,
			lineRules: info.lineRules,
			docRules: info.docRules,
			description: info.description,
		}).toMatchInlineSnapshot(`
			{
			  "description": "Technical documentation rules: structure, task orientation, completeness, code examples, prerequisite clarity, and line-level technical writing standards.",
			  "docRules": [
			    "structure_navigability",
			    "task_orientation",
			    "completeness",
			    "code_example_quality",
			    "prerequisite_clarity",
			  ],
			  "docRulesCount": 5,
			  "lineRules": [
			    "minimizing_complexity",
			    "undefined_jargon",
			    "ambiguous_reference",
			    "missing_version_qualifier",
			    "magic_value",
			    "stale_placeholder",
			  ],
			  "lineRulesCount": 6,
			  "name": "tech-docs",
			  "rulesCount": 11,
			  "scope": "mixed",
			}
		`);
	});
});
