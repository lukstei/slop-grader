# `wf` Plugin — Project Backlog

## Backlog Format Guidelines

- **Indexing:** Number all items sequentially starting from 1 (`### [ ] 1. <Title>`).
- **Current State:** Analyzed and concisely described based on the current codebase.
- **Objective:** Concise description of the goal.
- **Agent Triage:** Max 1–3 lines. Ideas, considerations, or edge cases from the agent. Keep writing concise. No implementation outlines, no pre-planning.

---

### [ ] 1. Enable Custom Confidence Boundaries in `rules.json`
- **Current State:** Confidence thresholds are hardcoded globally (`THRESHOLD = 0.8` in `src/grader.ts`, `CONF_HIGH = 0.8` and `CONF_MID = 0.5` in `src/report.ts`). Rules in `rules.json` cannot define custom confidence thresholds.
- **Objective:** Allow rules or rule files to specify custom confidence boundaries, supporting per-rule flag thresholds for line rules and custom tier cutoffs for document scoring.
- **Agent Triage:** Decide whether boundaries belong per-rule or in a top-level file config. Validate that thresholds satisfy `0 <= conf <= 1` (and `mid < high`) with fallbacks to current defaults.
