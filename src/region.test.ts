import { describe, expect, it } from "vitest";
import { buildRegions, splitRegion } from "./region.ts";

describe("region", () => {
	it("buildRegions creates context-padded regions and merges near targets", () => {
		const targets = [49, 54, 89];
		const regions = buildRegions(targets);
		expect(regions).toMatchInlineSnapshot(`
			[
			  [
			    49,
			    54,
			  ],
			  [
			    89,
			  ],
			]
		`);
	});

	it("buildRegions returns empty array for empty targets", () => {
		expect(buildRegions([])).toMatchInlineSnapshot(`[]`);
	});

	it("splitRegion splits a region into two subregions", () => {
		const region = [14, 19, 24];
		const [left, right] = splitRegion(region, 1);
		expect(left).toMatchInlineSnapshot(`
			[
			  14,
			  19,
			]
		`);
		expect(right).toMatchInlineSnapshot(`
			[
			  24,
			]
		`);
	});

	it("splitRegion asserts valid splitIndex bounds", () => {
		const region = [10, 20];
		expect(() => splitRegion(region, -1)).toThrowErrorMatchingInlineSnapshot(
			`[AssertionError: splitIndex out of bounds]`,
		);
		expect(() => splitRegion(region, 1)).toThrowErrorMatchingInlineSnapshot(
			`[AssertionError: splitIndex out of bounds]`,
		);
	});
});
