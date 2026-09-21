import { describe, expect, it } from "vitest";
import { parseMarkdownRules } from "./rules.ts";

describe("parseMarkdownRules", () => {
	it("parses line rules under # Line Rules", () => {
		const md = `# Line Rules

## banned_word
Does the line contain a banned word?

### Criteria
- **true**: A banned word appears.
- **false**: No banned words appear.
`;
		const result = parseMarkdownRules(md);
		expect(result).toMatchInlineSnapshot(`
			{
			  "banned_word": {
			    "criteria": {
			      "false": "No banned words appear.",
			      "true": "A banned word appears.",
			    },
			    "instructions": "Does the line contain a banned word?",
			    "scope": "line",
			    "type": "noul",
			  },
			}
		`);
	});

	it("parses criteria with unformatted true/false labels", () => {
		const md = `# Line Rules

## banned_word
Does the line contain a banned word?

### Criteria
- true: A banned word appears.
- false: No banned words appear.
`;
		const result = parseMarkdownRules(md);
		expect(result).toMatchInlineSnapshot(`
			{
			  "banned_word": {
			    "criteria": {
			      "false": "No banned words appear.",
			      "true": "A banned word appears.",
			    },
			    "instructions": "Does the line contain a banned word?",
			    "scope": "line",
			    "type": "noul",
			  },
			}
		`);
	});

	it("parses criteria with italicized true/false labels", () => {
		const md = `# Line Rules

## banned_word
Does the line contain a banned word?

### Criteria
- *true*: A banned word appears.
- *false*: No banned words appear.
`;
		const result = parseMarkdownRules(md);
		expect(result).toMatchInlineSnapshot(`
			{
			  "banned_word": {
			    "criteria": {
			      "false": "No banned words appear.",
			      "true": "A banned word appears.",
			    },
			    "instructions": "Does the line contain a banned word?",
			    "scope": "line",
			    "type": "noul",
			  },
			}
		`);
	});

	it("parses line rules without a criteria section", () => {
		const md = `# Line Rules

## banned_word
Does the line contain a banned word?
`;
		const result = parseMarkdownRules(md);
		expect(result).toMatchInlineSnapshot(`
			{
			  "banned_word": {
			    "instructions": "Does the line contain a banned word?",
			    "scope": "line",
			    "type": "noul",
			  },
			}
		`);
	});

	it("parses document rules without a criteria section as noul", () => {
		const md = `# Document Rules

## has_summary
Does the document contain an executive summary?
`;
		const result = parseMarkdownRules(md);
		expect(result).toMatchInlineSnapshot(`
			{
			  "has_summary": {
			    "instructions": "Does the document contain an executive summary?",
			    "scope": "document",
			    "type": "noul",
			  },
			}
		`);
	});

	it("parses rules with and without criteria sections in the same ruleset", () => {
		const md = `# Line Rules

## banned_word
Does the line contain a banned word?

## typo
Check for typos.

### Criteria
- **true**: Typo present.
- **false**: No typos.

# Document Rules

## has_summary
Does the document contain an executive summary?

## narrative_arc
Rate the narrative structure.

### Criteria
- Disconnected
- Loosely organized
- Clear progression
`;
		const result = parseMarkdownRules(md);
		expect(result).toMatchInlineSnapshot(`
			{
			  "banned_word": {
			    "instructions": "Does the line contain a banned word?",
			    "scope": "line",
			    "type": "noul",
			  },
			  "has_summary": {
			    "instructions": "Does the document contain an executive summary?",
			    "scope": "document",
			    "type": "noul",
			  },
			  "narrative_arc": {
			    "criteria": [
			      "Disconnected",
			      "Loosely organized",
			      "Clear progression",
			    ],
			    "instructions": "Rate the narrative structure.",
			    "scope": "document",
			    "type": "score",
			  },
			  "typo": {
			    "criteria": {
			      "false": "No typos.",
			      "true": "Typo present.",
			    },
			    "instructions": "Check for typos.",
			    "scope": "line",
			    "type": "noul",
			  },
			}
		`);
	});

	it("parses document score rules under # Document Rules", () => {
		const md = `# Document Rules

## narrative_arc
Rate the narrative structure of the text.

### Criteria
- Disconnected sections
- Loosely organized
- Clear progression
- Tight arc
`;
		const result = parseMarkdownRules(md);
		expect(result).toMatchInlineSnapshot(`
			{
			  "narrative_arc": {
			    "criteria": [
			      "Disconnected sections",
			      "Loosely organized",
			      "Clear progression",
			      "Tight arc",
			    ],
			    "instructions": "Rate the narrative structure of the text.",
			    "scope": "document",
			    "type": "score",
			  },
			}
		`);
	});

	it("auto-detects document noul rules when true/false criteria is present", () => {
		const md = `# Document Rules

## has_summary
Does the document contain an executive summary?

### Criteria
- **true**: An executive summary is present.
- **false**: No executive summary exists.
`;
		const result = parseMarkdownRules(md);
		expect(result).toMatchInlineSnapshot(`
			{
			  "has_summary": {
			    "criteria": {
			      "false": "No executive summary exists.",
			      "true": "An executive summary is present.",
			    },
			    "instructions": "Does the document contain an executive summary?",
			    "scope": "document",
			    "type": "noul",
			  },
			}
		`);
	});

	it("parses mixed document and line rules across sections", () => {
		const md = `# Document Rules

## doc_score
Evaluate overall quality.

### Criteria
- Poor
- Fair
- Good
- Excellent

# Line Rules

## line_check
Check line quality.

### Criteria
- **true**: Line has an issue.
- **false**: Line is clean.
`;
		const result = parseMarkdownRules(md);
		expect(result).toMatchInlineSnapshot(`
			{
			  "doc_score": {
			    "criteria": [
			      "Poor",
			      "Fair",
			      "Good",
			      "Excellent",
			    ],
			    "instructions": "Evaluate overall quality.",
			    "scope": "document",
			    "type": "score",
			  },
			  "line_check": {
			    "criteria": {
			      "false": "Line is clean.",
			      "true": "Line has an issue.",
			    },
			    "instructions": "Check line quality.",
			    "scope": "line",
			    "type": "noul",
			  },
			}
		`);
	});

	it("handles backticks in rule names", () => {
		const md = `# Line Rules

## \`code_style\`
Check code style.

### Criteria
- **true**: Bad style.
- **false**: Good style.
`;
		const result = parseMarkdownRules(md);
		expect(result).toHaveProperty("code_style");
	});

	it("handles multiline criteria items with indentation", () => {
		const md = `# Document Rules

## detailed_score
Detailed evaluation.

### Criteria
- Level 0 — first part
  and continuation line
- Level 1 — second part
`;
		const result = parseMarkdownRules(md);
		expect(result.detailed_score?.criteria).toMatchInlineSnapshot(`
			[
			  "Level 0 — first part and continuation line",
			  "Level 1 — second part",
			]
		`);
	});

	it("ignores description text before the first H1", () => {
		const md = `This is a description of the ruleset.
It can span multiple lines and paragraphs.

More context here.

# Line Rules

## banned_word
Does the line contain a banned word?

### Criteria
- **true**: yes
- **false**: no
`;
		const result = parseMarkdownRules(md);
		expect(result).toHaveProperty("banned_word");
		expect(result.banned_word?.instructions).toBe(
			"Does the line contain a banned word?",
		);
	});

	describe("validation errors", () => {
		it("throws when content is empty", () => {
			expect(() => parseMarkdownRules("   ")).toThrow(
				"Markdown rule file cannot be empty",
			);
		});

		it("throws when an invalid H1 heading is used", () => {
			const md = `# My Rules

## banned_word
Some instructions.

### Criteria
- **true**: yes
- **false**: no
`;
			expect(() => parseMarkdownRules(md)).toThrow(
				'Invalid top-level heading "# My Rules": only "# Line Rules" and "# Document Rules" are allowed as H1 headings',
			);
		});

		it("throws when section heading is used at H2", () => {
			const md = `## Line Rules

### banned_word
Some instructions.

#### Criteria
- **true**: yes
- **false**: no
`;
			expect(() => parseMarkdownRules(md)).toThrow(
				'Invalid heading "## Line Rules": section headings must be H1 ("# Line Rules" or "# Document Rules")',
			);
		});

		it("throws when section heading is duplicated", () => {
			const md = `# Line Rules

## rule_1
Instructions.

### Criteria
- **true**: yes
- **false**: no

# Line Rules

## rule_2
Instructions.

### Criteria
- **true**: yes
- **false**: no
`;
			expect(() => parseMarkdownRules(md)).toThrow(
				'Duplicate "# Line Rules" heading: each section may only appear once',
			);
		});

		it("throws when no scope section is found", () => {
			const md = `Just some description text without any H1 sections.
`;
			expect(() => parseMarkdownRules(md)).toThrow(
				'No "# Line Rules" or "# Document Rules" section found',
			);
		});

		it("throws when scope section has no rules", () => {
			const md = `# Line Rules

Just some notes without rules.
`;
			expect(() => parseMarkdownRules(md)).toThrow(
				'No rules found under "# Line Rules" or "# Document Rules"',
			);
		});

		it("throws when line rule criteria misses true or false", () => {
			const md = `# Line Rules

## my_rule
Some instructions.

### Criteria
- **true**: only true case
`;
			expect(() => parseMarkdownRules(md)).toThrow(
				'Rule "my_rule" (line rule) criteria must define both "true" and "false" cases',
			);
		});

		it("throws when document score rule has fewer than 2 levels", () => {
			const md = `# Document Rules

## my_rule
Some instructions.

### Criteria
- Only one level
`;
			expect(() => parseMarkdownRules(md)).toThrow(
				'Rule "my_rule" (document score rule) criteria must contain at least 2 levels',
			);
		});

		it("throws when instructions text is empty", () => {
			const md = `# Line Rules

## my_rule

### Criteria
- **true**: yes
- **false**: no
`;
			expect(() => parseMarkdownRules(md)).toThrow(
				'Rule "my_rule" is missing instructions text',
			);
		});

		it("throws when an invalid H3 heading like ### Criterias is used", () => {
			const md = `# Line Rules

## empty_phrase
Does the line contain a filler phrase?

### Criterias
- **true**: yes
- **false**: no
`;
			expect(() => parseMarkdownRules(md)).toThrowErrorMatchingInlineSnapshot(
				`[AssertionError: Invalid heading "### Criterias": only "### Criteria" is allowed under a rule]`,
			);
		});

		it("throws when duplicate rule ID is defined within the same file", () => {
			const md = `# Line Rules

## duplicate_rule
First definition.

### Criteria
- **true**: yes
- **false**: no

## duplicate_rule
Second definition.

### Criteria
- **true**: yes
- **false**: no
`;
			expect(() => parseMarkdownRules(md)).toThrowErrorMatchingInlineSnapshot(
				`[AssertionError: Duplicate rule "duplicate_rule": rule identifiers must be unique]`,
			);
		});
	});

	it("parses rules containing fenced code blocks with # comments without error", () => {
		const md = `# Line Rules

## code_rule
Check the following snippet:

\`\`\`bash
# Not a heading comment
echo "hello"
\`\`\`

### Criteria
- **true**: yes
- **false**: no
`;
		const result = parseMarkdownRules(md);
		expect(result.code_rule).toBeDefined();
		expect(result.code_rule?.instructions).toContain("# Not a heading comment");
	});

	it("preserves rule identifiers with multiple underscores without stripping to italics", () => {
		const md = `# Line Rules

## spelling_and_confused_words
Check spelling.

### Criteria
- **true**: misspelled
- **false**: correct
`;
		const result = parseMarkdownRules(md);
		expect(Object.keys(result)).toMatchInlineSnapshot(`
			[
			  "spelling_and_confused_words",
			]
		`);
	});
});
