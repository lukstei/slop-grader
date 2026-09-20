import type { DecisionsRequest } from "@openrouter/sdk/models/decisionsrequest";
import type { Answers } from "@openrouter/sdk/models/decisionsresponse";
import type { Provider } from "../provider.ts";

const OPENROUTER_API_URL = "https://openrouter.ai/api/alpha/decisions";

export class OpenRouterProvider implements Provider {
	readonly #apiKey: string;

	constructor() {
		this.#apiKey = process.env.OPENROUTER_API_KEY ?? "";
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
			body: JSON.stringify(req),
		});

		if (!res.ok) {
			const text = await res.text().catch(() => "");
			throw new Error(`OpenRouter API error (${res.status}): ${text}`);
		}

		return (await res.json()) as { answers: Record<string, Answers> };
	}
}
