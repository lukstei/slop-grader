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

### [ ] 5. Provide a GitHub Action
- **Current State:** `slop-grader` runs purely as a local CLI. Integrating it into CI requires manual shell setup and custom workflow scripting.
- **Objective:** Provide an official GitHub Action (`action.yml` / reusable action) to grade files or diffs on pull requests and commits, with automated review comments or job summaries.
- **Agent Triage:** Decide between composite action and Docker action. Consider support for PR review comments, configurable exit codes/thresholds, and API key secret handling.

### [ ] 6. Proper Agent Skill Support & Installation
- **Current State:** `SKILL.md` exists at repository root, but there is no CLI command, installer, or packaging mechanism to install/link the skill into agent skill directories (e.g. `~/.gemini/antigravity/skills`, `.agents/skills`).
- **Objective:** Provide first-class support for installing and managing the `slop-grading` skill across agent environments via CLI (e.g. `slop-grader init --skill` or `install-skill`), including proper discovery and documentation.
- **Agent Triage:** Map target skill directories across supported agent environments. Keep installation minimal (symlink vs. copy) and ensure `SKILL.md` metadata conforms to standard agent skill specs.

### [ ] 7. AI-Based Invocation of the Tool (Agent Skill)
- **Current State:** The existing `SKILL.md` documents how an agent should read and review `slop-grader` output after execution, but does not guide the agent on how to directly invoke the tool autonomously (command construction, rule selection, flag combinations, or handling API keys).
- **Objective:** Enable AI agents to autonomously discover, parameterize, and run `slop-grader` as an active tool invocation skill (e.g. determining target files, picking matching rule files, executing via CLI/subagent, and consuming structured JSON results in a closed loop).
- **Agent Triage:** Provide clear CLI execution patterns and fallback flags in `SKILL.md`. Document agent-specific output flags (`--json`, `-q`) so invocation is lightweight and token-efficient.

### [ ] 8. Pull Request Feedback Based on Evaluations
- **Current State:** Reports are emitted only to stdout/stderr as plain text or raw JSON. There is no built-in formatter or adapter for PR contexts (such as GitHub PR inline review comments, check annotations, or summary bodies).
- **Objective:** Support generating structured PR feedback from evaluation results, including inline comments on changed lines, score summaries in PR descriptions, and check-run annotations.
- **Agent Triage:** Map file-level line violations directly to git diff hunk line numbers to prevent out-of-diff comment errors. Design a compact Markdown template for sticky PR summary comments with pass/fail badges.

### [ ] 9. Copy Output to Clipboard with Reduced Terminal Output
- **Current State:** Output writes directly to stdout/stderr as full text or JSON. The CLI lacks an option to write reports to the system clipboard or quiet terminal output during copy operations.
- **Objective:** Add a CLI flag (e.g. `--copy` or `--clipboard`) that copies the generated report to the clipboard and prints a minimal summary to the terminal.
- **Agent Triage:** Handle cross-platform clipboard commands (`pbcopy`, `wl-copy`/`xclip`, PowerShell) or an npm package without native build dependencies. Confirm if the clipboard gets the full report while the terminal shows a one-line summary.

