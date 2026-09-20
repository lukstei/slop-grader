# slop-grader

[![CI](https://github.com/lukstei/slop-grader/actions/workflows/ci.yml/badge.svg)](https://github.com/lukstei/slop-grader/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![NPM Version](https://img.shields.io/npm/v/@lukstei/slop-grader.svg)](https://www.npmjs.com/package/@lukstei/slop-grader)
[![Minified Size](https://badgen.net/bundlephobia/min/@lukstei/slop-grader)](https://bundlephobia.com/package/@lukstei/slop-grader)

[Jev](https://typesafe.ai)-powered, rule-based slop grader for text files.

> Run it on a document, copy the output into an AI agent. The agent uses the bundled `SKILL.md` to triage false positives and produce a minimal fix plan.

## Usage

```sh
# Option 1: Direct Jev via TypeSafe AI
export TYPESAFE_API_KEY=...

# Option 2: Via OpenRouter
export OPENROUTER_API_KEY=sk-or-...

npx @lukstei/slop-grader@latest -r <ruleset> [-r <ruleset> ...] [--json] [--stats] [--debug] <file>
```

Example:

```sh
npx @lukstei/slop-grader@latest -r no-ai-slop -r article-scores my-draft.md
```

Pass a ruleset by bare name (resolved from the built-in `rules/` directory) or by path to a custom JSON file.

### Flags

| Flag | Short | Description |
|---|---|---|
| `--rules <name\|path>` | `-r` | Ruleset to apply. Repeatable. |
| `--provider <jev\|openrouter>` | `-p` | Override the AI provider. |
| `--json` | `-j` | Emit structured JSON instead of the human-readable report. |
| `--stats` | `-s` | Print execution statistics (rules applied, lines evaluated, questions asked, API calls). |
| `--debug` | `-d` | Log all API calls (timing, request, response) as JSON to stderr. |

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
| [`no-ai-slop`](rules/no-ai-slop.json) | Line | Banned words, empty adverbs, puffery, colon reveals, bold lead-in lists, weasel attribution, dramatic fragmentation |

## Output

Running `slop-grader` on [`examples/slop.md`](examples/slop.md):

```
$ npx @lukstei/slop-grader@latest -r no-ai-slop -r grammar-english -r tech-docs --stats examples/slop.md

Use the SKILL `/path/to/slop-grader/SKILL.md` to improve `/path/to/slop-grader/examples/slop.md`.

Rules:
  /path/to/slop-grader/rules/no-ai-slop.json
  /path/to/slop-grader/rules/grammar-english.json
  /path/to/slop-grader/rules/tech-docs.json

A=banned_word, B=empty_adverb, C=empty_phrase, D=binary_contrast, E=throat_clearing, F=faux_insight, G=colon_reveal, H=negative_listing, I=dramatic_fragmentation, J=rhetorical_setup, K=superficial_analysis, L=importance_puffery, M=interpretive_meta, N=weasel_attribution, O=fake_strong_verb, P=synonym_cycling, Q=fake_profound_kicker, R=summary_recap, S=formatting_slop, T=em_dash_crutch, U=bold_lead_in_list, V=typo_or_misspelling, W=passive_voice_overuse, X=comma_splice, Y=dangling_modifier, Z=run_on_sentence, AA=subject_verb_disagreement, AB=wrong_homophone, AC=noun_pile_up, AD=minimizing_complexity, AE=undefined_jargon, AF=ambiguous_reference, AG=missing_version_qualifier, AH=magic_value, AI=stale_placeholder

A               | L0001: # 🚀 The Ultimate Paradigm Shift in Modern Data Architecture
A               | L0003: In this article, we will delve into the rich tapestry of modern distributed systems and explore how they seamlessly empower developers to unlock their true potential.
D,F,G,Q         | L0007: What most people get wrong about databases is simple: it's not about speed, it's about trust.
G               | L0009: The secret: it's all about asynchronous event-driven pipelines.
N               | L0011: Studies show that 90% of architectures fail because of poor alignment.
I               | L0013: Fast. Resilient. Uncompromising.
H,I,Q           | L0015: Not a database. Not an API. A movement.
M               | L0017: That last part matters more than it sounds.
AD              | L0019: Simply install the cluster with the CLI by entering YOUR_API_KEY into `config.yaml`, it's trivial.
V,X             | L0021: The server crashed, we defiantly rolled back the release immediately.
A,U             | L0023: - **The philosophical shift:** When we first embarked on this journey, the team realized that traditional monoliths were stifling innovation across every dimension.
A,O,U           | L0024: - **The breakthrough moment:** We meticulously re-architected the entire ingestion platform to serve as a centralized hub for real-time telemetry.
AE,AH           | L0026: Set the heartbeat interval to 4194304 without altering the QPX-9 router settings.
L,Q,R           | L0028: In conclusion, modern cloud systems stand as a testament to human ingenuity.
C,Q             | L0030: Because at the end of the day, code is just poetry written in silicon.

## Document Scores

structure_navigability  0.6/3   (confidence mid )  "Wall of text" ↔ "Has headings but they are vague or inconsistent"
task_orientation        0.6/3   (confidence mid )  "Architecture dump" ↔ "Mixed"
completeness            0.0/3   (confidence high)  "Fragment — critical steps, configuration, or context are missing; the reader cannot complete the task from this document alone"
code_example_quality    0.1/3   (confidence high)  "No examples, or examples are pseudocode fragments that cannot run"
prerequisite_clarity    0.6/3   (confidence mid )  "No prerequisites stated" ↔ "Partially stated"

## Stats

Rules applied:    40 (35 line, 5 document)
Lines evaluated:  16
Questions asked:  565
API calls:        36
```

Total cost for this run was $0.003042.

Only lines that cross the 0.8 confidence threshold appear. Clean lines are not printed. If line rules are evaluated but no violations are detected, `No line rule violations found.` is displayed. Pass `--stats` (or `-s`) to append execution metrics.

### Next steps: fixing with an AI agent

Copy the output into an AI agent with [`SKILL.md`](SKILL.md) in context to triage violations and apply fixes:

- [Example plan from Gemini 3.8 Flash](examples/plan.md)
- [Improved document](examples/slop-improved.md)

### JSON output

Pass `--json` (or `-j`) to get machine-readable output instead:

```sh
npx @lukstei/slop-grader@latest -r no-ai-slop -r article-scores --json --stats my-draft.txt | jq .
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

## How evaluation works

`slop-grader` splits rules into line-level rules (`"scope": "line"`) and document-level rules (`"scope": "document"`).

### Line batching and questions

1. **Parsing:** The document is split into non-empty lines, each assigned a 1-based marker like `L0001`.
2. **Batching:** Lines are chunked into batches of up to 255 lines (`BATCH_SIZE`).
3. **Question mapping:** For each line rule, `slop-grader` makes one API call per batch. The request state contains all lines in the batch formatted as `L0001| line text`. The request defines one question per line: `For the line L0001 answer: <rule instructions>`.
4. **Execution:** All rule and batch requests run concurrently with `Promise.all`.
5. **Thresholding:** Each line rule asks a `noul` question (confidence between 0 and 1). Lines scoring above 0.8 are flagged.

Document rules run in a single call over the full text, returning discrete score distributions (0 to 3).

### Why not one request per line?

The obvious alternative is sending one API request per line (with surrounding context lines) and asking all rules for that line in that single request.

That design fails on cardinality. Documents often have hundreds or thousands of lines ($L$), while rulesets rarely have more than 5 to 10 rules ($R$).

If requests are organized per line:
- Request count scales with $L$ ($O(L)$).
- A 300-line document with 5 rules takes 300 API requests. Each request asks 5 questions.
- 300 HTTP requests introduce latency, rate-limit pressure, and connection overhead.

By inverting the axes and grouping by rule:
- Lines become questions inside a batch. Jev accepts up to 255 questions in a single decision call.
- Request count scales with rules: $R \times \lceil L / 255 \rceil$.
- That same 300-line document with 5 rules takes only 10 API requests ($5 \times 2$), with each call evaluating 1 rule across up to 255 lines at once.

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

