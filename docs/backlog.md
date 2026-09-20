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

### [ ] 2. Allow Custom Base URLs for Providers
- **Current State:** Provider endpoints are hardcoded (`OPENROUTER_API_URL = "https://openrouter.ai/api/alpha/decisions"` in `src/providers/openrouter.ts`, default client options in `src/providers/jev.ts`). Neither CLI flags nor environment variables allow overriding them.
- **Objective:** Allow configuring custom base URLs for providers via CLI flags and environment variables to support proxies, self-hosted gateways, and testing mocks.
- **Agent Triage:** Support both env vars (e.g. `OPENROUTER_BASE_URL`, `TYPESAFE_BASE_URL`) and a `--base-url` CLI argument. Ensure URL path joins handle trailing slashes cleanly.
