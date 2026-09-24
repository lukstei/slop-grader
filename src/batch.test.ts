import { describe, expect, it } from "vitest";
import {
	batchRegions,
	buildBatchRequest,
	estimateLineTokens,
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

	it("estimateLineTokens computes token counts per line", () => {
		const allLines = ["Line 1", "Line 2", "Line 3"];
		const lineTokens = estimateLineTokens(allLines);
		expect(lineTokens.length).toBe(3);
		expect(lineTokens.every((t) => t > 8)).toBe(true);
	});

	it("estimateRegionTokens includes context and question tokens", () => {
		const allLines = ["Line 1", "Line 2", "Line 3"];
		const lineTokens = estimateLineTokens(allLines);
		const region = [1];
		const tokens = estimateRegionTokens(region, lineTokens, 20);
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
		const lineTokens = estimateLineTokens(allLines);
		const batches = batchRegions(
			regions,
			lineTokens,
			"test_rule",
			rule,
			100_000,
		);
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
		expect(result.state).toContain(
			"L0011| Line 11\n...| [omitted lines]\nL0041| Line 41",
		);
	});

	it("batchRegions splits 2-element region with accurate non-zero tokenCount", () => {
		const allLines = ["Alpha line", "Beta line"];
		const qDef = {
			type: "noul" as const,
			instructions: "Check slop",
		};
		const lineTokens = estimateLineTokens(allLines);
		const batches = batchRegions([[0, 1]], lineTokens, "test_rule", qDef, 40);
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
		const lineTokens = estimateLineTokens(allLines);
		const batches = batchRegions([[0]], lineTokens, "test_rule", qDef, 1);
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

	it("batchRegions flushes currentBatch when next region exceeds maxTokens", () => {
		const allLines = Array.from({ length: 150 }, (_, i) => `Line ${i + 1}`);
		const qDef = {
			type: "noul" as const,
			instructions: "Check slop",
		};
		const regions = [[0], [50], [100]];
		const lineTokens = estimateLineTokens(allLines);
		const token1 = estimateRegionTokens([0], lineTokens, 20);
		const maxTokens = Math.floor(token1 * 1.5);
		const batches = batchRegions(
			regions,
			lineTokens,
			"test_rule",
			qDef,
			maxTokens,
		);
		expect(batches.length).toBe(3);
		expect(batches.map((b) => b.regions)).toEqual([[[0]], [[50]], [[100]]]);
	});

	it("batchRegions flushes currentBatch when target count exceeds MAX_BATCH_SIZE", () => {
		const allLines = Array.from({ length: 350 }, (_, i) => `Line ${i + 1}`);
		const qDef = {
			type: "noul" as const,
			instructions: "Check slop",
		};
		const targetIndices1 = Array.from({ length: 200 }, (_, i) => i);
		const targetIndices2 = Array.from({ length: 100 }, (_, i) => i + 250);
		const regions = [targetIndices1, targetIndices2];
		const lineTokens = estimateLineTokens(allLines);
		const batches = batchRegions(
			regions,
			lineTokens,
			"test_rule",
			qDef,
			1_000_000,
		);
		expect(batches.length).toBe(2);
		expect(batches[0].regions).toEqual([targetIndices1]);
		expect(batches[1].regions).toEqual([targetIndices2]);
	});

	it("batchRegions progressively decrements splitIndex when left slice exceeds maxTokens", () => {
		const allLines = [
			"A very very very very very long text line that uses a huge amount of tokens",
			"Another extremely long text line full of detailed description and verbose tokens",
			"A third verbose line with lots of tokens",
			"Short 1",
			"Short 2",
		];
		const qDef = {
			type: "noul" as const,
			instructions: "Check slop",
		};
		const lineTokens = estimateLineTokens(allLines);
		const token3Lines = estimateRegionTokens([0, 1, 2], lineTokens, 20);
		const maxTokens = Math.floor(token3Lines * 0.7);
		const batches = batchRegions(
			[[0, 1, 2, 3, 4]],
			lineTokens,
			"test_rule",
			qDef,
			maxTokens,
		);
		expect(batches.length).toBeGreaterThan(1);
	});
});
