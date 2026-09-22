import { describe, expect, it } from "vitest";
import {
	batchRegions,
	buildBatchRequest,
	estimateRegionTokens,
	isSorted,
	lineMarker,
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
		const batches = batchRegions(regions, allLines, rule, 100_000);
		expect(batches.map((b) => b.flat().length)).toMatchInlineSnapshot(`
			[
			  255,
			  45,
			]
		`);
	});

	it("batchRegions returns empty array for empty regions", () => {
		const rule = {
			type: "noul" as const,
			instructions: "test",
		};
		expect(batchRegions([], [], rule)).toMatchInlineSnapshot(`[]`);
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
		const result = buildBatchRequest([region], allLines, qDef);
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

	it("isSorted validates strictly ascending arrays", () => {
		expect(isSorted([])).toBe(true);
		expect(isSorted([0])).toBe(true);
		expect(isSorted([0, 1, 2, 10])).toBe(true);
		expect(isSorted([0, 1, 1, 2])).toBe(false);
		expect(isSorted([2, 1])).toBe(false);
	});

	it("buildBatchRequest throws if regions produce overlapping or unsorted indices", () => {
		const allLines = Array.from({ length: 50 }, (_, i) => `Line ${i + 1}`);
		const qDef = {
			type: "noul" as const,
			instructions: "Does this contain slop?",
		};
		// Overlapping regions: region [20] and region [15] (out of order and overlapping context)
		expect(() =>
			buildBatchRequest([[20], [15]], allLines, qDef),
		).toThrowErrorMatchingInlineSnapshot(
			`[AssertionError: batch line indices must be sorted and non-overlapping]`,
		);
	});
});
