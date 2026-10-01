import { describe, expect, it } from "vitest";
import { type Provider, withConcurrency } from "./provider.ts";

describe("withConcurrency", () => {
	it("limits active concurrent requests to limit and preserves FIFO order", async () => {
		let active = 0;
		let maxActive = 0;
		const order: number[] = [];

		const mockProvider: Provider = {
			name: "jev",
			model: "test-model",
			async createDecision(req) {
				const id = Number(Object.keys(req.questions)[0]);
				active++;
				maxActive = Math.max(maxActive, active);
				// Small delay to simulate async network roundtrip
				await new Promise((resolve) => setTimeout(resolve, 15));
				order.push(id);
				active--;
				return { answers: {} };
			},
		};

		const bounded = withConcurrency(mockProvider, 2);
		expect(bounded.concurrency).toBe(2);

		const tasks = [1, 2, 3, 4, 5].map((id) =>
			bounded.createDecision({
				model: "test-model",
				state: "",
				questions: { [String(id)]: { type: "noul", instructions: "" } },
			}),
		);

		await Promise.all(tasks);

		expect(maxActive).toBe(2);
		expect(order).toEqual([1, 2, 3, 4, 5]);
	});

	it("drains queue and continues processing when in-flight request fails", async () => {
		let active = 0;
		let maxActive = 0;
		const completed: number[] = [];

		const mockProvider: Provider = {
			name: "jev",
			model: "test-model",
			async createDecision(req) {
				const id = Number(Object.keys(req.questions)[0]);
				active++;
				maxActive = Math.max(maxActive, active);
				await new Promise((resolve) => setTimeout(resolve, 10));
				active--;
				if (id === 2) {
					throw new Error("Request 2 failed");
				}
				completed.push(id);
				return { answers: {} };
			},
		};

		const bounded = withConcurrency(mockProvider, 2);

		const results = await Promise.allSettled(
			[1, 2, 3, 4].map((id) =>
				bounded.createDecision({
					model: "test-model",
					state: "",
					questions: { [String(id)]: { type: "noul", instructions: "" } },
				}),
			),
		);

		expect(maxActive).toBe(2);
		expect(results[1].status).toBe("rejected");
		expect(completed).toEqual([1, 3, 4]);
	});

	it("does not re-wrap already bounded provider", () => {
		const mockProvider: Provider = {
			name: "jev",
			model: "test-model",
			async createDecision() {
				return { answers: {} };
			},
		};

		const bounded1 = withConcurrency(mockProvider, 3);
		const bounded2 = withConcurrency(bounded1, 5);

		expect(bounded2).toBe(bounded1);
		expect(bounded2.concurrency).toBe(3);
	});

	it("throws assertion error on invalid concurrency limit", () => {
		const mockProvider: Provider = {
			name: "jev",
			model: "test-model",
			async createDecision() {
				return { answers: {} };
			},
		};

		expect(() => withConcurrency(mockProvider, 0)).toThrow(
			'Invalid concurrency "0". Must be a positive integer.',
		);
		expect(() => withConcurrency(mockProvider, -1)).toThrow(
			'Invalid concurrency "-1". Must be a positive integer.',
		);
		expect(() => withConcurrency(mockProvider, 1.5)).toThrow(
			'Invalid concurrency "1.5". Must be a positive integer.',
		);
		expect(() => withConcurrency(mockProvider, Number.NaN)).toThrow(
			'Invalid concurrency "NaN". Must be a positive integer.',
		);
	});
});
