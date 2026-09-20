# slop-grader

[![CI](https://github.com/lukstei/slop-grader/actions/workflows/ci.yml/badge.svg)](https://github.com/lukstei/slop-grader/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![NPM Version](https://img.shields.io/npm/v/@lukstei/slop-grader.svg)](https://www.npmjs.com/package/@lukstei/slop-grader)
[![Minified Size](https://badgen.net/bundlephobia/min/@lukstei/slop-grader)](https://bundlephobia.com/package/@lukstei/slop-grader)

Jev-powered, rule-based slop grader for text files.

Run it on a draft. Copy the output into an AI agent. The agent uses the bundled `SKILL.md` to triage false positives and produce a minimal fix plan.

## Usage

```sh
# Option 1: Direct Jev via TypeSafe AI
export TYPESAFE_API_KEY=...

# Option 2: Via OpenRouter
export OPENROUTER_API_KEY=sk-or-...

npx @lukstei/slop-grader@latest -r <ruleset> [-r <ruleset> ...] [--json] <file>
```

Example:

```sh
npx @lukstei/slop-grader@latest -r no-ai-slop -r article-scores my-draft.txt
```

Pass a ruleset by bare name (resolved from the built-in `rules/` directory) or by path to a custom JSON file.

### Flags

| Flag | Short | Description |
|---|---|---|
| `--rules <name\|path>` | `-r` | Ruleset to apply. Repeatable. |
| `--provider <jev\|openrouter>` | `-p` | Override the AI provider. |
| `--json` | `-j` | Emit structured JSON instead of the human-readable report. |

### Environment variables

| Variable | Description |
|---|---|
| `TYPESAFE_API_KEY` | API key for direct Jev access via TypeSafe AI. Automatically selects the `jev` provider. |
| `OPENROUTER_API_KEY` | API key for OpenRouter. Automatically selects the `openrouter` provider. |
| `TYPESAFE_PROVIDER` | Explicitly choose `jev` or `openrouter` without passing `--provider`. |

Provider resolution order:
1. `--provider` (`-p`) flag
2. `TYPESAFE_PROVIDER` environment variable
3. Auto-detected from keys (`TYPESAFE_API_KEY` selects `jev`; `OPENROUTER_API_KEY` selects `openrouter`)

Grading runs on `typesafe/jev-1.13` across both providers.

## Built-in rulesets

| Ruleset | Scope | What it checks |
|---|---|---|
| [`article-scores`](rules/article-scores.json) | Document | Document-level scores: engagement, narrative arc, closing strength |
| [`tech-docs`](rules/tech-docs.json) | Document | Technical documentation patterns: structure, task orientation, completeness, code examples |
| [`grammar-english`](rules/grammar-english.json) | Line | English grammar: typos, passive voice, comma splices, run-ons, subject-verb disagreement |
| [`grammar-german`](rules/grammar-german.json) | Line | German grammar: capitalization, comma splices, Anglicisms, compound spelling |
| [`no-ai-slop`](rules/no-ai-slop.json) | Line | Banned words, empty adverbs, puffery, colon reveals, weasel attribution, dramatic fragmentation |

## Output

```
A=banned_word, B=importance_puffery, C=empty_adverb

A,B           | L0001: Our platform empowers teams to unlock their full potential.
C             | L0005: This is just a routing fix.

── Document Scores ────────────────────────────────────────────────────

engagement       2.7/3   (confidence high)  "Holds attention — creates genuine curiosity..."
narrative_arc    1.4/3   (confidence mid)   "Loosely organized" ↔ "Clear progression"
closing_strength 0.3/3   (confidence high)  "Trails off or summarizes"
```

Only lines that cross the 0.8 confidence threshold appear. Clean lines are not printed.

### JSON output

Pass `--json` (or `-j`) to get machine-readable output instead:

```sh
npx @lukstei/slop-grader@latest -r no-ai-slop -r article-scores --json my-draft.txt | jq .
```

```json
{
  "file": "/abs/path/to/my-draft.txt",
  "rules": ["/abs/path/to/no-ai-slop.json"],
  "violations": {
    "lines": [
      { "lineNum": 1, "text": "Our platform empowers teams...", "rules": ["banned_word"] }
    ],
    "document": {
      "narrative_arc": { "score": 1.4, "max": 3, "confidence": 0.72, "label": "Loosely organized" }
    }
  }
}
```

Always emitted — `violations.lines` and `violations.document` are empty when the file is clean. Useful for CI pipelines or editor integrations.

Copy this output into any AI agent with `SKILL.md` in context. The skill tells the agent how to triage each flag, dismiss false positives, and write a fix for each genuine violation.

## Custom rulesets

A ruleset is a JSON file. Each key is a rule. Two scopes:

**`"line"`** — evaluated per line, fires a flag letter when confidence ≥ 0.8:

```json
{
  "empty_adverb": {
    "scope": "line",
    "type": "noul",
    "instructions": "Does the line use an adverb that adds nothing to the meaning?",
    "criteria": {
      "true": "The adverb could be deleted without changing the sentence.",
      "false": "The adverb carries real emphasis or spoken rhythm."
    }
  }
}
```

**`"document"`** — scores the full text on a 0–N scale:

```json
{
  "narrative_arc": {
    "scope": "document",
    "type": "score",
    "instructions": "Rate the narrative arc of the document.",
    "criteria": [
      "No clear arc — sections feel disconnected",
      "Loosely organized — a theme but no build",
      "Clear progression — each section sets up the next",
      "Tight arc — the ending pays off the opening"
    ]
  }
}
```

## Development

```sh
npm test         # Run vitest snapshot tests
npm run verify   # Run typecheck, biome lint, and tests
npm run build    # Build with esbuild to dist/slop-grader.mjs
```

## Requirements

- Node.js 18+
- An API key for your chosen provider:
  - `TYPESAFE_API_KEY` — get one at [typesafe.ai](https://typesafe.ai)
  - `OPENROUTER_API_KEY` — get one at [openrouter.ai](https://openrouter.ai)

## License

MIT

