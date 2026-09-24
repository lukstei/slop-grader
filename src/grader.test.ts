import { readdir } from "node:fs/promises";
import { join } from "node:path";
import type { Answers } from "@openrouter/sdk/models/decisionsresponse";
import { describe, expect, it } from "vitest";
import { LineCacheManager } from "./cache.ts";
import {
	assertCompleteAnswers,
	extractDocumentFlags,
	extractDocumentScores,
	extractLineFlags,
	gradeDocument,
	gradeLines,
	loadRules,
	loadRuleset,
	parseLines,
	splitRules,
} from "./grader.ts";
import type { Provider } from "./provider.ts";
import type { Rule } from "./types.ts";

describe("grader", () => {
	it("parseLines preserves all lines including empty lines", () => {
		const input = `First line

Second line with whitespace
   
Third line`;
		const result = parseLines(input);
		expect(result).toMatchInlineSnapshot(`
			[
			  "First line",
			  "",
			  "Second line with whitespace",
			  "   ",
			  "Third line",
			]
		`);
	});

	it("parseLines handles CRLF Windows newlines without retaining carriage returns", () => {
		const input = "First line\r\n\r\nSecond line\r\nThird line";
		const result = parseLines(input);
		expect(result).toMatchInlineSnapshot(`
			[
			  "First line",
			  "",
			  "Second line",
			  "Third line",
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
			    0,
			    [
			      "rule_a",
			      "rule_b",
			    ],
			  ],
			  [
			    2,
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
			name: "jev",
			model: "jev-1.13.0",
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

		const lines = ["Empowering innovation"];
		const lineRules = {
			banned_word: {
				type: "noul" as const,
				instructions: "Detect buzzwords",
			},
		};
		const { flags, cacheHits } = await gradeLines(
			lines,
			lineRules,
			mockProvider,
		);
		expect(cacheHits).toBe(0);
		expect(Array.from(flags.entries())).toMatchInlineSnapshot(`
			[
			  [
			    0,
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
			name: "jev",
			model: "jev-1.13.0",
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

	it("assertCompleteAnswers validates answer presence and completeness", () => {
		expect(() =>
			assertCompleteAnswers(undefined, ["L0001"], "jev"),
		).toThrowErrorMatchingInlineSnapshot(
			`[Error: Provider (jev) returned invalid response: missing answers object]`,
		);

		expect(() =>
			assertCompleteAnswers({}, ["L0001", "L0002"], "jev"),
		).toThrowErrorMatchingInlineSnapshot(
			`[Error: Provider (jev) returned incomplete answers: missing 2 of 2 answers]`,
		);

		expect(() =>
			assertCompleteAnswers(
				{ L0001: { type: "noul", noul: 0.1 } },
				["L0001", "L0002"],
				"openrouter",
			),
		).toThrowErrorMatchingInlineSnapshot(
			`[Error: Provider (openrouter) returned incomplete answers: missing 1 of 2 answers]`,
		);

		const valid = { L0001: { type: "noul" as const, noul: 0.1 } };
		expect(() => assertCompleteAnswers(valid, ["L0001"], "jev")).not.toThrow();
	});

	it("gradeLines throws when provider returns incomplete answers", async () => {
		const droppingProvider: Provider = {
			name: "jev",
			model: "jev-1.13.0",
			async createDecision() {
				return {
					answers: {
						L0001: { type: "noul", noul: 0.9 },
					},
				};
			},
		};

		const lines = ["First line", "Second line"];
		const questions = {
			rule_a: { type: "noul" as const, instructions: "Check rule A" },
		};

		await expect(
			gradeLines(lines, questions, droppingProvider),
		).rejects.toThrowErrorMatchingInlineSnapshot(
			`[Error: Provider (jev) returned incomplete answers: missing 1 of 2 answers]`,
		);
	});

	it("gradeLines does not write to cache when provider returns incomplete answers", async () => {
		const { mkdtemp, rm } = await import("node:fs/promises");
		const { tmpdir } = await import("node:os");
		const tempDir = await mkdtemp(join(tmpdir(), "grader-partial-cache-test-"));

		try {
			const droppingProvider: Provider = {
				name: "jev",
				model: "jev-1.13.0",
				async createDecision() {
					return {
						answers: {
							L0001: { type: "noul", noul: 0.9 },
						},
					};
				},
			};

			const cacheManager = new LineCacheManager({
				baseDir: tempDir,
				provider: droppingProvider.name,
				model: droppingProvider.model,
			});

			const lines = ["First line", "Second line"];
			const questions = {
				rule_a: { type: "noul" as const, instructions: "Check rule A" },
			};

			await expect(
				gradeLines(lines, questions, droppingProvider, cacheManager),
			).rejects.toThrow();

			const cacheHits = await cacheManager.prefilterRule(
				"rule_a",
				questions.rule_a,
				[0, 1],
				new Map(),
			);
			expect(cacheHits.cachedScores.size).toBe(0);
		} finally {
			await rm(tempDir, { recursive: true, force: true });
		}
	});

	it("gradeDocument throws when provider returns incomplete answers", async () => {
		const droppingProvider: Provider = {
			name: "jev",
			model: "jev-1.13.0",
			async createDecision() {
				return {
					answers: {
						has_summary: { type: "noul", noul: 0.9 },
					},
				};
			},
		};

		const docRules = {
			has_summary: { type: "noul" as const, instructions: "Summary check" },
			quality: { type: "noul" as const, instructions: "Quality check" },
		};

		await expect(
			gradeDocument("Document text", docRules, droppingProvider),
		).rejects.toThrowErrorMatchingInlineSnapshot(
			`[Error: Provider (jev) returned incomplete answers: missing 1 of 2 answers]`,
		);
	});

	it("gradeLines skips provider calls when lines hit cache", async () => {
		const { mkdtemp, rm } = await import("node:fs/promises");
		const { tmpdir } = await import("node:os");
		const tempDir = await mkdtemp(join(tmpdir(), "grader-cache-test-"));

		try {
			let decisionCalls = 0;
			const countingProvider: Provider = {
				name: "jev",
				model: "jev-1.13.0",
				async createDecision(req) {
					decisionCalls++;
					const answers: Record<string, Answers> = {};
					for (const id of Object.keys(req.questions)) {
						answers[id] = { type: "noul", noul: id === "L0001" ? 0.95 : 0.1 };
					}
					return { answers };
				},
			};

			const lines = ["Empowering innovation", "Normal sentence here"];
			const lineRules = {
				banned_word: {
					type: "noul" as const,
					instructions: "Detect buzzwords",
				},
			};

			const cacheManager1 = new LineCacheManager({
				baseDir: tempDir,
				provider: countingProvider.name,
				model: countingProvider.model,
			});

			// Run 1: Cold cache -> provider called
			const run1 = await gradeLines(
				lines,
				lineRules,
				countingProvider,
				cacheManager1,
			);
			expect(decisionCalls).toBe(1);
			expect(run1.cacheHits).toBe(0);
			expect(run1.flags.get(0)).toEqual(["banned_word"]);
			expect(run1.flags.has(1)).toBe(false);

			// Run 2: Hot cache -> 0 provider calls, exact same flags
			const cacheManager2 = new LineCacheManager({
				baseDir: tempDir,
				provider: countingProvider.name,
				model: countingProvider.model,
			});
			const run2 = await gradeLines(
				lines,
				lineRules,
				countingProvider,
				cacheManager2,
			);
			expect(decisionCalls).toBe(1); // Still 1!
			expect(run2.cacheHits).toBe(2);
			expect(run2.flags.get(0)).toEqual(["banned_word"]);
			expect(run2.flags.has(1)).toBe(false);

			// Run 3: 1 line edited -> only edited line evaluated
			const editedLines = [
				"Empowering innovation", // cached
				"A brand new edited line", // uncached
			];
			const run3 = await gradeLines(
				editedLines,
				lineRules,
				countingProvider,
				cacheManager2,
			);
			expect(decisionCalls).toBe(2); // 1 extra call for the 1 edited line
			expect(run3.cacheHits).toBe(1);
		} finally {
			await rm(tempDir, { recursive: true, force: true });
		}
	});

	it("gradeLines handles sparse non-contiguous uncached lines across multiple regions", async () => {
		const { mkdtemp, rm } = await import("node:fs/promises");
		const { tmpdir } = await import("node:os");
		const tempDir = await mkdtemp(join(tmpdir(), "grader-sparse-cache-test-"));

		try {
			let decisionCalls = 0;
			const countingProvider: Provider = {
				name: "jev",
				model: "jev-1.13.0",
				async createDecision(req) {
					decisionCalls++;
					const answers: Record<string, Answers> = {};
					for (const id of Object.keys(req.questions)) {
						answers[id] = {
							type: "noul",
							noul: id === "L0031" || id === "L0081" ? 0.95 : 0.05,
						};
					}
					return { answers };
				},
			};

			const lineRules = {
				buzzword: {
					type: "noul" as const,
					instructions: "Check buzzwords",
				},
			};

			const cacheManager = new LineCacheManager({
				baseDir: tempDir,
				provider: countingProvider.name,
				model: countingProvider.model,
			});

			const allLines = Array.from(
				{ length: 100 },
				(_, i) => `Initial content line ${i + 1}`,
			);

			// Run 1: Warm entire cache for 100 lines
			const run1 = await gradeLines(
				allLines,
				lineRules,
				countingProvider,
				cacheManager,
			);
			expect(run1.cacheHits).toBe(0);
			const initialCalls = decisionCalls;

			// Run 2: Edit line 30 (index 30, marker L0031) and line 80 (index 80, marker L0081)
			const editedLines = [...allLines];
			editedLines[30] = "Modified buzzword line at 31";
			editedLines[80] = "Modified buzzword line at 81";

			const run2 = await gradeLines(
				editedLines,
				lineRules,
				countingProvider,
				cacheManager,
			);
			// 98 lines should hit cache, only the 2 separated lines should be evaluated
			expect(run2.cacheHits).toBe(98);
			expect(decisionCalls).toBeGreaterThan(initialCalls);
			expect(run2.flags.get(30)).toEqual(["buzzword"]);
			expect(run2.flags.get(80)).toEqual(["buzzword"]);
			expect(run2.flags.has(0)).toBe(false);

			// Run 3: Hot run on the edited document -> 100% cache hits, zero new calls
			const callsBeforeRun3 = decisionCalls;
			const run3 = await gradeLines(
				editedLines,
				lineRules,
				countingProvider,
				cacheManager,
			);
			expect(run3.cacheHits).toBe(100);
			expect(decisionCalls).toBe(callsBeforeRun3);
			expect(run3.flags.get(30)).toEqual(["buzzword"]);
			expect(run3.flags.get(80)).toEqual(["buzzword"]);
		} finally {
			await rm(tempDir, { recursive: true, force: true });
		}
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
