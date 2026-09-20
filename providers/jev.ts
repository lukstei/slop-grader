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

		// Map the TypeSafe answer shape back to the OpenRouter Answers discriminated union.
		const answers: Record<string, Answers> = {};
		for (const [id, answer] of Object.entries(result.answers)) {
			const a = answer as unknown as Record<string, unknown>;
			if ("noul" in a) {
				answers[id] = { type: "noul", noul: a.noul as number };
			} else if ("score" in a) {
				answers[id] = {
					type: "score",
					score: a.score as number,
					confidence: a.confidence as number | undefined,
					probabilities: a.probabilities as Record<string, number> | undefined,
				};
			} else if ("choice" in a) {
				answers[id] = {
					type: "choice",
					choice: a.choice as string,
					confidence: a.confidence as number | undefined,
					probabilities: a.probabilities as Record<string, number> | undefined,
				};
			} else {
				// Preserve unknown answer types as-is for forward compatibility.
				answers[id] = a as unknown as Answers;
			}
		}

		return { answers };
	}
}

function toTSQuestion(q: ORQuestion): TSQuestions[string] {
	switch (q.type) {
		case "noul":
			return noul(q.instructions, q.criteria as Parameters<typeof noul>[1]);
		case "score": {
			const criteria = q.criteria;
			assert(
				Array.isArray(criteria) && criteria.length >= 2,
				"score question needs ≥2 criteria",
			);
			return score(
				q.instructions,
				criteria as unknown as Parameters<typeof score>[1],
			);
		}
		case "choice": {
			const crit = q.criteria as Record<string, unknown>;
			return choice(q.instructions, crit as Parameters<typeof choice>[1]);
		}
	}
}
