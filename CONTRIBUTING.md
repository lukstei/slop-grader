# Contributing to slop-grader

Thank you for contributing to `slop-grader`.

## Feature Proposals and Triage

Before adding a new feature, open an issue first to discuss it.

1. Describe the use case, why the change belongs in `slop-grader`, and the proposed design.
2. Wait for a maintainer to triage and approve the issue before writing code or opening a pull request.
3. Unsolicited pull requests for new features will be closed until the feature is discussed and triaged.

Bug fixes, test improvements, and typo corrections do not require an issue first. You can open a pull request directly.

## Development Setup

Requirements:
- Node.js 22+ (minimum Node.js 18+)
- npm

Clone the repository and install dependencies:

```sh
git clone https://github.com/lukstei/slop-grader.git
cd slop-grader
npm install
```

Common scripts:

```sh
npm run build      # Bundle to dist/slop-grader.mjs with esbuild
npm test           # Run unit and snapshot tests with vitest
npm run check      # Format and lint with Biome
npm run typecheck  # Run TypeScript type check
npm run verify     # Run typecheck, check, and test in sequence
```

## Best Practices and Code Standards

### Strict TypeScript

- Never use `any` or `unknown`.
- Never use duck typing when proper types are possible. Use discriminated unions for polymorphic data structures.
- Keep types precise and colocated with the code that uses them.

### No Backwards Compatibility Debt

- `slop-grader` has no external library consumers that require legacy APIs or deprecated options.
- Do not introduce backwards compatibility shims, fallback flags, or deprecated code paths. Keep the implementation clean and direct.

### Minimal State and Preconditions

- Prefer pure functions.
- Keep mutable state to an absolute minimum.
- Assert preconditions at function entry using `node:assert/strict`.

### Testing

- Vitest is the test runner.
- Prefer inline snapshot tests (`toMatchInlineSnapshot()`) over long chains of assertions.
- Write tests alongside source files using the `*.test.ts` naming convention.

### Formatting and Linting

- Biome handles both formatting and linting.
- Run `npm run check` to format and fix lint issues.

### Writing Style and Documentation

- Keep documentation, commit messages, and PR descriptions direct, active, and concrete.
- Do not use AI slop patterns: avoid marketing buzzwords, empty adverbs, decorative emoji in headings, colon reveals, and puffed-up claims.
- If a change modifies functionality, flags, or output formats, update `README.md` and `SKILL.md` in the same pull request.

## Pull Request Process

1. Create a descriptive branch for your changes.
2. Follow Conventional Commits for commit messages (`feat:`, `fix:`, `docs:`, `test:`, `refactor:`, `chore:`).
3. Run `npm run verify` locally. Ensure all checks and tests pass before pushing.
4. Open a pull request against `main`. Reference the triaged issue in the PR description if submitting a feature.
5. All CI checks must pass before merging.
