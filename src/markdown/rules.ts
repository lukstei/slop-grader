import assert from "node:assert/strict";
import type { Rule } from "../types.ts";
import type { MarkdownNode } from "./ast.ts";
import { parse } from "./parsing.ts";

function getInnerText(node?: MarkdownNode): string {
	if (!node) return "";
	if ("content" in node && typeof node.content === "string")
		return node.content;
	if ("children" in node) {
		return Array.isArray(node.children)
			? node.children.map(getInnerText).join("")
			: getInnerText(node.children as MarkdownNode);
	}
	return "";
}

function parseScopeHeader(text: string): "line" | "document" | null {
	const trimmed = text.trim();
	if (/^line\s+rules?$/i.test(trimmed)) return "line";
	if (/^document\s+rules?$/i.test(trimmed)) return "document";
	return null;
}

export function parseMarkdownRules(
	content: string,
	filePath?: string,
): { description: string; rules: Record<string, Rule> } {
	const fileContext = filePath ? ` in "${filePath}"` : "";
	assert(
		content.trim().length > 0,
		`Markdown rule file${fileContext} cannot be empty`,
	);

	const root = parse(content);
	const nodes = root.type === "fragment" ? root.children : [root];

	type RuleSection = {
		ruleId: string;
		scope: "line" | "document";
		bodyNodes: MarkdownNode[];
	};

	const preambleNodes: MarkdownNode[] = [];
	const ruleSections: RuleSection[] = [];
	const seenScopes = new Set<"line" | "document">();
	let currentScope: "line" | "document" | null = null;
	let currentRule: {
		ruleId: string;
		scope: "line" | "document";
		bodyNodes: MarkdownNode[];
	} | null = null;

	for (const node of nodes) {
		if (node.type === "heading") {
			const headingText = getInnerText(node).trim();

			if (node.depth === 1) {
				const detectedScope = parseScopeHeader(headingText);
				assert(
					detectedScope !== null,
					`Invalid top-level heading "# ${headingText}"${fileContext}: only "# Line Rules" and "# Document Rules" are allowed as H1 headings (put description text before the first H1)`,
				);
				assert(
					!seenScopes.has(detectedScope),
					`Duplicate "# ${headingText}" heading${fileContext}: each section may only appear once`,
				);

				if (currentRule) {
					ruleSections.push(currentRule);
					currentRule = null;
				}
				seenScopes.add(detectedScope);
				currentScope = detectedScope;
				continue;
			}

			// Reject section headings used at non-H1 levels
			const detectedScope = parseScopeHeader(headingText);
			assert(
				detectedScope === null,
				`Invalid heading "${"#".repeat(node.depth)} ${headingText}"${fileContext}: section headings must be H1 ("# Line Rules" or "# Document Rules")`,
			);

			// Rule headings must be H2
			if (node.depth === 2) {
				assert(
					currentScope !== null,
					`Rule "${headingText}"${fileContext} must be defined under a "# Line Rules" or "# Document Rules" section`,
				);
				assert(
					headingText.toLowerCase() !== "criteria",
					`"Criteria"${fileContext} must be an H3 heading ("### Criteria"), not H2`,
				);

				if (currentRule) {
					ruleSections.push(currentRule);
				}
				const ruleId = headingText.replace(/`/g, "").trim();
				assert(
					ruleId.length > 0,
					`Rule heading${fileContext} cannot have an empty name`,
				);
				assert(
					!ruleSections.some((s) => s.ruleId === ruleId),
					`Duplicate rule "${ruleId}"${fileContext}: rule identifiers must be unique`,
				);
				currentRule = {
					ruleId,
					scope: currentScope,
					bodyNodes: [],
				};
				continue;
			}

			// Criteria headings must be H3
			if (node.depth === 3) {
				assert(
					currentRule !== null,
					`"### ${headingText}"${fileContext} must be inside a rule`,
				);
				assert(
					headingText.trim().toLowerCase() === "criteria",
					`Invalid heading "### ${headingText}"${fileContext}: only "### Criteria" is allowed under a rule`,
				);
				currentRule.bodyNodes.push(node);
				continue;
			}
		}

		if (currentScope === null) {
			preambleNodes.push(node);
			continue;
		}

		if (currentRule) {
			currentRule.bodyNodes.push(node);
		}
	}

	if (currentRule) {
		ruleSections.push(currentRule);
	}

	assert(
		currentScope !== null,
		`No "# Line Rules" or "# Document Rules" section found${fileContext}`,
	);

	assert(
		ruleSections.length > 0,
		`No rules found under "# Line Rules" or "# Document Rules"${fileContext}`,
	);

	const rules: Record<string, Rule> = {};

	for (const { ruleId, scope, bodyNodes } of ruleSections) {
		const criteriaIdx = bodyNodes.findIndex(
			(n) =>
				n.type === "heading" &&
				getInnerText(n).trim().toLowerCase() === "criteria",
		);

		const hasCriteria = criteriaIdx !== -1;
		const instructionNodes = hasCriteria
			? bodyNodes.slice(0, criteriaIdx)
			: bodyNodes;
		const criteriaNodes = hasCriteria ? bodyNodes.slice(criteriaIdx + 1) : [];

		const rawInstructions = instructionNodes
			.map((n) => n.source)
			.join("\n\n")
			.trim();

		assert(
			rawInstructions.length > 0,
			`Rule "${ruleId}"${fileContext} is missing instructions text`,
		);

		if (!hasCriteria) {
			rules[ruleId] = {
				scope,
				type: "noul",
				instructions: rawInstructions,
			};
			continue;
		}

		const listNode = criteriaNodes.find(
			(n): n is MarkdownNode<"list"> => n.type === "list",
		);

		let trueMatch: string | null = null;
		let falseMatch: string | null = null;
		const listItems: string[] = [];

		if (listNode) {
			for (const item of listNode.children) {
				const text = getInnerText(item).trim();
				listItems.push(text);
				const match = text.match(
					/^(?:(?:\*+)?(true|false)(?:\*+)?):\s*([\s\S]*)$/i,
				);
				if (match) {
					if (match[1].toLowerCase() === "true") {
						trueMatch = match[2].trim();
					} else {
						falseMatch = match[2].trim();
					}
				}
			}
		}

		if (scope === "line") {
			assert(
				trueMatch && falseMatch,
				`Rule "${ruleId}"${fileContext} (line rule) criteria must define both "true" and "false" cases (e.g. "- **true**: ...")`,
			);

			rules[ruleId] = {
				scope: "line",
				type: "noul",
				instructions: rawInstructions,
				criteria: {
					true: trueMatch,
					false: falseMatch,
				},
			};
		} else {
			// Document rule: auto-detect noul vs score
			const isNoul = trueMatch !== null && falseMatch !== null;

			if (isNoul) {
				assert(
					trueMatch && falseMatch,
					`Rule "${ruleId}"${fileContext} (document noul rule) criteria must define both "true" and "false" cases (e.g. "- **true**: ...")`,
				);
				rules[ruleId] = {
					scope: "document",
					type: "noul",
					instructions: rawInstructions,
					criteria: {
						true: trueMatch,
						false: falseMatch,
					},
				};
			} else {
				assert(
					listItems.length >= 2,
					`Rule "${ruleId}"${fileContext} (document score rule) criteria must contain at least 2 levels (e.g. "- Level description")`,
				);

				rules[ruleId] = {
					scope: "document",
					type: "score",
					instructions: rawInstructions,
					criteria: listItems,
				};
			}
		}
	}

	const description = preambleNodes
		.map(getInnerText)
		.map((s) => s.trim())
		.filter((s) => s.length > 0)
		.join("\n\n");

	return { description, rules };
}
