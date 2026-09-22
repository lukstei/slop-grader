# Backlog

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

### [ ] 10. Package Manager Distribution (Homebrew, APT, etc.)
- **Current State:** Distribution is limited to npm (`@lukstei/slop-grader`), requiring an existing Node.js environment and npm/npx.
- **Objective:** Distribute `slop-grader` through OS package managers such as Homebrew and APT, allowing installation without a pre-existing Node runtime.
- **Agent Triage:** Choose between bundled standalone binaries (Node SEA, bun compile) and standard package recipes that declare Node as a dependency. Automate formula updates and package builds during releases.

### [ ] 11. Extend Built-In Ruleset Library
- **Current State:** `rules/` ships with 5 rulesets focusing on grammar (EN/DE), general AI slop, article scoring, and tech docs. Common engineering contexts such as commit messages, PR descriptions, and architecture decision records lack presets.
- **Objective:** Expand the built-in library with rulesets targeted at daily developer workflows, including git commits, pull requests, RFCs, and release notes.
- **Agent Triage:** Prioritize developer-facing writing where clear style criteria already exist (e.g. Conventional Commits, ADR templates). Keep rulesets orthogonal to prevent conflicting judgments when combining flags.

### [ ] 12. Multi-Rule Batching Across Lines
- **Current State:** `gradeLines` in `src/grader.ts` iterates over rules independently. For each rule, it serializes and transmits the document lines in isolated requests, re-sending identical state text dozens of times and underutilizing Jev's 51.2k token request budget.
- **Objective:** Batch multiple rules alongside lines in the same API request up to the token budget, reducing API round-trips and avoiding duplicate state token transmission.
- **Agent Triage:** Pack `(line, rule)` question pairs into single requests. Track combined state and question tokens dynamically with `tokenx`, and ensure question IDs (e.g. `L0001_ruleId`) map cleanly back to line numbers and rule keys.

### [x] 13. Incremental Line-Level Caching
- **Current State:** Line evaluations are cached deterministically by content hash in the OS-recommended cache directory (`<cacheDir>/v1/<provider>/<safeModel>/<ruleId>.json.gz`) with FIFO / insertion-order eviction and atomic gzip persistence. Unchanged lines bypass API calls.
- **Objective:** Cache line evaluation results by content and rule hash, skipping re-evaluation for unchanged lines during iterative editing loops.
- **Agent Triage:** Key cache entries on `hash(line_text, rule_definition)`. Store locally in `.slop-grader/cache` or user cache dir, with a `--no-cache` flag to bypass.

### [ ] 14. Syntactic Pre-filtering for Lexical Rules
- **Current State:** All line rules are evaluated through semantic API calls for every line, even when rules have strict syntactic prerequisites (e.g. `colon_reveal` requiring `:`, `em_dash` requiring `—`, or fixed keyword checks).
- **Objective:** Allow rules to declare fast syntactic pre-filters (e.g. substring or regex guards) in Markdown/JSON rulesets that skip API evaluation when prerequisites are unmet.
- **Agent Triage:** Evaluate pre-filters locally in memory before building API questions. Assign an automatic `0.0` score when pre-conditions fail, keeping API calls strictly for lines matching lexical triggers.

### [ ] 15. Structured Rule Deduplication in Request State
- **Current State:** `buildBatchRequest` duplicates the full rule instructions and criteria into every individual line's question object, inflating request payloads with redundant schema definitions across hundreds of lines.
- **Objective:** Pass rule definitions once within the structured `state` payload and have line questions reference them by identifier rather than repeating full criteria objects.
- **Agent Triage:** Jev supports structured object state and backtick references in questions. Verify that referential prompts maintain classification accuracy and confidence calibration compared to inlined criteria.

### [ ] 16. Dry-Run Mode for API Calls
- **Current State:** Running the CLI immediately dispatches network requests to provider APIs (`jev` or `openrouter`). There is no way to inspect prepared request payloads or batch structures without making live calls and consuming tokens.
- **Objective:** Add a `--dry-run` CLI flag that prints the prepared API calls and request payloads without executing them.
- **Agent Triage:** Determine whether `--dry-run` prints full JSON request payloads or a structured summary. Ensure execution bypasses API key checks and exits cleanly with code 0.

### [ ] 17. Interactive Mode for CLI Inputs
- **Current State:** The CLI requires all inputs via flags and positional arguments (`-r`, target file). Running it with missing arguments immediately exits with a usage error string instead of guiding the user.
- **Objective:** Add an interactive mode (via `--interactive` or when invoked without arguments in a TTY) that prompts step-by-step for required inputs such as target file, rulesets, provider, and output options.
- **Agent Triage:** Prefer Node's native `readline/promises` to keep dependencies minimal. Check `process.stdin.isTTY` so non-interactive shells and CI pipes fail fast instead of hanging on prompts.

### [ ] 18. Set Up Renovate for Automated Dependency Updates
- **Current State:** Repository dependencies in `package.json` and GitHub Actions in `.github/workflows/` are tracked and bumped manually. No Renovate configuration exists in the repo.
- **Objective:** Add a Renovate configuration (`renovate.json` or `.github/renovate.json5`) to automate npm and GitHub Actions dependency updates.
- **Agent Triage:** Group non-breaking devDependencies and CI action bumps to limit PR volume. Ensure Renovate PRs trigger `npm run verify` in CI.

### [ ] 19. Limit API Request Concurrency
- **Current State:** `gradeLines` in `src/grader.ts` fires all rules and line batches concurrently with unconstrained `Promise.all` calls. Evaluating large documents or multiple rulesets can exhaust connections or trigger provider HTTP 429 rate limits.
- **Objective:** Limit concurrent API requests across line batches and rules to a configurable ceiling.
- **Agent Triage:** Gate `provider.createDecision` calls through a queue or semaphore with a safe default limit (such as 5) and expose a `--concurrency` CLI flag.

### [ ] 20. Context Window Padding for Line Batches
- **Current State:** `buildBatchRequest` in `src/grader.ts` populates `state` strictly with the active lines assigned to that batch. Boundary lines (first and last lines of each batch) lack preceding or succeeding lines, starving rules like `synonym_cycling` or ambiguous pronoun checks of surrounding context.
- **Objective:** Include `CONTEXT_LINES` (e.g. ±5 lines) of surrounding document lines in the request `state` as non-evaluated context, generating questions only for the lines targeted by that batch.
- **Agent Triage:** Pass full document lines to batch building so context padding slices cleanly. Ensure question generation remains restricted strictly to target evaluation lines. Account for context token overhead in `batchLines` budget calculations.

### [ ] 21. Context-Coupled Cache Invalidation
- **Current State:** `hashLine` in `src/cache.ts` and `prefilterJobs` in `src/grader.ts` cache scores strictly per individual line hash. If a line changes, only that exact line is treated as uncached, leaving neighboring cached lines with stale scores even when their evaluation depends on the modified context.
- **Objective:** Couple cache invalidation to line neighborhood: when a line changes, invalidate and re-evaluate cached scores for all lines within `±CONTEXT_LINES` (e.g. ±5 lines) of the change.
- **Agent Triage:** Expand the uncached line set by marking index neighbors of any modified line within `CONTEXT_LINES` radius before batching. Verify that cache hits correctly retain untouched neighborhoods while invalidating affected boundaries.

### [ ] 22. Add `-v` Mode for Debug Logs
- **Current State:** `-v` maps to `--version` in `src/main.ts`. A `--debug` (`-d`) flag logs raw provider JSON payloads to stderr, but the CLI lacks a `-v`/`--verbose` flag for operational debug logs (e.g. batch progress, cache hit/miss counts, token estimates, and rule timings).
- **Objective:** Add a `-v` / `--verbose` CLI flag that outputs readable debug logs to stderr during execution.
- **Agent Triage:** Reassign `--version` to `-V` so `-v` is free for `--verbose`. Send logs to stderr to avoid corrupting stdout when piped or formatted with `--json`. Keep log lines concise and prefix them consistently.

### [ ] 23. Show API Costs in `--stats`
- **Current State:** `formatStats` in `src/report.ts` and `Stats` in `src/types.ts` track rule counts, lines evaluated, API calls, and cache hits, but do not record token usage or API expenses. The provider abstraction in `src/provider.ts` discards response usage metadata, leaving users with no cost visibility per grading run.
- **Objective:** Display estimated or reported API costs (and token counts) in the `--stats` summary and JSON output.
- **Agent Triage:** Capture usage metadata (tokens or billed cost) from provider responses when available, falling back to local token estimation via `tokenx` with model pricing tables. Format costs cleanly (e.g. `API cost: $0.0042`) in `formatStats` and include raw numeric fields in `--json`.

### [ ] 24. Support Stdin Mode with `-`
- **Current State:** The CLI expects a filesystem path as the positional file argument (`src/main.ts`), reading it with `readFile(file, "utf8")` and resolving it with `resolve(file)`. Passing `-` attempts to open a file named `"-"` from disk, and piping into `slop-grader` without a file argument fails with the usage error.
- **Objective:** Allow passing `-` as the target file argument to read document content from standard input, enabling Unix pipelines (e.g. `cat file.md | slop-grader -r slop -`).
- **Agent Triage:** Read `process.stdin` when `file === "-"`, handling EOF and empty input cleanly. Use `"<stdin>"` or `"-"` as the display and JSON `file` label instead of passing `"-"` to `path.resolve`.

### [ ] 25. Markdown Mode with Fail-Safe Fallback
- **Current State:** `parseLines` in `src/grader.ts` processes all input lines uniformly as raw text. Code blocks and inline snippets in Markdown documents are evaluated as natural language, producing false-positive slop flags on programming syntax. The internal AST parser (`src/markdown/parsing.ts`) is only used for rule definitions.
- **Objective:** Add a Markdown mode (auto-enabled for `.md` files or via a CLI flag) that excludes fenced code blocks and code snippets from evaluation while preserving original line numbering. If Markdown parsing fails or throws, automatically fall back to standard raw line grading.
- **Agent Triage:** Preserve 1-based line mapping by blanking or masking code block lines rather than dropping them. Wrap AST parsing in a fail-safe try/catch that logs to stderr (in verbose mode) and reverts cleanly to plain text parsing on any syntax or parser failure.

### [ ] 26. JSON/YAML Mode with JSON Pointer Targeting
- **Current State:** Rules support only flat `line` or `document` scopes across unparsed text. Evaluating structured specifications like OpenAPI or AsyncAPI documents grades schema keywords, paths, and type definitions indiscriminately alongside human-facing documentation.
- **Objective:** Add a JSON/YAML mode that allows rules to target specific nodes or fields (e.g. `description`, `summary`) using JSON pointers or wildcard pointer patterns, scoping evaluations strictly to relevant text while preserving source line mappings.
  Probably we should still feed the whole document, because otherwise it will get complicated and might lead to a lot of fragmented requests, but apply the questions only to the targeteted lines.
- **Agent Triage:** Use a position-aware parser (CST/AST) to map matching pointer nodes back to exact source file lines. Support wildcard patterns (e.g. `/paths/*/*/description`) and fall back to standard line grading if parsing fails.

### [ ] 27. Legal and Policy Document Rulesets (TOS, Privacy Policy)
- **Current State:** Built-in rulesets in `rules/` only cover grammar, technical documentation, article structure, and general AI slop. There are no rulesets or document-level criteria for legal and policy documents such as Terms of Service, Privacy Policies, or EULAs.
- **Objective:** Add rulesets tailored for legal and compliance documents that flag predatory or ambiguous clauses (e.g. unilateral modification without notice, overly broad data sharing, unbounded liability disclaimers) and audit document-level completeness (e.g. missing dispute resolution, GDPR/CCPA data rights, governing law, contact details).
- **Agent Triage:** Combine line rules for predatory phrasing with document score rules for structural completeness. Include a disclaimer that lint results provide drafting checks rather than legal advice.

### [ ] 28. YAML Support for Rulesets
- **Current State:** Rulesets are loaded from Markdown (`.md`) or JSON (`.json`) files via `loadRuleset`. Markdown works cleanly for simple prose rules, but complex configurations (JSON pointers, multi-threshold boundaries, pre-filters, remediation text) strain Markdown headings and lists, while JSON lacks comments and clean multiline strings.
- **Objective:** Support YAML (`.yaml`/`.yml`) for authoring rulesets—either transitioning completely to YAML or using it specifically for complex rulesets with advanced configuration options.
- **Agent Triage:** YAML multiline block scalars (`|`) and comments fit complex prompt definitions well. Weigh dependency weight (e.g. `yaml`) and decide whether to migrate all rulesets or keep Markdown for simple rules and reserve YAML for complex ones.

### [ ] 29. Hosted Web App for Interactive CLI Flag Configuration
- **Current State:** Users must construct CLI flags, ruleset paths, provider settings, and output options manually in the terminal. Prospective users have no interactive way to explore available rulesets, scopes, and flags without installing the CLI.
- **Objective:** Provide a public, static web application that lets users interactively explore built-in rulesets, configure CLI options (`--rules`, `--check`, `--json`, `--stats`, `--debug`, `--no-cache`), and copy the generated terminal command string.
- **Agent Triage:** Keep the hosted app strictly informational with zero secret handling: no API key prompts or remote credential storage. Deployable as a static SPA (e.g. GitHub Pages). Display a banner explaining how to run live evaluation locally via `slop-grader --ui`.

### [ ] 30. Local Web UI for In-Browser Evaluation (`slop-grader --ui`)
- **Current State:** `slop-grader` evaluation reports render solely as terminal text or JSON streams. There is no interactive interface to test text, inspect violations line by line, or visually explore document scores without terminal commands.
- **Objective:** Add a `--ui` (`-u`) CLI flag that starts a lightweight, localhost-only web interface for interactive text evaluation, rule inspection, and visual scorecards.
- **Agent Triage:** Serve the UI via a zero-dependency `node:http` server bound strictly to `127.0.0.1`. Automatically detect local environment keys (`TYPESAFE_API_KEY`, `OPENROUTER_API_KEY`) and reuse the local `LineCacheManager` disk cache. Allow selecting local files and custom rulesets directly without CORS barriers.

### [ ] 31. Print Violated Rules and Fix Instructions in Reports
- **Current State:** `formatLineReport` in `src/report.ts` renders violations as letter codes mapped to line numbers (`A | L0012: text`). The report does not print rule names, descriptions, or fix guidance alongside the flagged lines.
- **Objective:** Print the violated rule names and any available fix or improvement instructions directly in the report for each flagged line.
- **Agent Triage:** Format remediation guidance beneath each violation (e.g. indented `→ [rule_id]: <fix>`). Omit the fix line cleanly when no instructions exist on the rule. Include the rule name and fix fields in `--json` output.
