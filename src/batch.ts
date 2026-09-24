import assert from "node:assert/strict";
import { estimateTokenCount } from "tokenx";
import { CONTEXT_LINES, type LineRegion, splitRegion } from "./region.ts";
import type { LineIndex, NoulQuestion } from "./types.ts";

export const MAX_BATCH_SIZE = 255;
export const TARGET_BATCH_TOKENS = Math.floor(64_000 * 0.8);

export function lineMarker(lineIndex: LineIndex): string {
	return `L${String(lineIndex + 1).padStart(4, "0")}`;
}

export function estimateLineTokens(allLines: string[]): number[] {
	return allLines.map((line) => estimateTokenCount(line) + 8);
}

export function estimateRegionTokens(
	region: LineRegion,
	lineTokens: number[],
	questionTokens: number,
): number {
	const start = Math.max(0, region[0] - CONTEXT_LINES);
	const end = Math.min(
		lineTokens.length - 1,
		region[region.length - 1] + CONTEXT_LINES,
	);
	let tokens = 0;
	for (let i = start; i <= end; i++) {
		tokens += lineTokens[i];
	}
	tokens += region.length * (questionTokens + 8);
	return tokens;
}

export type QuestionBatch = {
	ruleId: string;
	question: NoulQuestion;
	tokenCount: number;
	regions: LineRegion[];
};

export function batchRegions(
	regions: LineRegion[],
	lineTokens: number[],
	ruleId: string,
	question: NoulQuestion,
	maxTokens = TARGET_BATCH_TOKENS,
): QuestionBatch[] {
	assert(maxTokens > 0, "maxTokens must be positive");
	if (regions.length === 0) return [];

	const questionTokens = estimateTokenCount(JSON.stringify(question));
	const batches: QuestionBatch[] = [];
	const queue = [...regions];

	let currentBatch: LineRegion[] = [];
	let currentTokens = 0;
	let currentTargets = 0;

	while (queue.length > 0) {
		const region = queue.shift();
		assert(region !== undefined, "region must exist in non-empty queue");
		const regionTokens = estimateRegionTokens(
			region,
			lineTokens,
			questionTokens,
		);

		if (
			currentBatch.length > 0 &&
			(currentTokens + regionTokens > maxTokens ||
				currentTargets + region.length > MAX_BATCH_SIZE)
		) {
			batches.push({
				ruleId,
				question,
				tokenCount: currentTokens,
				regions: currentBatch,
			});
			currentBatch = [];
			currentTokens = 0;
			currentTargets = 0;
		}

		if (regionTokens <= maxTokens && region.length <= MAX_BATCH_SIZE) {
			currentBatch.push(region);
			currentTokens += regionTokens;
			currentTargets += region.length;
		} else if (region.length === 1) {
			batches.push({
				ruleId,
				question,
				tokenCount: regionTokens,
				regions: [region],
			});
		} else {
			let splitIndex = Math.min(region.length - 2, MAX_BATCH_SIZE - 1);
			let [left, right] = splitRegion(region, splitIndex);
			let leftTokens = estimateRegionTokens(left, lineTokens, questionTokens);
			while (splitIndex > 0 && leftTokens > maxTokens) {
				splitIndex--;
				[left, right] = splitRegion(region, splitIndex);
				leftTokens = estimateRegionTokens(left, lineTokens, questionTokens);
			}

			batches.push({
				ruleId,
				question,
				tokenCount: leftTokens,
				regions: [left],
			});
			queue.unshift(right);
		}
	}

	if (currentBatch.length > 0) {
		batches.push({
			ruleId,
			question,
			tokenCount: currentTokens,
			regions: currentBatch,
		});
	}

	return batches;
}

export function buildBatchRequest(
	batch: QuestionBatch,
	allLines: string[],
): { state: string; batchQuestions: Record<string, NoulQuestion> } {
	assert(batch.regions.length > 0, "batch must not be empty");
	const stateLines: string[] = [];
	const batchQuestions: Record<string, NoulQuestion> = {};
	let prevEnd = -1;

	for (let r = 0; r < batch.regions.length; r++) {
		if (r > 0) {
			stateLines.push("...| [omitted lines]");
		}
		const region = batch.regions[r];
		const start = Math.max(0, region[0] - CONTEXT_LINES);
		const end = Math.min(
			allLines.length - 1,
			region[region.length - 1] + CONTEXT_LINES,
		);
		assert(
			start > prevEnd,
			"batch line indices must be sorted and non-overlapping",
		);
		prevEnd = end;

		for (let i = start; i <= end; i++) {
			stateLines.push(`${lineMarker(i)}| ${allLines[i]}`);
		}
		for (const idx of region) {
			const id = lineMarker(idx);
			batchQuestions[id] = {
				...batch.question,
				instructions: `For the line ${id} answer: ${batch.question.instructions}`,
			};
		}
	}

	return { state: stateLines.join("\n"), batchQuestions };
}
