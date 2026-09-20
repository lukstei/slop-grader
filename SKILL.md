---
name: slop-grading
description: >
  Review the output of main.ts (the slop grader), interpret flagged lines,
  distinguish genuine violations from false positives, and produce a concrete
  fix plan with edited text for each real issue.
---

# Slop Grading — Review & Fix Plan

You receive the stdout of `main.ts` and the original source file. Your job is to triage every flagged line, dismiss false positives, and produce a minimal fix plan with exact replacement text for every genuine violation.

## Output format of main.ts

The tool prints the rule files it used, then the line-flag report, then the Document Scores block (if document-scoped rules were loaded).

**Header**
```
Rules:
  /absolute/path/to/no-ai-slop.json
  /absolute/path/to/article-scores.json
```

**Line flags**
```
A=banned_word, B=empty_adverb, C=importance_puffery, ...   ← legend

A,C           | L0003: The launch marks a pivotal moment for the company.
B             | L0007: This is just a small update.
```

- **First line:** legend mapping letters to rule IDs.
- **Flagged lines:** `<letters> | <line-marker>: <original text>`. Only lines that crossed the threshold (default 0.8) appear.
- Lines with no flags are clean — do not touch them.

**Document Scores**
```
── Document Scores ──────────────────────────────────────────────────

engagement       2.7/3   (confidence high)  "Holds attention — creates genuine curiosity..."
narrative_arc    1.4/3   (confidence mid)   "Loosely organized" ↔ "Clear progression"
closing_strength 0.3/3   (confidence high)  "Trails off or summarizes"
```

- **Score:** probability-weighted mean position across 4 levels (0–3). Higher is better.
- **Confidence tier:** `high` (≥ 0.8) means the model is sure; `mid` (0.5–0.79) and `low` (< 0.5) mean the distribution is spread.
- **Single label:** dominant level description when confidence is high or the score sits clearly at one level.
- **↔ two labels:** shown when the score lands mid-range *and* confidence is `mid` or `low` — the article sits genuinely between those two levels.

## Step 1 — Parse

Read the legend. Map every letter on each flagged line back to its rule ID and the rule's plain-English meaning. List each flagged line with its rule(s) spelled out.

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
| `anglicism_where_german_exists` | The English term is established in the target domain |
| `colon_reveal` | The colon introduces a list or definition, not drama |
| `synonym_cycling` | The different terms mark a real distinction, not variety for style |
| `missing_comma_subordinate` | The sentence is a list item or headline where a comma is grammatically optional |

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

**Input (main.ts output):**
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
