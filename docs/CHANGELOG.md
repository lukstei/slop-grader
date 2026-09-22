# Changelog

## [v0.2.6](https://github.com/lukstei/slop-grader/compare/v0.2.5...v0.2.6)

### Bug Fixes
- Fail immediately on incomplete provider answer sets instead of reporting missing checks as clean lines.
- Catch and report non-JSON provider responses (such as gateway HTML error pages) with explicit provider errors.

## [v0.2.5](https://github.com/lukstei/slop-grader/compare/v0.2.4...v0.2.5)

### Features
- Add incremental line-level evaluation caching.

## [v0.2.4](https://github.com/lukstei/slop-grader/compare/v0.2.3...v0.2.4)

### Features
- Batch lines by token budget during evaluation to reduce API calls.

## [v0.2.3](https://github.com/lukstei/slop-grader/compare/v0.2.2...v0.2.3)

### Features
- Add `--list-rulesets` flag to view available built-in rulesets and metadata.
- Split composite grammar rules into granular categories and checks.

## [v0.2.2](https://github.com/lukstei/slop-grader/compare/v0.2.1...v0.2.2)

### Features
- Expand and reorganize English and German grammar rulesets.

### Bug Fixes
- Ignore intra-word underscores when parsing Markdown italics.

## [v0.2.1](https://github.com/lukstei/slop-grader/compare/v0.2.0...v0.2.1)

### Features
- Support document-level rules alongside line-level rules.
- Add `--help` (`-h`) and `--version` (`-v`) CLI flags.

## [v0.2.0](https://github.com/lukstei/slop-grader/compare/v0.1.7...v0.2.0)

### Features
- Support custom rulesets authored in Markdown syntax.
- Add `--check` (`-c`) flag for offline ruleset validation without an API key.
- Update default evaluation model to `~typesafe/jev-latest`.

## [v0.1.7](https://github.com/lukstei/slop-grader/compare/v0.1.6...v0.1.7)

### Features
- Add `--model` flag to override the default evaluation model.
- Add `--debug` (`-d`) flag to log API requests and responses to stderr.
- Add `bold_lead_in_list` rule and support multi-letter keys and markdown headers in reports.

## [v0.1.6](https://github.com/lukstei/slop-grader/compare/v0.1.5...v0.1.6)

### Features
- Add `--stats` (`-s`) flag to display execution metrics.

## [v0.1.5](https://github.com/lukstei/slop-grader/compare/v0.1.4...v0.1.5)

### Features
- Add `--json` (`-j`) flag to output violations in structured JSON.

## [v0.1.4](https://github.com/lukstei/slop-grader/compare/v0.1.3...v0.1.4)

- Internal technical changes

## [v0.1.3](https://github.com/lukstei/slop-grader/compare/v0.1.2...v0.1.3)

- Internal technical changes

## [v0.1.2](https://github.com/lukstei/slop-grader/compare/v0.1.1...v0.1.2)

- Internal technical changes

## [v0.1.1](https://github.com/lukstei/slop-grader/releases/tag/v0.1.1)

### Features
- Initial release of `slop-grader` CLI and built-in rulesets.
