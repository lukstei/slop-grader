import assert from "node:assert/strict";
import { estimateTokenCount } from "tokenx";
import { CONTEXT_LINES, type LineRegion, splitRegion } from "./region.ts";
import type { LineIndex, NoulQuestion } from "./types.ts";

export const MAX_BATCH_SIZE = 255;
export const TARGET_BATCH_TOKENS = Math.floor(64_000 * 0.8);

export function lineMarker(lineIndex: LineIndex): string {
	return `L${String(lineIndex + 1).padStart(4, "0")}`;
}

export function estimateRegionTokens(
	region: LineRegion,
	allLines: string[],
	questionTokens: number,
): number {
	const start = Math.max(0, region[0] - CONTEXT_LINES);
	const end = Math.min(
		allLines.length - 1,
		region[region.length - 1] + CONTEXT_LINES,
	);
	let tokens = 0;
	for (let i = start; i <= end; i++) {
		tokens += estimateTokenCount(allLines[i]) + 8;
	}
	tokens += region.length * (questionTokens + 8);
	return tokens;
}

export function batchRegions(
	regions: LineRegion[],
	allLines: string[],
	rule: NoulQuestion,
	maxTokens = TARGET_BATCH_TOKENS,
): LineRegion[][] {
	assert(maxTokens > 0, "maxTokens must be positive");
	if (regions.length === 0) return [];

	const questionTokens = estimateTokenCount(JSON.stringify(rule));
	const batches: LineRegion[][] = [];
	const queue = [...regions];

	let currentBatch: LineRegion[] = [];
	let currentTokens = 0;
	let currentTargets = 0;

	while (queue.length > 0) {
		const region = queue.shift();
		assert(region !== undefined, "region must exist in non-empty queue");
		const regionTokens = estimateRegionTokens(region, allLines, questionTokens);

		if (currentBatch.length > 0) {
			if (
				currentTokens + regionTokens <= maxTokens &&
				currentTargets + region.length <= MAX_BATCH_SIZE
			) {
				currentBatch.push(region);
				currentTokens += regionTokens;
				currentTargets += region.length;
			} else {
				batches.push(currentBatch);
				currentBatch = [];
				currentTokens = 0;
				currentTargets = 0;
				queue.unshift(region);
			}
		} else {
			if (regionTokens <= maxTokens && region.length <= MAX_BATCH_SIZE) {
				currentBatch.push(region);
				currentTokens += regionTokens;
				currentTargets += region.length;
			} else {
				assert(
					region.length > 1,
					"Single target exceeds max batch size/tokens",
				);
				let splitIndex = Math.min(region.length - 2, MAX_BATCH_SIZE - 1);
				while (splitIndex > 0) {
					const [left] = splitRegion(region, splitIndex);
					const leftTokens = estimateRegionTokens(
						left,
						allLines,
						questionTokens,
					);
					if (leftTokens <= maxTokens && left.length <= MAX_BATCH_SIZE) {
						break;
					}
					splitIndex--;
				}

				const [left, right] = splitRegion(region, splitIndex);
				currentBatch.push(left);
				batches.push(currentBatch);
				currentBatch = [];
				currentTokens = 0;
				currentTargets = 0;
				queue.unshift(right);
			}
		}
	}

	if (currentBatch.length > 0) {
		batches.push(currentBatch);
	}

	return batches;
}

export function isSorted(numbers: number[]): boolean {
	for (let i = 1; i < numbers.length; i++) {
		if (numbers[i] <= numbers[i - 1]) return false;
	}
	return true;
}

export function buildBatchRequest(
	batch: LineRegion[],
	allLines: string[],
	qDef: NoulQuestion,
): { state: string; batchQuestions: Record<string, NoulQuestion> } {
	assert(batch.length > 0, "batch must not be empty");
	const lineIndices: LineIndex[] = [];
	const batchQuestions: Record<string, NoulQuestion> = {};

	for (const region of batch) {
		const start = Math.max(0, region[0] - CONTEXT_LINES);
		const end = Math.min(
			allLines.length - 1,
			region[region.length - 1] + CONTEXT_LINES,
		);
		for (let i = start; i <= end; i++) {
			lineIndices.push(i);
		}
		for (const idx of region) {
			const id = lineMarker(idx);
			batchQuestions[id] = {
				...qDef,
				instructions: `For the line ${id} answer: ${qDef.instructions}`,
			};
		}
	}

	assert(
		isSorted(lineIndices),
		"batch line indices must be sorted and non-overlapping",
	);

	const state = lineIndices
		.map((i) => `${lineMarker(i)}| ${allLines[i]}`)
		.join("\n");

	return { state, batchQuestions };
}
