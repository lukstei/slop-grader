<img src="assets/icon.png" alt="slop-grader" width="200" />

# slop-grader


[![CI](https://github.com/lukstei/slop-grader/actions/workflows/ci.yml/badge.svg)](https://github.com/lukstei/slop-grader/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![NPM Version](https://img.shields.io/npm/v/@lukstei/slop-grader.svg)](https://www.npmjs.com/package/@lukstei/slop-grader)
![npm bundle size](https://img.shields.io/bundlephobia/min/%40lukstei%2Fslop-grader)

Rule-based slop grader for text files, powered by [Jev](https://typesafe.ai).

## How it works

`slop-grader` runs as a two-step loop: grade text with the CLI, then paste the output to your AI agent to plan the improvements.

### 1. Grade the document

Run `slop-grader` on a document like [`examples/slop.md`](examples/slop.md):

```sh
npx @lukstei/slop-grader@latest -r no-ai-slop examples/slop.md
```

<img src="assets/terminal.png" alt="Terminal output" width="550" />

### 2. Fix with an AI agent

Pass the output to your AI agent:

- The agent distinguishes real violations from false positives and generates concrete replacements ([Example with Gemini 3.8 Flash](examples/plan.md)):
  ```markdown
  ### Line 1 — `banned_word`
  - **Original:** `# 🚀 The Ultimate Paradigm Shift in Modern Data Architecture`
  - **Fix:** `# Modern Data Architecture`
  - **Reason:** Removes the banned phrase "paradigm shift" and decorative emoji.

  ### Line 7 — `binary_contrast` + `faux_insight` + `colon_reveal` + `fake_profound_kicker`
  - **Original:** `What most people get wrong about databases is simple: it's not about speed, it's about trust.`
  - **Fix:** `Database design balances speed and trust.`
  - **Reason:** Removes rhetorical framing and fake insight.
  ```
- After your review the plan is applied to produce an [improved document](examples/slop-improved.md).

## FAQ

<details>
<summary><strong>How does evaluation work?</strong></summary>

Evaluation separates line-level checks (spotting specific patterns or phrases) from document-level checks (evaluating tone or overall structure).

Documents have hundreds of lines, but the number of rules is fixed. Sending one API request per line would mean hundreds of calls. Instead, `slop-grader` groups lines into batches of 255 and evaluates each rule across the batch in a single call. A 300-line document with 5 rules runs in 10 parallel requests.

Document rules run in a single request across the entire text.

</details>

<details>
<summary><strong>How is this different from using an LLM to check text?</strong></summary>

Standard generative LLMs evaluate an entire document in a single prompt against a list of rules. On longer texts, they skip lines, miss rules, and report wrong line numbers.

Running a separate check for every line and rule with a generative LLM is impractical. A 300-line draft tested against 10 rules would require 3,000 text-generation requests, which is slow and expensive.

`slop-grader` uses a System One model ([Jev](https://typesafe.ai)). System One models answer discrete semantic questions with typed probabilities without generating text. Because these judgments return numbers instead of prose tokens, `slop-grader` can test every line against every rule separately and in parallel.

</details>

<details>
<summary><strong>Can I use custom rules for my use case?</strong></summary>

Yes. You can write custom rules in Markdown (`-r ./my-rules.md`) or JSON. Rules ask plain-text questions about a single line or the whole document, evaluated against criteria you define. See [Custom rulesets](#custom-rulesets) in the [Rulesets](#rulesets) section for syntax details and validation instructions.

</details>

<details>
<summary><strong>Which use cases exist for this tool?</strong></summary>

`slop-grader` works on any plain text, structured file, or code diff:

- Catch AI writing habits, filler adverbs, and rhetorical formulas in drafts and essays.
- Check technical documentation for missing code examples, disorganized steps, or unexplained jargon.
- Scan code review diffs for swallowed errors, hardcoded credentials, and unjustified type assertions.
- Audit CSV spreadsheets and transaction logs for values exceeding approval thresholds.
- Review contracts and legal agreements for uncapped indemnification obligations.
- Check customer support transcripts for unreleased feature commitments or unauthorized discounts.
- Evaluate incident postmortems to confirm they address systemic defenses instead of individual human error.

See the [Rulesets](#rulesets) section for pre-built rules and example templates.

</details>

## Quick Start

### Requirements

- Node.js 18+
- An API key for your chosen provider:
  - `TYPESAFE_API_KEY` — [typesafe.ai](https://typesafe.ai) (uses `jev` provider)
  - `OPENROUTER_API_KEY` — [openrouter.ai](https://openrouter.ai) (uses `openrouter` provider)

### Run

```sh
export TYPESAFE_API_KEY=...
npx @lukstei/slop-grader@latest -r no-ai-slop -r article-scores my-draft.md
```

## Rulesets

### Built-in rulesets

List built-in rulesets directly with `--list-rulesets` (or `-l`):

```sh
npx @lukstei/slop-grader@latest --list-rulesets
# or with structured JSON including rule IDs:
npx @lukstei/slop-grader@latest -l --json
```

Displays each ruleset's scope (`line`, `document`, or `mixed`), rule count, and description:

```text
NAME             SCOPE     RULES  DESCRIPTION
article-scores   document      8  Document-level quality scores: engagement, narrative arc, ...
grammar-english  line         21  English grammar and style rules: spelling and confused words, ...
grammar-german   line         13  Deutsche Grammatik-, Rechtschreib- und Zeichensetzungsregeln: ...
no-ai-slop       line         21  Line-level rules to detect AI slop patterns: banned buzzwords, ...
tech-docs        mixed        11  Technical documentation rules: structure, task orientation, ...
```

Pass built-in rulesets by name (`-r article-scores`):

| Ruleset | What it checks |
|---|---|
| [`article-scores`](rules/article-scores.md) | Document-level scores: engagement, narrative arc, closing strength |
| [`tech-docs`](rules/tech-docs.md) | Technical documentation patterns: structure, task orientation, completeness, code examples, minimizing complexity |
| [`grammar-english`](rules/grammar-english.md) | English grammar: spelling and confused words, agreement, verb tenses, prepositions, pronouns, sentence structure, comparatives |
| [`grammar-german`](rules/grammar-german.md) | German grammar: spelling and confused words, agreement and inflection, word order, punctuation and typography |
| [`no-ai-slop`](rules/no-ai-slop.md) | Banned words, empty adverbs, puffery, colon reveals, bold lead-in lists, weasel attribution, dramatic fragmentation |

### Custom rulesets

Define custom rules in Markdown (`-r ./my-rules.md`), organized under `# Line Rules` and `# Document Rules` sections.

You can be creative and ask any plain-text question about a single line or the whole document. Rules work on any text, git diffs, server logs, legal contracts, or structured text like CSV files:

```markdown
# Line Rules

## empty_adverb
Does the line use an adverb that adds nothing to the meaning?

### Criteria
- **true**: The adverb could be deleted without changing the sentence.
- **false**: The adverb carries real emphasis or spoken rhythm.

# Document Rules

## narrative_arc
Rate the narrative arc of the document.

### Criteria
- No clear arc — sections feel disconnected
- Loosely organized — a theme but no build
- Clear progression — each section sets up the next
- Tight arc — the ending pays off the opening
```

#### Keep rules granular

Keep each rule focused on a single pattern rather than combining multiple checks into one broad rule:

- **Actionable output:** When a line is flagged, the report prints the rule ID. A granular ID (e.g. `compound_spacing` instead of a generic `spelling`) shows immediately what failed without guessing which sub-clause triggered.
- **Evaluator accuracy:** Evaluator models score binary criteria far more reliably on single conditions. Bundling typos, word choice, and punctuation into one prompt degrades precision.
- **Isolated tuning:** You can refine criteria or add edge-case examples to a specific rule without regressing unrelated checks.

#### Inspirations for rulesets

<details>
<summary><strong>Structured text (CSV transaction audit)</strong></summary>

```markdown
# Line Rules

## suspicious_refund
Does this CSV transaction row show a refund exceeding $500 without a manager approval ID in column 6?

### Criteria
- **true**: The row records a refund over $500 and column 6 lacks an approval ID.
- **false**: The amount is $500 or less, column 6 contains an approval ID, or the row is not a refund.
```

</details>

<details>
<summary><strong>Incident postmortems (systemic analysis)</strong></summary>

```markdown
# Document Rules

## root_cause_depth
Evaluate whether this postmortem addresses systemic engineering safeguards instead of individual human error.

### Criteria
- Blames operator error without addressing missing guardrails
- Identifies immediate triggers but ignores underlying architecture
- Identifies failure modes and plans concrete monitoring or test coverage
- Proposes systemic automated defenses, blast-radius containment, and architectural fixes
```

</details>

<details>
<summary><strong>Legal agreements (contract risks)</strong></summary>

```markdown
# Line Rules

## uncapped_indemnity
Does this clause expose the company to uncapped indemnification for third-party claims?

### Criteria
- **true**: The clause creates an indemnification obligation without liability caps.
- **false**: The obligation falls under the standard aggregate liability limit.
```

</details>

<details>
<summary><strong>Customer conversations (support transcripts)</strong></summary>

```markdown
# Line Rules

## unauthorized_promise
Does this agent response promise an unreleased feature date or custom contract concession?

### Criteria
- **true**: Agent commits to an unannounced date or non-standard term.
- **false**: Agent refers customer to public docs or defers to account managers.
```

</details>

<details>
<summary><strong>Code review (unjustified type assertions)</strong></summary>

```markdown
# Line Rules

## unjustified_type_cast
Does this line use a type assertion (`as`), non-null assertion (`!`), or loose cast to silence a compiler error without proper narrowing or input validation?

### Criteria
- **true**: Casts away type safety without an upstream type guard, schema validation, or explanatory comment.
- **false**: Type is narrowed safely, or the assertion bridges an external API boundary with runtime checks.
```

</details>

<details>
<summary><strong>Security audit (hardcoded credentials and secrets)</strong></summary>

```markdown
# Line Rules

## hardcoded_secret
Does this line contain a hardcoded API key, bearer token, private key, or password rather than referencing an environment variable or secret manager?

### Criteria
- **true**: Line contains a literal credential, private token, or hardcoded secret string.
- **false**: Line references an environment variable, config placeholder, mock test fixture, or public key.
```

</details>

<details>
<summary><strong>Code quality (silent error swallowing)</strong></summary>

```markdown
# Line Rules

## swallowed_error
Does this catch block or fallback expression silence an unexpected error without diagnostic logging or recovery?

### Criteria
- **true**: Catches an exception and returns null or an empty default without logging context.
- **false**: Logs the error with context, rethrows, or implements a documented recovery strategy.
```

</details>

<details>
<summary><strong>Git workflow (commit message intent)</strong></summary>

```markdown
# Document Rules

## commit_intent
Does this commit message or PR description explain the motivation and problem context rather than merely describing code changes?

### Criteria
- Mechanical change list only with no rationale
- Mentions the fix with minimal explanation of the problem
- Explains the failure trigger, bug condition, and rationale clearly
- Details root cause, design tradeoffs considered, and verification evidence
```
</details>


See [`docs/SYNTAX.md`](docs/SYNTAX.md) for the complete Markdown rule syntax specification and validation reference.

Validate ruleset syntax offline without an API key:

```sh
npx @lukstei/slop-grader@latest --check -r ./my-rules.md
```

Use the [`create-slop-grader-rules`](skills/create-slop-grader-rules/SKILL.md) skill to create and validate custom rulesets with an AI assistant.

Custom JSON rulesets (`-r ./my-rules.json`) are also supported.

## CLI Reference

```sh
npx @lukstei/slop-grader@latest [-c|--check] [-l|--list-rulesets] -r <ruleset> [-r <ruleset> ...] [--provider <jev|openrouter>] [--model <model>] [--json] [--stats] [--debug] [-h|--help] [-v|--version] [file]
```

### Flags

| Flag | Short | Description |
|---|---|---|
| `--list-rulesets` | `-l` | List built-in rulesets and descriptions. |
| `--check` | `-c` | Validate ruleset syntax without grading or calling the API. |
| `--rules <name\|path>` | `-r` | Ruleset to apply. Repeatable. Accepts built-in names, Markdown (`.md`) files, or JSON file paths. |
| `--provider <jev\|openrouter>` | `-p` | Override the AI provider. |
| `--model <model>` | `-m` | Override the default model (`jev-latest` for `jev`, `~typesafe/jev-latest` for `openrouter`). |
| `--json` | `-j` | Emit structured JSON instead of the human-readable report. |
| `--stats` | `-s` | Print execution statistics (rules applied, lines evaluated, questions asked, API calls). |
| `--debug` | `-d` | Log all API calls (timing, request, response) as JSON to stderr. |
| `--help` | `-h` | Display usage information. |
| `--version` | `-v` | Display version number. |

### Providers and environment variables

| Variable | Description |
|---|---|
| `TYPESAFE_API_KEY` | API key for direct Jev access via TypeSafe AI. Automatically selects `jev`. |
| `OPENROUTER_API_KEY` | API key for OpenRouter. Automatically selects `openrouter`. |
| `TYPESAFE_PROVIDER` | Explicitly choose `jev` or `openrouter` without passing `--provider`. |

Provider resolution order:
1. `--provider` (`-p`) flag
2. `TYPESAFE_PROVIDER` environment variable
3. Auto-detected from keys (`TYPESAFE_API_KEY` selects `jev`; `OPENROUTER_API_KEY` selects `openrouter`)

Grading runs on `jev-latest` (TypeSafe) or `~typesafe/jev-latest` (OpenRouter) by default, overridable via `--model` (`-m`).

## Output Formats

### Human-readable report

By default, `slop-grader` prints a human-readable report. Clean lines are omitted; only lines crossing the 0.8 confidence threshold appear. Pass `--stats` (or `-s`) to append execution metrics (rules applied, lines evaluated, API calls).

If line rules run but find no violations, `No line rule violations found.` is displayed.

### JSON report (`--json`)

Pass `--json` (or `-j`) for structured machine-readable output:

```sh
npx @lukstei/slop-grader@latest -r no-ai-slop -r article-scores --json --stats my-draft.txt | jq .
```

```json
{
  "file": "/abs/path/to/my-draft.txt",
  "rules": ["/abs/path/to/no-ai-slop.md"],
  "violations": {
    "lines": [
      { "lineNum": 1, "text": "Our platform empowers teams...", "rules": ["banned_word"] }
    ],
    "document": {
      "narrative_arc": { "score": 1.4, "max": 3, "confidence": 0.72, "label": "Loosely organized" }
    }
  },
  "stats": {
    "rules": 6,
    "lineRules": 5,
    "docRules": 1,
    "lines": 12,
    "questions": 61,
    "apiCalls": 6
  }
}
```

`violations.lines` and `violations.document` are empty when the file is clean. Useful for CI pipelines and editor integrations.

## Development

```sh
npm test         # Run tests
npm run verify   # Run typecheck, biome lint, and tests
npm run build    # Build
```

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for contribution guidelines, development setup, and coding best practices.

## License

MIT
