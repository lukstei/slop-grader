import assert from "node:assert/strict";
import type { DecisionsRequest } from "@openrouter/sdk/models/decisionsrequest";
import type { Answers } from "@openrouter/sdk/models/decisionsresponse";
import type { Provider } from "../provider.ts";

const DEFAULT_BASE_URL = "https://openrouter.ai";
const DEFAULT_MODEL = "typesafe/jev-1.13";

export class OpenRouterProvider implements Provider {
	readonly name = "openrouter" as const;
	readonly model: string;
	readonly baseUrl: string;
	readonly #apiKey: string;

	constructor(model?: string, baseUrl?: string) {
		const apiKey = process.env.OPENROUTER_API_KEY;
		assert(apiKey, "Missing OPENROUTER_API_KEY environment variable.");
		this.#apiKey = apiKey;
		this.model = model ?? DEFAULT_MODEL;
		const rawBaseUrl =
			baseUrl ?? process.env.OPENROUTER_BASE_URL ?? DEFAULT_BASE_URL;
		this.baseUrl = rawBaseUrl.replace(/\/+$/, "");
	}

	get #endpoint(): string {
		return this.baseUrl.endsWith("/api/alpha/decisions")
			? this.baseUrl
			: `${this.baseUrl}/api/alpha/decisions`;
	}

	async createDecision(
		req: DecisionsRequest,
	): Promise<{ answers: Record<string, Answers> }> {
		const res = await fetch(this.#endpoint, {
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

		const text = await res.text();
		let parsed: { answers?: Record<string, Answers> };
		try {
			parsed = JSON.parse(text);
		} catch {
			const detail = text
				? `: received non-JSON response "${text.slice(0, 80).trim()}"`
				: "";
			throw new Error(
				`Provider (${this.name}) returned invalid response${detail}`,
			);
		}

		if (
			typeof parsed !== "object" ||
			parsed === null ||
			typeof parsed.answers !== "object" ||
			parsed.answers === null
		) {
			throw new Error(
				`Provider (${this.name}) returned invalid response: missing answers object`,
			);
		}

		return parsed as { answers: Record<string, Answers> };
	}
}
