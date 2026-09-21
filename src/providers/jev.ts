import assert from "node:assert/strict";
import type {
	DecisionsRequest,
	Questions as ORQuestion,
} from "@openrouter/sdk/models/decisionsrequest";
import type { Answers } from "@openrouter/sdk/models/decisionsresponse";
import type { DecisionsScoreAnswer } from "@openrouter/sdk/models/decisionsscoreanswer";
import type { ScoreCriteria, Questions as TSQuestions } from "@typesafe-ai/sdk";
import { noul, score, TypeSafeClient } from "@typesafe-ai/sdk";
import type { Provider } from "../provider.ts";

const DEFAULT_MODEL = "jev-1.13.0";

export class JevProvider implements Provider {
	readonly name = "jev" as const;
	readonly model: string;
	readonly #client: TypeSafeClient;

	constructor(client?: TypeSafeClient, model?: string) {
		this.model = model ?? DEFAULT_MODEL;
		if (client) {
			this.#client = client;
			return;
		}
		const apiKey = process.env.TYPESAFE_API_KEY;
		assert(apiKey, "Missing TYPESAFE_API_KEY environment variable.");
		this.#client = new TypeSafeClient({ apiKey });
	}

	async createDecision(
		req: DecisionsRequest,
	): Promise<{ answers: Record<string, Answers> }> {
		const questions: TSQuestions = {};
		for (const [id, q] of Object.entries(req.questions)) {
			questions[id] = toTSQuestion(q);
		}

		const result = await this.#client.systemOne({
			model: this.model,
			state: req.state,
			questions,
		});

		const answers: Record<string, Answers> = {};
		for (const [id, answer] of Object.entries(result.answers)) {
			switch (answer.type) {
				case "noul":
					answers[id] = { type: "noul", noul: answer.noul };
					break;
				case "score": {
					const legend: DecisionsScoreAnswer["legend"] = {};
					for (const [k, v] of Object.entries(answer.legend)) {
						if (v !== null) {
							legend[k] = v;
						}
					}
					answers[id] = {
						type: "score",
						score: answer.score,
						confidence: answer.confidence,
						probabilities: answer.probabilities,
						legend,
					};
					break;
				}
			}
		}

		return { answers };
	}
}

function toTSQuestion(q: ORQuestion): TSQuestions[string] {
	switch (q.type) {
		case "noul":
			return noul(q.instructions ?? undefined, q.criteria ?? undefined);
		case "score": {
			const criteria = q.criteria;
			assert(
				Array.isArray(criteria) && criteria.length >= 2,
				"score question needs ≥2 criteria",
			);
			const [c0, c1, ...rest] = criteria;
			assert(
				c0 !== undefined && c1 !== undefined,
				"score question needs ≥2 criteria",
			);
			return score(q.instructions ?? undefined, [
				c0,
				c1,
				...rest,
			] as ScoreCriteria);
		}
		default:
			throw new Error(
				`Unsupported question type: ${(q as { type: string }).type}`,
			);
	}
}
