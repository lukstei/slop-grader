# slop-grader

[![CI](https://github.com/lukstei/slop-grader/actions/workflows/ci.yml/badge.svg)](https://github.com/lukstei/slop-grader/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![NPM Version](https://img.shields.io/npm/v/@lukstei/slop-grader.svg)](https://www.npmjs.com/package/@lukstei/slop-grader)
[![Minified Size](https://badgen.net/bundlephobia/min/@lukstei/slop-grader)](https://bundlephobia.com/package/@lukstei/slop-grader)

Rule-based slop grader for text files, powered by [Jev](https://typesafe.ai).

## How it works

`slop-grader` runs as a two-step loop: grade text with the CLI, then paste the output to your AI agent to plan the improvements.

### 1. Grade the document

Run `slop-grader` on a document like [`examples/slop.md`](examples/slop.md):

```sh
npx @lukstei/slop-grader@latest -r no-ai-slop -r grammar-english -r tech-docs examples/slop.md
```

Output:

```
Use the SKILL `/path/to/slop-grader/SKILL.md` to improve `/path/to/slop-grader/examples/slop.md`.

Rules:
  /path/to/slop-grader/rules/no-ai-slop.md
  /path/to/slop-grader/rules/grammar-english.md
  /path/to/slop-grader/rules/tech-docs.md

A=banned_word, B=empty_adverb, D=binary_contrast, F=faux_insight, G=colon_reveal, ...

A               | L0001: # 🚀 The Ultimate Paradigm Shift in Modern Data Architecture
A               | L0003: In this article, we will delve into the rich tapestry of modern distributed systems and explore how they seamlessly empower developers to unlock their true potential.
D,F,G,Q         | L0007: What most people get wrong about databases is simple: it's not about speed, it's about trust.
G               | L0009: The secret: it's all about asynchronous event-driven pipelines.
N               | L0011: Studies show that 90% of architectures fail because of poor alignment.
...

## Document Scores

structure_navigability  0.6/3   (confidence mid )  "Wall of text" ↔ "Has headings but they are vague or inconsistent"
task_orientation        0.6/3   (confidence mid )  "Architecture dump" ↔ "Mixed"
completeness            0.0/3   (confidence high)  "Fragment — critical steps, configuration, or context are missing"
code_example_quality    0.1/3   (confidence high)  "No examples, or examples are pseudocode fragments that cannot run"
prerequisite_clarity    0.6/3   (confidence mid )  "No prerequisites stated" ↔ "Partially stated"
```

### 2. Fix with an AI agent

Pass the output to your AI agent:

- The agent distinguishes real violations from false positives and generates concrete replacements (example plan with Gemini 3.8 Flash: [full plan](examples/plan.md)):
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

Pass built-in rulesets by name:

| Ruleset | Scope | What it checks |
|---|---|---|
| [`article-scores`](rules/article-scores.md) | Document | Document-level scores: engagement, narrative arc, closing strength |
| [`tech-docs`](rules/tech-docs.md) | Document & Line | Technical documentation patterns: structure, task orientation, completeness, code examples, minimizing complexity |
| [`grammar-english`](rules/grammar-english.md) | Line | English grammar: typos, passive voice, comma splices, run-ons, subject-verb disagreement |
| [`grammar-german`](rules/grammar-german.md) | Line | German grammar: capitalization, comma splices, Anglicisms, compound spelling |
| [`no-ai-slop`](rules/no-ai-slop.md) | Line | Banned words, empty adverbs, puffery, colon reveals, bold lead-in lists, weasel attribution, dramatic fragmentation |

### Custom rulesets

Define custom rules in Markdown (`-r ./my-rules.md`), organized under `# Line Rules` and `# Document Rules` sections:

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

See [`docs/SYNTAX.md`](docs/SYNTAX.md) for the complete Markdown rule syntax specification and validation reference.

Validate ruleset syntax offline without an API key:

```sh
npx @lukstei/slop-grader@latest --check -r ./my-rules.md
```

Use the [`create-slop-grader-rules`](skills/create-slop-grader-rules/SKILL.md) skill to create and validate custom rulesets with an AI assistant.

Custom JSON rulesets (`-r ./my-rules.json`) are also supported.

## CLI Reference

```sh
npx @lukstei/slop-grader@latest [-c|--check] -r <ruleset> [-r <ruleset> ...] [--provider <jev|openrouter>] [--model <model>] [--json] [--stats] [--debug] [file]
```

### Flags

| Flag | Short | Description |
|---|---|---|
| `--check` | `-c` | Validate ruleset syntax without grading or calling the API. |
| `--rules <name\|path>` | `-r` | Ruleset to apply. Repeatable. Accepts built-in names, Markdown (`.md`) files, or JSON file paths. |
| `--provider <jev\|openrouter>` | `-p` | Override the AI provider. |
| `--model <model>` | `-m` | Override the default model (`jev-latest` for `jev`, `~typesafe/jev-latest` for `openrouter`). |
| `--json` | `-j` | Emit structured JSON instead of the human-readable report. |
| `--stats` | `-s` | Print execution statistics (rules applied, lines evaluated, questions asked, API calls). |
| `--debug` | `-d` | Log all API calls (timing, request, response) as JSON to stderr. |

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

## How Evaluation Works

Evaluation separates line-level checks (spotting specific patterns or phrases) from document-level checks (evaluating tone or overall structure).

### Batching by rule instead of line

Documents have hundreds of lines, but the amount of rules is fixed.

Sending one API request per line would mean hundreds of calls to the AI. A 300-line document with 5 rules would take 300 requests.

Instead, `slop-grader` groups lines into batches of 255 and evaluates each rule across the entire batch in a single call. That same 300-line document runs in just 10 parallel requests.

Document rules run in a single request across the entire text.

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
