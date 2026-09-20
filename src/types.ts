import type { Questions } from "@openrouter/sdk/models/decisionsrequest";
import type { DecisionsScoreQuestion } from "@openrouter/sdk/models/decisionsscorequestion";

export type Line = { lineNum: number; text: string };
export type FlagMap = Map<number, string[]>;

export type LineRule = Questions & { scope: "line" };
export type DocumentRule = DecisionsScoreQuestion & { scope: "document" };
export type Rule = LineRule | DocumentRule;

export type Stats = {
	rules: number;
	lineRules: number;
	docRules: number;
	lines: number;
	questions: number;
	apiCalls: number;
};
