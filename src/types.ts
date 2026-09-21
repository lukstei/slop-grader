export type Line = { lineNum: number; text: string };
export type FlagMap = Map<number, string[]>;

export type NoulQuestion = {
	type: "noul";
	instructions: string;
	criteria?: {
		true: string;
		false: string;
	};
};

export type ScoreQuestion = {
	type: "score";
	instructions: string;
	criteria: string[];
};

export type Question = NoulQuestion | ScoreQuestion;

export type LineRule = NoulQuestion & { scope: "line" };
export type DocumentRule = (ScoreQuestion | NoulQuestion) & {
	scope: "document";
};
export type Rule = LineRule | DocumentRule;

export type RuleSet = {
	lineRules: Record<string, NoulQuestion>;
	docRules: Record<string, Question>;
};

export type Stats = {
	rules: number;
	lineRules: number;
	docRules: number;
	lines: number;
	questions: number;
	apiCalls: number;
};

export type RulesetScope = "line" | "document" | "mixed";

export type RulesetInfo = {
	name: string;
	path: string;
	description: string;
	scope: RulesetScope;
	rulesCount: number;
	lineRulesCount: number;
	docRulesCount: number;
	lineRules: string[];
	docRules: string[];
};
