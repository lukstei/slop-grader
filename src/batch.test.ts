import { describe, expect, it } from "vitest";
import {
	batchRegions,
	buildBatchRequest,
	estimateRegionTokens,
	lineMarker,
	type QuestionBatch,
} from "./batch.ts";
import { buildRegions } from "./region.ts";

describe("batch", () => {
	it("lineMarker formats line numbers with zero-padding", () => {
		const markers = [0, 9, 99, 999].map(lineMarker);
		expect(markers).toMatchInlineSnapshot(`
			[
			  "L0001",
			  "L0010",
			  "L0100",
			  "L1000",
			]
		`);
	});

	it("estimateRegionTokens includes context and question tokens", () => {
		const allLines = ["Line 1", "Line 2", "Line 3"];
		const region = [1];
		const tokens = estimateRegionTokens(region, allLines, 20);
		expect(tokens).toBeGreaterThan(0);
	});

	it("batchRegions packs regions and splits oversized continuous regions", () => {
		const allLines = Array.from({ length: 300 }, (_, i) => `Line ${i + 1}`);
		const rule = {
			type: "noul" as const,
			instructions: "test",
		};
		const targetIndices = Array.from({ length: 300 }, (_, i) => i);
		const regions = buildRegions(targetIndices);
		const batches = batchRegions(regions, allLines, "test_rule", rule, 100_000);
		expect(batches.map((b) => b.regions.flat().length)).toMatchInlineSnapshot(`
			[
			  255,
			  45,
			]
		`);
		expect(batches[0].ruleId).toBe("test_rule");
		expect(batches[0].question).toEqual(rule);
		expect(batches[0].tokenCount).toBeGreaterThan(0);
	});

	it("batchRegions returns empty array for empty regions", () => {
		const rule = {
			type: "noul" as const,
			instructions: "test",
		};
		expect(batchRegions([], [], "test_rule", rule)).toMatchInlineSnapshot(`[]`);
	});

	it("buildBatchRequest generates formatted state with surrounding context and target questions", () => {
		const allLines = [
			"Context before",
			"Target line 1",
			"Target line 2",
			"Context after",
		];
		const region = [1, 2];
		const qDef = {
			type: "noul" as const,
			instructions: "Does this contain slop?",
		};
		const batch: QuestionBatch = {
			ruleId: "slop_rule",
			question: qDef,
			tokenCount: 100,
			regions: [region],
		};
		const result = buildBatchRequest(batch, allLines);
		expect(result).toMatchInlineSnapshot(`
			{
			  "batchQuestions": {
			    "L0002": {
			      "instructions": "For the line L0002 answer: Does this contain slop?",
			      "type": "noul",
			    },
			    "L0003": {
			      "instructions": "For the line L0003 answer: Does this contain slop?",
			      "type": "noul",
			    },
			  },
			  "state": "L0001| Context before
			L0002| Target line 1
			L0003| Target line 2
			L0004| Context after",
			}
		`);
	});

	it("buildBatchRequest inserts ellipsis between disjoint regions in state", () => {
		const allLines = Array.from({ length: 100 }, (_, i) => `Line ${i + 1}`);
		const qDef = {
			type: "noul" as const,
			instructions: "Check slop",
		};
		const batch: QuestionBatch = {
			ruleId: "slop_rule",
			question: qDef,
			tokenCount: 200,
			regions: [[0], [50]],
		};
		const result = buildBatchRequest(batch, allLines);
		expect(result.state).toContain("L0011| Line 11\n...\nL0041| Line 41");
	});

	it("batchRegions splits 2-element region with accurate non-zero tokenCount", () => {
		const allLines = ["Alpha line", "Beta line"];
		const qDef = {
			type: "noul" as const,
			instructions: "Check slop",
		};
		const batches = batchRegions([[0, 1]], allLines, "test_rule", qDef, 40);
		expect(batches.length).toBe(2);
		expect(batches[0].tokenCount).toBeGreaterThan(0);
		expect(batches[1].tokenCount).toBeGreaterThan(0);
	});

	it("batchRegions emits single oversized target without throwing", () => {
		const allLines = ["Single huge line"];
		const qDef = {
			type: "noul" as const,
			instructions: "Check slop",
		};
		const batches = batchRegions([[0]], allLines, "test_rule", qDef, 1);
		expect(batches.length).toBe(1);
		expect(batches[0].regions).toEqual([[0]]);
		expect(batches[0].tokenCount).toBeGreaterThan(0);
	});

	it("buildBatchRequest throws if regions produce overlapping or unsorted indices", () => {
		const allLines = Array.from({ length: 50 }, (_, i) => `Line ${i + 1}`);
		const qDef = {
			type: "noul" as const,
			instructions: "Does this contain slop?",
		};
		const batch: QuestionBatch = {
			ruleId: "slop_rule",
			question: qDef,
			tokenCount: 0,
			regions: [[20], [15]],
		};
		expect(() =>
			buildBatchRequest(batch, allLines),
		).toThrowErrorMatchingInlineSnapshot(
			`[AssertionError: batch line indices must be sorted and non-overlapping]`,
		);
	});
});
