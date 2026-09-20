import type { Answers } from "@openrouter/sdk/models/decisionsresponse";
import { describe, expect, it } from "vitest";
import {
	buildBatchRequest,
	chunk,
	extractDocumentScores,
	extractLineFlags,
	gradeDocument,
	gradeLines,
	lineMarker,
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
		expect(result).toMatchSnapshot();
	});

	it("lineMarker formats line numbers with zero-padding", () => {
		const markers = [1, 10, 100, 1000].map(lineMarker);
		expect(markers).toMatchSnapshot();
	});

	it("chunk splits array into chunks of given size", () => {
		const items = [1, 2, 3, 4, 5, 6, 7];
		const result = chunk(items, 3);
		expect(result).toMatchSnapshot();
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
		expect(result).toMatchSnapshot();
	});

	it("splitRules throws when rule scope is invalid", () => {
		const invalidRule: Record<string, Rule> = {
			bad_rule: {
				scope: "paragraph" as "line",
				type: "noul",
				instructions: "Invalid scope test",
			},
		};
		expect(() => splitRules([invalidRule])).toThrowErrorMatchingSnapshot();
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
		expect(result).toMatchSnapshot();
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
		expect(Array.from(flags.entries())).toMatchSnapshot();
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
		expect(scores).toMatchSnapshot();
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
		expect(Array.from(flags.entries())).toMatchSnapshot();

		const docRules = {
			engagement: {
				type: "score" as const,
				instructions: "Check engagement",
				criteria: ["Low", "Mid", "High"],
			},
		};
		const scores = await gradeDocument("Sample text", docRules, mockProvider);
		expect(scores).toMatchSnapshot();
	});
});
