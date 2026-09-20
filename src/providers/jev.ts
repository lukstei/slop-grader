import assert from "node:assert/strict";
import type {
	DecisionsRequest,
	Questions as ORQuestion,
} from "@openrouter/sdk/models/decisionsrequest";
import type { Answers } from "@openrouter/sdk/models/decisionsresponse";
import type { Questions as TSQuestions } from "@typesafe-ai/sdk";
import { choice, noul, score, TypeSafeClient } from "@typesafe-ai/sdk";
import type { Provider } from "../provider.ts";

export class JevProvider implements Provider {
	readonly #client: TypeSafeClient;

	constructor() {
		this.#client = new TypeSafeClient();
	}

	async createDecision(
		req: DecisionsRequest,
	): Promise<{ answers: Record<string, Answers> }> {
		const questions: TSQuestions = {};
		for (const [id, q] of Object.entries(req.questions)) {
			questions[id] = toTSQuestion(q);
		}

		const result = await this.#client.systemOne({
			model: req.model,
			state: req.state,
			questions,
		});

		const answers: Record<string, Answers> = {};
		for (const [id, answer] of Object.entries(result.answers)) {
			switch (answer.type) {
				case "noul":
					answers[id] = { type: "noul", noul: answer.noul };
					break;
				case "score":
					answers[id] = {
						type: "score",
						score: answer.score,
						confidence: answer.confidence,
						probabilities: answer.probabilities,
					};
					break;
				case "choice":
					answers[id] = {
						type: "choice",
						choice: answer.choice,
						confidence: answer.confidence,
						probabilities: answer.probabilities,
					};
					break;
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
			return score(
				q.instructions ?? undefined,
				criteria as [string, string, ...string[]],
			);
		}
		case "choice": {
			return choice(q.instructions ?? undefined, q.criteria);
		}
	}
}
