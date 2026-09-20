import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { OpenRouterProvider } from "./openrouter.ts";

describe("OpenRouterProvider", () => {
	const originalApiKey = process.env.OPENROUTER_API_KEY;

	beforeEach(() => {
		process.env.OPENROUTER_API_KEY = "test-openrouter-key";
	});

	afterEach(() => {
		if (originalApiKey !== undefined) {
			process.env.OPENROUTER_API_KEY = originalApiKey;
		} else {
			delete process.env.OPENROUTER_API_KEY;
		}
		vi.restoreAllMocks();
	});

	it("throws assertion error when OPENROUTER_API_KEY is missing", () => {
		delete process.env.OPENROUTER_API_KEY;
		expect(() => new OpenRouterProvider()).toThrow(
			"Missing OPENROUTER_API_KEY environment variable.",
		);
	});

	it("sends request with default model ~typesafe/jev-latest", async () => {
		let capturedUrl = "";
		let capturedInit: RequestInit | undefined;

		vi.stubGlobal(
			"fetch",
			vi.fn(async (url: string | URL | Request, init?: RequestInit) => {
				capturedUrl = url.toString();
				capturedInit = init;

				return new Response(
					JSON.stringify({
						answers: {
							is_slop: {
								type: "noul",
								noul: 0.85,
							},
						},
					}),
					{
						status: 200,
						headers: { "Content-Type": "application/json" },
					},
				);
			}),
		);

		const provider = new OpenRouterProvider();
		const result = await provider.createDecision({
			model: "different/model",
			state: "Sample text",
			questions: {
				is_slop: {
					type: "noul",
					instructions: "Is this slop?",
				},
			},
		});

		expect(capturedUrl).toMatchInlineSnapshot(
			`"https://openrouter.ai/api/alpha/decisions"`,
		);
		expect(JSON.parse(capturedInit?.body as string)).toMatchInlineSnapshot(`
			{
			  "model": "~typesafe/jev-latest",
			  "questions": {
			    "is_slop": {
			      "instructions": "Is this slop?",
			      "type": "noul",
			    },
			  },
			  "state": "Sample text",
			}
		`);
		expect(result).toMatchInlineSnapshot(`
			{
			  "answers": {
			    "is_slop": {
			      "noul": 0.85,
			      "type": "noul",
			    },
			  },
			}
		`);
	});

	it("throws on non-200 response", async () => {
		vi.stubGlobal(
			"fetch",
			vi.fn(async () => {
				return new Response("Invalid request", { status: 400 });
			}),
		);

		const provider = new OpenRouterProvider();
		await expect(
			provider.createDecision({
				model: "~typesafe/jev-latest",
				state: "Sample",
				questions: {},
			}),
		).rejects.toThrow("OpenRouter API error (400): Invalid request");
	});

	it("overrides default model directly without modification", async () => {
		let capturedInit: RequestInit | undefined;
		vi.stubGlobal(
			"fetch",
			vi.fn(async (_url: string | URL | Request, init?: RequestInit) => {
				capturedInit = init;
				return new Response(
					JSON.stringify({
						answers: { is_slop: { type: "noul", noul: 0.5 } },
					}),
					{
						status: 200,
						headers: { "Content-Type": "application/json" },
					},
				);
			}),
		);

		const provider = new OpenRouterProvider("custom-model");
		await provider.createDecision({
			model: "",
			state: "Text",
			questions: { is_slop: { type: "noul", instructions: "slop?" } },
		});

		expect(JSON.parse(capturedInit?.body as string).model).toBe("custom-model");
	});
});
