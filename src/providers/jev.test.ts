import { TypeSafeClient } from "@typesafe-ai/sdk";
import { describe, expect, it } from "vitest";
import { JevProvider } from "./jev.ts";

describe("JevProvider", () => {
	it("throws assertion error when TYPESAFE_API_KEY is missing and no client is provided", () => {
		const original = process.env.TYPESAFE_API_KEY;
		delete process.env.TYPESAFE_API_KEY;
		try {
			expect(() => new JevProvider()).toThrow(
				"Missing TYPESAFE_API_KEY environment variable.",
			);
		} finally {
			if (original !== undefined) {
				process.env.TYPESAFE_API_KEY = original;
			}
		}
	});

	it("translates requests, normalizes model name, and formats responses", async () => {
		let capturedRequest: Record<string, unknown> | null = null;

		const mockFetch = async (_input: string, init?: RequestInit) => {
			capturedRequest = JSON.parse(init?.body as string);

			return new Response(
				JSON.stringify({
					model: "jev-1.13.0",
					answers: {
						is_slop: {
							type: "noul",
							noul: 0.92,
						},
						quality: {
							type: "score",
							score: 2.5,
							confidence: 0.88,
							legend: {
								"0": "Poor",
								"1": "Fair",
								"2": "Good",
								"3": "Excellent",
							},
							probabilities: {
								"0": 0.02,
								"1": 0.08,
								"2": 0.8,
								"3": 0.1,
							},
						},
					},
					usage: {
						input_tokens: 120,
						output_tokens: 30,
					},
				}),
				{
					status: 200,
					headers: { "Content-Type": "application/json" },
				},
			);
		};

		const client = new TypeSafeClient({
			apiKey: "test-key",
			fetch: mockFetch,
		});
		const provider = new JevProvider(client);

		const result = await provider.createDecision({
			model: "typesafe/jev-1.13",
			state: "This is a transformative cutting-edge paradigm shift.",
			questions: {
				is_slop: {
					type: "noul",
					instructions: "Is this text AI slop?",
					criteria: {
						true: "Contains buzzwords",
						false: "Natural writing",
					},
				},
				quality: {
					type: "score",
					instructions: "Rate the quality",
					criteria: ["Poor", "Fair", "Good", "Excellent"],
				},
			},
		});

		expect(capturedRequest).toMatchInlineSnapshot(`
			{
			  "model": "jev-1.13.0",
			  "questions": {
			    "is_slop": {
			      "criteria": {
			        "false": "Natural writing",
			        "true": "Contains buzzwords",
			      },
			      "instructions": "Is this text AI slop?",
			      "type": "noul",
			    },
			    "quality": {
			      "criteria": [
			        "Poor",
			        "Fair",
			        "Good",
			        "Excellent",
			      ],
			      "instructions": "Rate the quality",
			      "type": "score",
			    },
			  },
			  "state": "This is a transformative cutting-edge paradigm shift.",
			}
		`);

		expect(result).toMatchInlineSnapshot(`
			{
			  "answers": {
			    "is_slop": {
			      "noul": 0.92,
			      "type": "noul",
			    },
			    "quality": {
			      "confidence": 0.88,
			      "legend": {
			        "0": "Poor",
			        "1": "Fair",
			        "2": "Good",
			        "3": "Excellent",
			      },
			      "probabilities": {
			        "0": 0.02,
			        "1": 0.08,
			        "2": 0.8,
			        "3": 0.1,
			      },
			      "score": 2.5,
			      "type": "score",
			    },
			  },
			}
		`);
	});

	it("overrides default model directly without modification", async () => {
		let capturedRequest: Record<string, unknown> | null = null;
		const mockFetch = async (_input: string, init?: RequestInit) => {
			capturedRequest = JSON.parse(init?.body as string);
			return new Response(
				JSON.stringify({
					model: "custom-model",
					answers: {
						is_slop: { type: "noul", noul: 0.1 },
					},
					usage: { input_tokens: 10, output_tokens: 5 },
				}),
				{ status: 200, headers: { "Content-Type": "application/json" } },
			);
		};

		const client = new TypeSafeClient({ apiKey: "test-key", fetch: mockFetch });
		const provider = new JevProvider(client, "custom-model");
		await provider.createDecision({
			model: "",
			state: "Text",
			questions: {
				is_slop: { type: "noul", instructions: "slop?" },
			},
		});

		expect(capturedRequest).toMatchInlineSnapshot(`
			{
			  "model": "custom-model",
			  "questions": {
			    "is_slop": {
			      "instructions": "slop?",
			      "type": "noul",
			    },
			  },
			  "state": "Text",
			}
		`);
	});

	it("throws descriptive error when gateway returns HTML with status 200", async () => {
		const mockFetch = async () => {
			return new Response("<html><body>502 Bad Gateway</body></html>", {
				status: 200,
				headers: { "Content-Type": "text/html" },
			});
		};

		const client = new TypeSafeClient({ apiKey: "test-key", fetch: mockFetch });
		const provider = new JevProvider(client);

		await expect(
			provider.createDecision({
				model: "",
				state: "Text",
				questions: {
					is_slop: { type: "noul", instructions: "slop?" },
				},
			}),
		).rejects.toThrowErrorMatchingInlineSnapshot(
			`[Error: Provider (jev) returned invalid response: received non-JSON response "<html><body>502 Bad Gateway</body></html>"]`,
		);
	});

	it("throws descriptive error when response lacks answers object", async () => {
		const mockFetch = async () => {
			return new Response(JSON.stringify({ model: "jev-1.13.0" }), {
				status: 200,
				headers: { "Content-Type": "application/json" },
			});
		};

		const client = new TypeSafeClient({ apiKey: "test-key", fetch: mockFetch });
		const provider = new JevProvider(client);

		await expect(
			provider.createDecision({
				model: "",
				state: "Text",
				questions: {
					is_slop: { type: "noul", instructions: "slop?" },
				},
			}),
		).rejects.toThrowErrorMatchingInlineSnapshot(
			`[Error: Provider (jev) returned invalid response: missing answers object]`,
		);
	});
});
