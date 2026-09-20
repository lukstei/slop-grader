---
name: create-slop-grader-rules
description: >
  Create custom slop-grader rulesets in Markdown based on user guidelines and SYNTAX.md specification. Validates rules using slop-grader --check.
---

# Create slop-grader rules

Help the user create custom rule files (`.md`) for [`slop-grader`](https://github.com/lukstei/slop-grader/blob/main/README.md).

For complete syntax rules and validation constraints, refer to [docs/SYNTAX.md](https://github.com/lukstei/slop-grader/blob/main/docs/SYNTAX.md).

## Example Ruleset

```markdown
Custom documentation standards.

# Document Rules

## task_orientation
Is the guide organized around user tasks rather than internal system architecture?

### Criteria
- Architecture dump with no clear user workflow
- Mixed explanations requiring the reader to assemble the workflow
- Task-oriented with clear sequential steps
- Cookbook-grade with inputs, steps, and expected outputs

# Line Rules

## minimizing_language
Does the line use condescending shortcuts ("simply", "just", "obviously") to minimize a complex step?

### Criteria
- **true**: The line minimizes a step requiring configuration or technical decisions.
- **false**: The step is genuinely trivial (e.g. "click Save"), or no minimizing term appears.
```

## Workflow

1. **Clarify requirements:** Ask what patterns, guidelines, or quality criteria the user wants to enforce. Determine the appropriate scopes:
   - `# Line Rules`: Evaluates line by line. Always boolean `noul` questions requiring `- **true**:` and `- **false**:` criteria.
   - `# Document Rules`: Evaluates the whole document. Multi-tier `score` questions (bullet list of at least 2 levels) or document-level boolean `noul` questions.
2. **Draft the ruleset:** Write the `.md` rule file adhering to [docs/SYNTAX.md](https://github.com/lukstei/slop-grader/blob/main/docs/SYNTAX.md). Keep rule IDs snake_case, provide clear prompt instructions, and structure criteria bullets strictly.
3. **Validate the rule:** Always run the validation command:
   ```sh
   npx @lukstei/slop-grader@latest --check -r <rule-file>
   ```
   If validation fails, fix the syntax errors until it passes.
4. **Instruct the user:** Present the final rule file and show the user how to run `slop-grader` against their documents:
   ```sh
   npx @lukstei/slop-grader@latest -r <path-to-rule-file> <path-to-target-document>
   ```
   **Important:** Never invoke the grading command yourself. The agent only validates rules via `--check`. The user runs the grading command directly.
