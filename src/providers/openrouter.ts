import { OpenRouter } from "@openrouter/sdk";
import type { DecisionsRequest } from "@openrouter/sdk/models/decisionsrequest";
import type { Answers } from "@openrouter/sdk/models/decisionsresponse";
import type { Provider } from "../provider.ts";

export class OpenRouterProvider implements Provider {
	readonly #client: OpenRouter;

	constructor() {
		this.#client = new OpenRouter({
			apiKey: process.env.OPENROUTER_API_KEY ?? "",
		});
	}

	async createDecision(
		req: DecisionsRequest,
	): Promise<{ answers: Record<string, Answers> }> {
		return this.#client.alpha.decisions.create({ decisionsRequest: req });
	}
}
