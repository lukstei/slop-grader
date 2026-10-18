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

	it("sends request with default model typesafe/jev-1.13", async () => {
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
					{ status: 200, headers: { "Content-Type": "application/json" } },
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
			  "model": "typesafe/jev-1.13",
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

	it("throws descriptive error when gateway returns HTML with status 200", async () => {
		vi.stubGlobal(
			"fetch",
			vi.fn(async () => {
				return new Response("<html><body>502 Bad Gateway</body></html>", {
					status: 200,
					headers: { "Content-Type": "text/html" },
				});
			}),
		);

		const provider = new OpenRouterProvider();
		await expect(
			provider.createDecision({
				model: "",
				state: "Text",
				questions: { is_slop: { type: "noul", instructions: "slop?" } },
			}),
		).rejects.toThrowErrorMatchingInlineSnapshot(
			`[Error: Provider (openrouter) returned invalid response: received non-JSON response "<html><body>502 Bad Gateway</body></html>"]`,
		);
	});

	it("throws descriptive error when response lacks answers object", async () => {
		vi.stubGlobal(
			"fetch",
			vi.fn(async () => {
				return new Response(JSON.stringify({ model: "typesafe/jev-1.13" }), {
					status: 200,
					headers: { "Content-Type": "application/json" },
				});
			}),
		);

		const provider = new OpenRouterProvider();
		await expect(
			provider.createDecision({
				model: "",
				state: "Text",
				questions: { is_slop: { type: "noul", instructions: "slop?" } },
			}),
		).rejects.toThrowErrorMatchingInlineSnapshot(
			`[Error: Provider (openrouter) returned invalid response: missing answers object]`,
		);
	});

	it("uses OPENROUTER_BASE_URL env var and normalizes trailing slash", async () => {
		const originalBaseUrl = process.env.OPENROUTER_BASE_URL;
		process.env.OPENROUTER_BASE_URL = "https://proxy.example.com/openrouter/";
		let capturedUrl = "";

		vi.stubGlobal(
			"fetch",
			vi.fn(async (url: string | URL | Request) => {
				capturedUrl = url.toString();
				return new Response(JSON.stringify({ answers: {} }), {
					status: 200,
					headers: { "Content-Type": "application/json" },
				});
			}),
		);

		try {
			const provider = new OpenRouterProvider();
			expect(provider.baseUrl).toMatchInlineSnapshot(
				`"https://proxy.example.com/openrouter"`,
			);
			await provider.createDecision({
				model: "test-model",
				state: "text",
				questions: {},
			});
			expect(capturedUrl).toMatchInlineSnapshot(
				`"https://proxy.example.com/openrouter/api/alpha/decisions"`,
			);
		} finally {
			if (originalBaseUrl !== undefined) {
				process.env.OPENROUTER_BASE_URL = originalBaseUrl;
			} else {
				delete process.env.OPENROUTER_BASE_URL;
			}
		}
	});

	it("constructor baseUrl parameter overrides env var and handles full endpoint path", async () => {
		const originalBaseUrl = process.env.OPENROUTER_BASE_URL;
		process.env.OPENROUTER_BASE_URL = "https://env.example.com";
		let capturedUrl = "";

		vi.stubGlobal(
			"fetch",
			vi.fn(async (url: string | URL | Request) => {
				capturedUrl = url.toString();
				return new Response(JSON.stringify({ answers: {} }), {
					status: 200,
					headers: { "Content-Type": "application/json" },
				});
			}),
		);

		try {
			const provider = new OpenRouterProvider(
				undefined,
				"https://override.example.com/api/alpha/decisions/",
			);
			expect(provider.baseUrl).toMatchInlineSnapshot(
				`"https://override.example.com/api/alpha/decisions"`,
			);
			await provider.createDecision({
				model: "test-model",
				state: "text",
				questions: {},
			});
			expect(capturedUrl).toMatchInlineSnapshot(
				`"https://override.example.com/api/alpha/decisions"`,
			);
		} finally {
			if (originalBaseUrl !== undefined) {
				process.env.OPENROUTER_BASE_URL = originalBaseUrl;
			} else {
				delete process.env.OPENROUTER_BASE_URL;
			}
		}
	});
});
