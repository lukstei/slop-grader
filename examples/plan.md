# Slop Grading — Review & Fix Plan: `examples/slop.md`

## Step 1 — Parse

### Rule Legend
- **A**: `banned_word` — Banned corporate/AI buzzwords.
- **C**: `empty_phrase` — Filler phrases that delay the point.
- **D**: `binary_contrast` — "Not X, it's Y" rhetorical reveal framing.
- **F**: `faux_insight` — "What most people get wrong" exclusivity claims.
- **G**: `colon_reveal` — Noun-phrase colon reveal for dramatic effect.
- **H**: `negative_listing` — "Not a X. Not a Y. A Z." stacked negations.
- **I**: `dramatic_fragmentation` — Punchy one-word or stacked sentence fragments.
- **L**: `importance_puffery` — Asserting importance ("stands as a testament") instead of stating facts.
- **M**: `interpretive_meta` — Metadiscourse telling the reader what to notice.
- **N**: `weasel_attribution` — Vague unsourced authority ("Studies show") and statistics.
- **O**: `fake_strong_verb` — Inflated verb phrases ("serve as a centralized hub for").
- **Q**: `fake_profound_kicker` — Aphoristic or metaphorical mic-drop closers.
- **R**: `summary_recap` — "In conclusion" recap ending without new information.
- **U**: `bold_lead_in_list` — Bold lead-in bullet forcing narrative into list format.
- **V**: `typo_or_misspelling` — Typo or malapropism ("defiantly" for "definitely").
- **X**: `comma_splice` — Independent clauses joined only by a comma.
- **AD**: `minimizing_complexity` — Trivializing complex actions ("simply", "it's trivial").
- **AE**: `undefined_jargon` — Acronym or domain term used without definition ("QPX-9").
- **AH**: `magic_value` — Hardcoded constant without explanation ("4194304").

---

## Step 2 & 3 — Triage & Fix Plan

### Line 1 — `banned_word`
- **Original:** `# 🚀 The Ultimate Paradigm Shift in Modern Data Architecture`
- **Fix:** `# Modern Data Architecture`
- **Reason:** Removes the banned phrase "paradigm shift" and decorative emoji.

### Line 3 — `banned_word`
- **Original:** `In this article, we will delve into the rich tapestry of modern distributed systems and explore how they seamlessly empower developers to unlock their true potential.`
- **Fix:** `This article examines distributed system patterns that help developers build reliable services.`
- **Reason:** Removes banned words "delve", "tapestry", and "empower", eliminating promotional puffery.

### Line 7 — `binary_contrast` + `faux_insight` + `colon_reveal` + `fake_profound_kicker`
- **Original:** `What most people get wrong about databases is simple: it's not about speed, it's about trust.`
- **Fix:** `Database reliability depends primarily on trust rather than raw query speed.`
- **Reason:** Removes the faux-insight setup, colon reveal, and "not X, it's Y" contrast to state the point directly.

### Line 9 — `colon_reveal`
- **Original:** `The secret: it's all about asynchronous event-driven pipelines.`
- **Fix:** `The architecture uses asynchronous event-driven pipelines.`
- **Reason:** Replaces the dramatic colon-reveal hook with a direct statement.

### Line 11 — `weasel_attribution`
- **Original:** `Studies show that 90% of architectures fail because of poor alignment.`
- **Fix:** `Architectures frequently fail because of poor alignment between engineering teams.`
- **Reason:** Removes the unsourced "Studies show" claim and unverified statistic.

### Line 13 — `dramatic_fragmentation`
- **Original:** `Fast. Resilient. Uncompromising.`
- **Fix:** `The system is designed to be fast and resilient.`
- **Reason:** Replaces dramatic one-word fragments with a complete sentence.

### Line 15 — `negative_listing` + `dramatic_fragmentation` + `fake_profound_kicker`
- **Original:** `Not a database. Not an API. A movement.`
- **Fix:** `The platform combines data storage and API services.`
- **Reason:** Eliminates negative listing and rhetorical fragments in favor of a factual description.

### Line 17 — `interpretive_meta`
- **Original:** `That last part matters more than it sounds.`
- **Fix:** `[Delete line]`
- **Reason:** Removes metadiscourse that tells the reader what to notice rather than stating facts.

### Line 19 — `minimizing_complexity`
- **Original:** `Simply install the cluster with the CLI by entering YOUR_API_KEY into \`config.yaml\`, it's trivial.`
- **Fix:** `Install the cluster with the CLI after setting \`api_key\` in \`config.yaml\`.`
- **Reason:** Removes minimizing terms ("Simply", "it's trivial") from configuration steps.

### Line 21 — `typo_or_misspelling` + `comma_splice`
- **Original:** `The server crashed, we defiantly rolled back the release immediately.`
- **Fix:** `The server crashed. We definitely rolled back the release immediately.`
- **Reason:** Fixes the malapropism "defiantly" to "definitely" and splits the comma splice into two sentences.

### Line 23 — `banned_word` + `bold_lead_in_list`
- **Original:** `- **The philosophical shift:** When we first embarked on this journey, the team realized that traditional monoliths were stifling innovation across every dimension.`
- **Fix:** `When we began the migration, the team found that the monolith slowed feature delivery.`
- **Reason:** Replaces the bold lead-in narrative list item and the banned word "embarked" with continuous prose and specific language.

### Line 24 — `banned_word` + `fake_strong_verb` + `bold_lead_in_list`
- **Original:** `- **The breakthrough moment:** We meticulously re-architected the entire ingestion platform to serve as a centralized hub for real-time telemetry.`
- **Fix:** `We redesigned the ingestion platform to route real-time telemetry.`
- **Reason:** Removes the narrative list format, the banned word "meticulously", and simplifies the verb phrase "serve as a centralized hub for" to "route".

### Line 26 — `undefined_jargon` + `magic_value`
- **Original:** `Set the heartbeat interval to 4194304 without altering the QPX-9 router settings.`
- **Fix:** `Set the heartbeat interval to 4194304 microseconds (4.19 seconds, the cluster default) without altering the edge router (QPX-9) settings.`
- **Reason:** Explains the unit and significance of the magic number and defines the QPX-9 router context.

### Line 28 — `importance_puffery` + `fake_profound_kicker` + `summary_recap`
- **Original:** `In conclusion, modern cloud systems stand as a testament to human ingenuity.`
- **Fix:** `[Delete line]`
- **Reason:** Deletes an empty summary recap and importance puffery that adds no technical substance.

### Line 30 — `empty_phrase` + `fake_profound_kicker`
- **Original:** `Because at the end of the day, code is just poetry written in silicon.`
- **Fix:** `[Delete line]`
- **Reason:** Removes the filler phrase "at the end of the day" and the decorative aphorism.

---

## Step 4 — Summary

15 flags reviewed — 0 dismissed as false positives, 15 fixes applied.

---

## Step 5 — Document Scores

Document Scores — 5 axes need attention:

1. **`structure_navigability` (0.6/3, confidence mid):**
   The document lacks descriptive section headings to organize content — add clear task-based headings (`## Overview`, `## Prerequisites`, `## Installation`, `## Configuration`) so readers can scan and navigate quickly.

2. **`task_orientation` (0.6/3, confidence mid):**
   The text mixes conceptual claims with disconnected commands — organize each section around concrete reader tasks with clear inputs, steps, and verification commands.

3. **`completeness` (0.0/3, confidence high):**
   Critical steps, configuration schemas, and context are missing — document the complete end-to-end setup workflow including error handling and required parameters.

4. **`code_example_quality` (0.1/3, confidence high):**
   There are no runnable code or configuration examples — add a valid, copy-pasteable `config.yaml` sample and working CLI invocation.

5. **`prerequisite_clarity` (0.6/3, confidence mid):**
   Prerequisites are completely unstated — add a dedicated Prerequisites section listing supported CLI versions, required cluster permissions, and network access requirements.

---

## Improved Document Preview

```markdown
# Modern Data Architecture

This article examines distributed system patterns that help developers build reliable services.

Before we begin, it goes without saying that data engineering is fundamentally evolving in today's fast-paced world.

Database reliability depends primarily on trust rather than raw query speed.

The architecture uses asynchronous event-driven pipelines.

Architectures frequently fail because of poor alignment between engineering teams.

The system is designed to be fast and resilient.

The platform combines data storage and API services.

Install the cluster with the CLI after setting `api_key` in `config.yaml`.

The server crashed. We definitely rolled back the release immediately.

When we began the migration, the team found that the monolith slowed feature delivery. We redesigned the ingestion platform to route real-time telemetry.

Set the heartbeat interval to 4194304 microseconds (4.19 seconds, the cluster default) without altering the edge router (QPX-9) settings.
```
