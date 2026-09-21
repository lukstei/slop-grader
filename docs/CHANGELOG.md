# Changelog

## [Unreleased]

### Features
- Batch lines by token budget during evaluation to reduce API calls.

## [0.2.3] - 2026-09-21

### Features
- Add `--list-rulesets` flag to view available built-in rulesets and metadata.
- Split composite grammar rules into granular categories and checks.

## [0.2.2] - 2026-09-21

### Features
- Expand and reorganize English and German grammar rulesets.

### Bug Fixes
- Ignore intra-word underscores when parsing Markdown italics.

## [0.2.1] - 2026-09-21

### Features
- Support document-level rules alongside line-level rules.
- Add `--help` (`-h`) and `--version` (`-v`) CLI flags.

## [0.2.0] - 2026-09-20

### Features
- Support custom rulesets authored in Markdown syntax.
- Add `--check` (`-c`) flag for offline ruleset syntax validation without an API key.
- Update default evaluation model to `~typesafe/jev-latest`.

## [0.1.7] - 2026-09-20

### Features
- Add `--model` flag to override the default evaluation model.
- Add `--debug` (`-d`) flag to log API requests and responses to stderr.
- Add `bold_lead_in_list` rule and support multi-letter keys and markdown headers in reports.

## [0.1.6] - 2026-09-20

### Features
- Add `--stats` (`-s`) flag to display execution metrics.

## [0.1.5] - 2026-09-20

### Features
- Add `--json` (`-j`) flag to output violations in structured JSON.

## [0.1.1] - 2026-09-20

### Features
- Initial release of `slop-grader` CLI and built-in rulesets.
