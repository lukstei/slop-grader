import assert from "node:assert/strict";
import type { DecisionsRequest } from "@openrouter/sdk/models/decisionsrequest";
import type { Answers } from "@openrouter/sdk/models/decisionsresponse";
import type { Provider } from "../provider.ts";

const OPENROUTER_API_URL = "https://openrouter.ai/api/alpha/decisions";
const DEFAULT_MODEL = "typesafe/jev-1.13";

export class OpenRouterProvider implements Provider {
	readonly name = "openrouter" as const;
	readonly model: string;
	readonly #apiKey: string;

	constructor(model?: string) {
		const apiKey = process.env.OPENROUTER_API_KEY;
		assert(apiKey, "Missing OPENROUTER_API_KEY environment variable.");
		this.#apiKey = apiKey;
		this.model = model ?? DEFAULT_MODEL;
	}

	async createDecision(
		req: DecisionsRequest,
	): Promise<{ answers: Record<string, Answers> }> {
		const res = await fetch(OPENROUTER_API_URL, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${this.#apiKey}`,
			},
			body: JSON.stringify({ ...req, model: this.model }),
		});

		if (!res.ok) {
			const text = await res.text().catch(() => "");
			throw new Error(`OpenRouter API error (${res.status}): ${text}`);
		}

		return (await res.json()) as { answers: Record<string, Answers> };
	}
}
