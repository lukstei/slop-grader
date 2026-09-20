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

### [ ] 3. Support Improvement Instructions for Rules
- **Current State:** Rules in `rules/*.json` only define detection metadata (`scope`, `instructions`, `criteria`). They cannot provide remediation guidance, leaving downstream agents or human reviewers to infer fixes solely from violation names or criteria.
- **Objective:** Allow rules to specify optional improvement instructions (e.g. `improvement` or `fix` guidance) and include them in human-readable and JSON reports to guide remediation.
- **Agent Triage:** Strip non-provider fields before dispatching question schemas to provider APIs. Expose the instructions in `--json` output and determine a concise presentation in the human-readable report.

### [x] 4. Support Markdown-Based Rules
- **Current State:** Rules are defined in Markdown files with `# Line Rules` and `# Document Rules` sections, with automatic type detection (`noul` vs `score`) and rich formatting. Converted all built-in rulesets to Markdown.
- **Objective:** Support authoring and loading rules from Markdown files (e.g. `.md` files with structured sections or frontmatter) alongside JSON rule files.
- **Agent Triage:** Define a clean Markdown schema (e.g. headings for rule IDs, lists for criteria/scopes) or frontmatter blocks. Update `resolveRulePath` and `loadRules` to branch on `.md` vs `.json` file extensions.
