---
name: slop-grading
description: >
  Review the output of slop-grader, interpret flagged lines and document scores,
  distinguish genuine violations from false positives, and produce a concrete
  fix plan with edited text for each real issue.
---

# Slop Grading — Review & Fix Plan

You receive the output of `slop-grader` (human-readable text or JSON via `--json`) and the original source file. Available built-in rulesets can be listed with `slop-grader --list-rulesets` (or `-l`, `--json` to inspect scopes, rule counts, and rule IDs). Your job is to triage every flagged line, dismiss false positives, and produce a minimal fix plan with exact replacement text for every genuine violation.

## Output formats of slop-grader

The tool emits either human-readable text (default) or structured JSON (via `--json` / `-j`).

### Format A — Human-readable text

```
Rules:
  /absolute/path/to/no-ai-slop.md
  /absolute/path/to/article-scores.md

A=banned_word, B=empty_adverb, C=importance_puffery   ← legend

A,C           | L0003: The launch marks a pivotal moment for the company.
B             | L0007: This is just a small update.

## Document Scores

engagement       2.7/3   (confidence high)  "Holds attention — creates genuine curiosity..."
narrative_arc    1.4/3   (confidence mid)   "Loosely organized" ↔ "Clear progression"
closing_strength 0.3/3   (confidence high)  "Trails off or optimizes"

## Stats

Rules applied:    6 (5 line, 1 document)
Lines evaluated:  12
Questions asked:  61
API calls:        6
```

- **Legend:** maps letters to rule IDs (`A`–`Z`, `AA`–`ZZ`).
- **Flagged lines:** `<letters> | <line-marker>: <original text>`. Only lines that crossed the threshold (default 0.8) appear. If line rules are evaluated but no violations are found, `No line rule violations found.` is displayed.
- **Document Scores:** probability-weighted mean position across 4 levels (0–3), confidence tier (`high` ≥ 0.8, `mid` 0.5–0.79, `low` < 0.5), and descriptions.
- **Stats (optional):** execution metrics appended when `--stats` is passed. Ignore this block during triage.
- **Debug (optional):** when `--debug` is passed, API calls are logged to stderr; ignore stderr output during triage.
- Lines with no flags are clean — do not touch them.

### Format B — Structured JSON (`--json`)

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

- **`violations.lines`:** list of flagged lines with 1-indexed `lineNum`, original `text`, and array of `rules`.
- **`violations.document`:** document-level quality scores and boolean rule violations. Map numerical `confidence` to tiers: `high` (≥ 0.8), `mid` (0.5–0.79), `low` (< 0.5).
- **`stats`:** execution metrics. Ignore during triage.
- **Clean output:** `violations.lines` and `violations.document` are empty when no issues are detected.

## Step 1 — Parse

1. **Check for clean output:** If no lines are flagged and no document scores need attention (or `violations.lines` and `violations.document` are empty in JSON), report that the document is clean and stop.
2. **For human-readable text:** Read the legend. Map each letter back to its rule ID and the rule's plain-English meaning. List each flagged line with its rule(s) spelled out.
3. **For JSON:** Read `violations.lines` directly; rule IDs and line numbers are already explicit. Map each `violations.document` confidence value to its tier (`high`, `mid`, `low`).

## Step 2 — Triage (dismiss false positives first)

For each flag, ask: *does the rule genuinely apply here in context?*

Common false positive patterns to dismiss without a fix:

| Flag | Dismiss when… |
|---|---|
| `empty_adverb` | The adverb carries the writer's emphasis, contrast, or spoken rhythm |
| `banned_word` | The word is used in a quote, technical name, or proper noun |
| `binary_contrast` | The negation is genuine contrast, not a rhetorical reveal |
| `dramatic_fragmentation` | The fragment is natural spoken prose, not a mic-drop device |
| `passive_voice_overuse` | The actor is unknown or the object deserves emphasis |
| `academic_semicolon` | The clauses are tightly parallel and the semicolon reads naturally |
| `spelling_and_confused_words` | The English term is established in the target domain |
| `colon_reveal` | The colon introduces a list or definition, not drama |
| `synonym_cycling` | The different terms mark a real distinction, not variety for style |
| `punctuation_and_typography` | The sentence is a list item or headline where a comma is grammatically optional |
| `bold_lead_in_list` | The list is a genuine technical checklist, spec, API reference, or collection of distinct items where list structure aids scanning |

When you dismiss a flag, state the reason in one sentence. Do not suggest a fix.

## Step 3 — Fix plan

For every flag you did **not** dismiss, produce:

```
Line <N> — <rule_id>
Original: <exact original text>
Fix:      <minimal rewrite — change as little as possible>
Reason:   <one sentence>
```

Rules for the fix:
- **Minimum effective edit.** Change only what the rule requires. Leave the rest of the sentence untouched.
- **Preserve the writer's voice.** Don't improve style beyond what the rule demands.
- **No fix chains.** Fix one violation per line. If a line has multiple genuine flags, address each as a separate fix block.
- **Legal flags are non-negotiable.** Rules from the legal rulebook (`scraped_photo_reference`, `missing_gross_price`, `unverified_ranking`, `disguised_commercial_intent`, etc.) are always genuine — never dismiss them as false positives. The fix may be a deletion, a label addition, or a disclosure insertion rather than a rewrite.

## Step 4 — Summary

After all fix blocks, output a one-line count:

```
X flags reviewed — Y dismissed as false positives, Z fixes applied.
```

## Step 5 — Document Scores (if present)

If the output contains a Document Scores block, interpret it after the line-flag summary.

For each score:
- **Skip** axes where score ≥ 2.5 and confidence is `high` — the article is strong there, nothing to say.
- **Flag for attention** any axis with score < 2.0 or confidence `low`.
- For flagged axes, write one sentence naming the weakness and one concrete suggestion for how the author could move up one level.

Format:
```
Document Scores — 3 axes need attention:

narrative_arc    1.4/3  (confidence mid)
  The sections relate to the topic but don't build — add a bridging
  sentence at the end of each section that sets up the next.

closing_strength 0.3/3  (confidence high)
  The ending summarises rather than lands — replace the final paragraph
  with a single decision rule or provocation the reader takes away.
```

Low-confidence scores (↔ display) are genuine uncertainty — name both levels and let the author judge which fits.

## Example

### Human-readable input

**Input:**
```
A=banned_word, B=importance_puffery, C=empty_adverb

A,B           | L0001: Our platform empowers teams to unlock their full potential.
C             | L0005: This is just a routing fix.
```

**Output:**

**L0001 — `banned_word`**
Dismissed: "empowers" is on the banned list. Genuine violation.

**L0001 — `importance_puffery`**
Dismissed: "unlock their full potential" is vague puffery. Genuine violation.

```
Line 1 — banned_word + importance_puffery
Original: Our platform empowers teams to unlock their full potential.
Fix:      Our platform helps teams ship faster.
Reason:   Removes "empowers" (banned) and replaces "unlock their full potential" with a concrete outcome.
```

**L0005 — `empty_adverb`**
Dismissed: "just" here signals the scope of the change — it's not decorative. False positive.

```
2 flags reviewed — 1 dismissed as false positive, 1 fix applied (2 rules merged into 1 edit).
```

### JSON input

**Input:**
```json
{
  "violations": {
    "lines": [
      {
        "lineNum": 1,
        "text": "Our platform empowers teams to unlock their full potential.",
        "rules": ["banned_word", "importance_puffery"]
      },
      {
        "lineNum": 5,
        "text": "This is just a routing fix.",
        "rules": ["empty_adverb"]
      }
    ]
  }
}
```

Produces the exact same triage, fix plan, and summary as the human-readable input above.
