import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { main } from "./main.ts";
import type { Answers, DecisionsRequest } from "./provider.ts";

describe("E2E CLI simulation", () => {
	const originalEnv = { ...process.env };

	beforeEach(() => {
		process.env.OPENROUTER_API_KEY = "test-openrouter-key";
	});

	afterEach(() => {
		process.env = { ...originalEnv };
		vi.restoreAllMocks();
		vi.unstubAllGlobals();
	});

	it("executes --json workflow, snapshots provider requests and JSON output", async () => {
		const capturedRequests: DecisionsRequest[] = [];

		vi.stubGlobal(
			"fetch",
			async (_url: string | URL | Request, init?: RequestInit) => {
				assert(init?.body, "request body required");
				const body = JSON.parse(init.body as string) as DecisionsRequest;
				capturedRequests.push(body);

				const answers: Record<string, Answers> = {};
				for (const [id, q] of Object.entries(body.questions)) {
					if (q.type === "noul") {
						answers[id] = { type: "noul", noul: id === "L0003" ? 0.95 : 0.05 };
					} else if (q.type === "score") {
						answers[id] = { type: "score", score: 0 };
					}
				}

				return new Response(JSON.stringify({ answers }), {
					status: 200,
					headers: { "Content-Type": "application/json" },
				});
			},
		);

		let capturedOutput = "";
		vi.spyOn(console, "log").mockImplementation((msg: string) => {
			capturedOutput += (capturedOutput ? "\n" : "") + msg;
		});

		await main([
			"-r",
			"test/fixtures/e2e-rules.md",
			"--provider",
			"openrouter",
			"--no-cache",
			"--stats",
			"--json",
			"test/fixtures/e2e-input.md",
		]);

		expect(capturedRequests).toMatchInlineSnapshot(`
			[
			  {
			    "model": "typesafe/jev-1.13",
			    "questions": {
			      "document_density": {
			        "criteria": [
			          "Weak — repetitive, verbose, or low information content",
			          "Adequate — mostly concise with occasional filler",
			          "Excellent — dense, crisp, and high-signal throughout",
			        ],
			        "instructions": "Evaluate information density and conciseness across the whole document.",
			        "type": "score",
			      },
			    },
			    "state": "# Architectural Overview

			We leverage synergy across services to streamline data pipelines.

			Simple code with minimal state always wins.
			",
			  },
			  {
			    "model": "typesafe/jev-1.13",
			    "questions": {
			      "L0001": {
			        "criteria": {
			          "false": "The line uses direct, concrete language.",
			          "true": "The line contains corporate buzzwords or empty filler jargon.",
			        },
			        "instructions": "For the line L0001 answer: Does the line contain empty corporate buzzwords like leverage, synergy, or empower?",
			        "type": "noul",
			      },
			      "L0003": {
			        "criteria": {
			          "false": "The line uses direct, concrete language.",
			          "true": "The line contains corporate buzzwords or empty filler jargon.",
			        },
			        "instructions": "For the line L0003 answer: Does the line contain empty corporate buzzwords like leverage, synergy, or empower?",
			        "type": "noul",
			      },
			      "L0005": {
			        "criteria": {
			          "false": "The line uses direct, concrete language.",
			          "true": "The line contains corporate buzzwords or empty filler jargon.",
			        },
			        "instructions": "For the line L0005 answer: Does the line contain empty corporate buzzwords like leverage, synergy, or empower?",
			        "type": "noul",
			      },
			    },
			    "state": "L0001| # Architectural Overview
			L0002| 
			L0003| We leverage synergy across services to streamline data pipelines.
			L0004| 
			L0005| Simple code with minimal state always wins.
			L0006| ",
			  },
			]
		`);

		const sanitized = capturedOutput.replaceAll(process.cwd(), "<CWD>");
		expect(JSON.parse(sanitized)).toMatchInlineSnapshot(`
			{
			  "file": "<CWD>/test/fixtures/e2e-input.md",
			  "rules": [
			    "<CWD>/test/fixtures/e2e-rules.md",
			  ],
			  "stats": {
			    "apiCalls": 2,
			    "apiQuestions": 4,
			    "docRules": 1,
			    "lineRules": 1,
			    "lines": 6,
			    "questions": 4,
			    "rules": 2,
			  },
			  "violations": {
			    "document": {
			      "document_density": {
			        "confidence": 0,
			        "label": "Weak — repetitive, verbose, or low information content",
			        "max": 2,
			        "score": 0,
			      },
			    },
			    "lines": [
			      {
			        "lineNum": 3,
			        "rules": [
			          "buzzword_check",
			        ],
			        "text": "We leverage synergy across services to streamline data pipelines.",
			      },
			    ],
			  },
			}
		`);
	});
});
