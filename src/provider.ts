import assert from "node:assert/strict";
import type { DecisionsRequest } from "@openrouter/sdk/models/decisionsrequest";
import type { Answers } from "@openrouter/sdk/models/decisionsresponse";
import { JevProvider } from "./providers/jev.ts";
import { OpenRouterProvider } from "./providers/openrouter.ts";

export type { Answers, DecisionsRequest };

export interface Provider {
	readonly name: ProviderName;
	readonly model: string;
	readonly concurrency?: number;
	createDecision(
		req: DecisionsRequest,
	): Promise<{ answers: Record<string, Answers> }>;
}

export const DEFAULT_CONCURRENCY = 5;

export function withConcurrency(
	provider: Provider,
	limit = DEFAULT_CONCURRENCY,
): Provider {
	assert(
		Number.isInteger(limit) && limit > 0,
		`Invalid concurrency "${limit}". Must be a positive integer.`,
	);
	if (provider.concurrency !== undefined) {
		return provider;
	}
	let active = 0;
	const queue: Array<() => void> = [];

	return {
		name: provider.name,
		model: provider.model,
		concurrency: limit,
		async createDecision(req) {
			if (active >= limit) {
				await new Promise<void>((resolve) => {
					queue.push(resolve);
				});
			}
			active++;
			try {
				return await provider.createDecision(req);
			} finally {
				active--;
				queue.shift()?.();
			}
		},
	};
}

export type ProviderName = "openrouter" | "jev";

export function createProvider(name?: ProviderName, model?: string): Provider {
	const resolved = name ?? resolveFromEnv();
	switch (resolved) {
		case "openrouter":
			return new OpenRouterProvider(model);
		case "jev":
			return new JevProvider(undefined, model);
	}
}

function resolveFromEnv(): ProviderName {
	const explicit = process.env.TYPESAFE_PROVIDER;
	if (explicit === "openrouter" || explicit === "jev") return explicit;

	if (process.env.TYPESAFE_API_KEY) return "jev";
	if (process.env.OPENROUTER_API_KEY) return "openrouter";

	throw new Error(
		"No provider configured. Set TYPESAFE_API_KEY (jev) or OPENROUTER_API_KEY (openrouter), " +
			"or pass --provider <jev|openrouter>.",
	);
}
