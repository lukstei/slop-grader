import assert from "node:assert/strict";
import type { LineIndex } from "./types.ts";

export const CONTEXT_LINES = 10;

export type LineRegion = LineIndex[];

export function buildRegions(targetIndices: LineIndex[]): LineRegion[] {
	if (targetIndices.length === 0) return [];
	const regions: LineRegion[] = [];
	let currentRegion: LineRegion = [targetIndices[0]];

	for (let i = 1; i < targetIndices.length; i++) {
		const idx = targetIndices[i];
		const lastIdx = currentRegion[currentRegion.length - 1];
		if (idx - lastIdx <= 2 * CONTEXT_LINES + 1) {
			currentRegion.push(idx);
		} else {
			regions.push(currentRegion);
			currentRegion = [idx];
		}
	}
	regions.push(currentRegion);
	return regions;
}

export function splitRegion(
	region: LineRegion,
	splitIndex: number,
): [LineRegion, LineRegion] {
	assert(
		splitIndex >= 0 && splitIndex < region.length - 1,
		"splitIndex out of bounds",
	);
	return [region.slice(0, splitIndex + 1), region.slice(splitIndex + 1)];
}
