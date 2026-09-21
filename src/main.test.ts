import { relative } from "node:path";
import { describe, expect, it } from "vitest";
import { listBuiltinRulesets, parseCliArgs, resolveRulePath } from "./main.ts";

function stripAbsolutePaths(parsed: ReturnType<typeof parseCliArgs>) {
	return {
		...parsed,
		rulesPaths: parsed.rulesPaths.map((p) => relative(process.cwd(), p)),
	};
}

describe("main CLI", () => {
	it("listBuiltinRulesets returns built-in rulesets with complete metadata", async () => {
		const rulesets = (await listBuiltinRulesets()).map((r) => ({
			...r,
			path: relative(process.cwd(), r.path),
		}));
		expect(rulesets).toMatchInlineSnapshot(`
			[
			  {
			    "description": "Document-level quality scores: engagement, narrative arc, information density, originality, voice authenticity, and structure.",
			    "docRules": [
			      "engagement",
			      "narrative_arc",
			      "information_density",
			      "originality",
			      "voice_authenticity",
			      "headline_delivery",
			      "opening_strength",
			      "closing_strength",
			    ],
			    "docRulesCount": 8,
			    "lineRules": [],
			    "lineRulesCount": 0,
			    "name": "article-scores",
			    "path": "rules/article-scores.md",
			    "rulesCount": 8,
			    "scope": "document",
			  },
			  {
			    "description": "English grammar and style rules: spelling and confused words, grammatical agreement, verb forms and tenses, prepositions and idioms, pronoun case and reference, sentence structure and clauses, comparatives and determiners, passive voice, and noun pile-ups.",
			    "docRules": [],
			    "docRulesCount": 0,
			    "lineRules": [
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
			    ],
			    "lineRulesCount": 21,
			    "name": "grammar-english",
			    "path": "rules/grammar-english.md",
			    "rulesCount": 21,
			    "scope": "line",
			  },
			  {
			    "description": "Deutsche Grammatik-, Rechtschreib- und Zeichensetzungsregeln: Rechtschreibung und verwechselte Wörter, Kongruenz und Formenlehre, Satzbau und Wortstellung sowie Zeichensetzung und Typografie.",
			    "docRules": [],
			    "docRulesCount": 0,
			    "lineRules": [
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
			    ],
			    "lineRulesCount": 13,
			    "name": "grammar-german",
			    "path": "rules/grammar-german.md",
			    "rulesCount": 13,
			    "scope": "line",
			  },
			  {
			    "description": "Line-level rules to detect AI slop patterns: banned buzzwords, filler adverbs, empty phrases, puffery, rhetorical setups, and decorative closers.",
			    "docRules": [],
			    "docRulesCount": 0,
			    "lineRules": [
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
			      "bold_lead_in_list",
			    ],
			    "lineRulesCount": 21,
			    "name": "no-ai-slop",
			    "path": "rules/no-ai-slop.md",
			    "rulesCount": 21,
			    "scope": "line",
			  },
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
			    "path": "rules/tech-docs.md",
			    "rulesCount": 11,
			    "scope": "mixed",
			  },
			]
		`);
	});

	it("resolveRulePath resolves bare names to built-in rules directory", () => {
		const result = resolveRulePath("no-ai-slop");
		expect(result).toMatch(/rules\/no-ai-slop\.md$/);
	});

	it("resolveRulePath resolves relative paths against cwd", () => {
		const result = resolveRulePath("./custom/rule.json");
		expect(result).toMatch(/custom\/rule\.json$/);
	});

	it("resolveRulePath preserves spaces and hash characters", () => {
		const spacePath = resolveRulePath("./my rules/rule.md");
		expect(spacePath).not.toContain("%20");
		expect(spacePath).toContain("my rules/rule.md");

		const hashPath = resolveRulePath("./c#_rules.md");
		expect(hashPath).toContain("c#_rules.md");
	});

	it("parseCliArgs parses valid arguments with defaults", () => {
		const parsed = parseCliArgs(["-r", "no-ai-slop", "README.md"]);
		expect(stripAbsolutePaths(parsed)).toMatchInlineSnapshot(`
			{
			  "check": false,
			  "debug": false,
			  "file": "README.md",
			  "help": false,
			  "json": false,
			  "listRulesets": false,
			  "model": undefined,
			  "provider": undefined,
			  "rulesPaths": [
			    "rules/no-ai-slop.md",
			  ],
			  "stats": false,
			  "version": false,
			}
		`);
	});

	it("parseCliArgs parses multiple rules and options", () => {
		const parsed = parseCliArgs([
			"-r",
			"no-ai-slop",
			"-r",
			"tech-docs",
			"-p",
			"openrouter",
			"--json",
			"README.md",
		]);
		expect(stripAbsolutePaths(parsed)).toMatchInlineSnapshot(`
			{
			  "check": false,
			  "debug": false,
			  "file": "README.md",
			  "help": false,
			  "json": true,
			  "listRulesets": false,
			  "model": undefined,
			  "provider": "openrouter",
			  "rulesPaths": [
			    "rules/no-ai-slop.md",
			    "rules/tech-docs.md",
			  ],
			  "stats": false,
			  "version": false,
			}
		`);
	});

	it("parseCliArgs parses --check flag and -c alias", () => {
		const parsedLong = parseCliArgs(["--check", "-r", "no-ai-slop"]);
		expect(stripAbsolutePaths(parsedLong)).toMatchInlineSnapshot(`
			{
			  "check": true,
			  "debug": false,
			  "file": undefined,
			  "help": false,
			  "json": false,
			  "listRulesets": false,
			  "model": undefined,
			  "provider": undefined,
			  "rulesPaths": [
			    "rules/no-ai-slop.md",
			  ],
			  "stats": false,
			  "version": false,
			}
		`);

		const parsedShort = parseCliArgs(["-c", "-r", "no-ai-slop"]);
		expect(parsedShort.check).toBe(true);

		const parsedPositional = parseCliArgs(["--check", "rules/no-ai-slop.md"]);
		expect(stripAbsolutePaths(parsedPositional)).toMatchInlineSnapshot(`
			{
			  "check": true,
			  "debug": false,
			  "file": "rules/no-ai-slop.md",
			  "help": false,
			  "json": false,
			  "listRulesets": false,
			  "model": undefined,
			  "provider": undefined,
			  "rulesPaths": [
			    "rules/no-ai-slop.md",
			  ],
			  "stats": false,
			  "version": false,
			}
		`);
	});

	it("parseCliArgs parses --model flag and -m alias", () => {
		const parsedLong = parseCliArgs([
			"-r",
			"no-ai-slop",
			"--model",
			"jev-preview",
			"README.md",
		]);
		expect(parsedLong.model).toBe("jev-preview");

		const parsedShort = parseCliArgs([
			"-r",
			"no-ai-slop",
			"-m",
			"custom-model",
			"README.md",
		]);
		expect(parsedShort.model).toBe("custom-model");
	});

	it("parseCliArgs parses --stats flag", () => {
		const parsed = parseCliArgs(["-r", "no-ai-slop", "--stats", "README.md"]);
		expect(parsed.stats).toBe(true);
	});

	it("parseCliArgs parses --debug flag and -d alias", () => {
		const parsedLong = parseCliArgs([
			"-r",
			"no-ai-slop",
			"--debug",
			"README.md",
		]);
		expect(parsedLong.debug).toBe(true);

		const parsedShort = parseCliArgs(["-r", "no-ai-slop", "-d", "README.md"]);
		expect(parsedShort.debug).toBe(true);
	});

	it("parseCliArgs parses --help and -h flags", () => {
		expect(parseCliArgs(["--help"]).help).toBe(true);
		expect(parseCliArgs(["-h"]).help).toBe(true);
	});

	it("parseCliArgs parses --version and -v flags", () => {
		expect(parseCliArgs(["--version"]).version).toBe(true);
		expect(parseCliArgs(["-v"]).version).toBe(true);
	});

	it("parseCliArgs parses --list-rulesets and -l flags", () => {
		expect(parseCliArgs(["--list-rulesets"]).listRulesets).toBe(true);
		expect(parseCliArgs(["-l"]).listRulesets).toBe(true);
		expect(parseCliArgs(["-l", "--json"]).json).toBe(true);
	});

	it("parseCliArgs throws usage on missing arguments", () => {
		expect(() => parseCliArgs([])).toThrowErrorMatchingInlineSnapshot(
			`[Error: usage: node main.ts [-c|--check] [-l|--list-rulesets] -r <name|path> [-r ...] [--provider <jev|openrouter>] [--model <model>] [--json] [--stats] [--debug] [-h|--help] [-v|--version] [file]]`,
		);
		expect(() =>
			parseCliArgs(["README.md"]),
		).toThrowErrorMatchingInlineSnapshot(
			`[Error: usage: node main.ts [-c|--check] [-l|--list-rulesets] -r <name|path> [-r ...] [--provider <jev|openrouter>] [--model <model>] [--json] [--stats] [--debug] [-h|--help] [-v|--version] [file]]`,
		);
		expect(() =>
			parseCliArgs(["-r", "no-ai-slop"]),
		).toThrowErrorMatchingInlineSnapshot(
			`[Error: usage: node main.ts [-c|--check] [-l|--list-rulesets] -r <name|path> [-r ...] [--provider <jev|openrouter>] [--model <model>] [--json] [--stats] [--debug] [-h|--help] [-v|--version] [file]]`,
		);
		expect(() => parseCliArgs(["--check"])).toThrowErrorMatchingInlineSnapshot(
			`[Error: usage: node main.ts [-c|--check] [-l|--list-rulesets] -r <name|path> [-r ...] [--provider <jev|openrouter>] [--model <model>] [--json] [--stats] [--debug] [-h|--help] [-v|--version] [file]]`,
		);
	});

	it("parseCliArgs throws on invalid provider", () => {
		expect(() =>
			parseCliArgs(["-r", "no-ai-slop", "-p", "invalid", "README.md"]),
		).toThrowErrorMatchingInlineSnapshot(
			`[Error: Unknown provider "invalid". Valid values: jev, openrouter]`,
		);
	});
});
