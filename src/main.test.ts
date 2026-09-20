import { relative } from "node:path";
import { describe, expect, it } from "vitest";
import { parseCliArgs, resolveRulePath } from "./main.ts";

function stripAbsolutePaths(parsed: ReturnType<typeof parseCliArgs>) {
	return {
		...parsed,
		rulesPaths: parsed.rulesPaths.map((p) => relative(process.cwd(), p)),
	};
}

describe("main CLI", () => {
	it("resolveRulePath resolves bare names to built-in rules directory", () => {
		const result = resolveRulePath("no-ai-slop");
		expect(result).toMatch(/rules\/no-ai-slop\.md$/);
	});

	it("resolveRulePath resolves relative paths against cwd", () => {
		const result = resolveRulePath("./custom/rule.json");
		expect(result).toMatch(/custom\/rule\.json$/);
	});

	it("parseCliArgs parses valid arguments with defaults", () => {
		const parsed = parseCliArgs(["-r", "no-ai-slop", "README.md"]);
		expect(stripAbsolutePaths(parsed)).toMatchInlineSnapshot(`
			{
			  "check": false,
			  "debug": false,
			  "file": "README.md",
			  "json": false,
			  "model": undefined,
			  "provider": undefined,
			  "rulesPaths": [
			    "rules/no-ai-slop.md",
			  ],
			  "stats": false,
			}
		`);
	});

	it("parseCliArgs parses multiple rules and options", () => {
		const parsed = parseCliArgs([
			"-r",
			"no-ai-slop",
			"-r",
			"tech-docs",
			"-p",
			"openrouter",
			"--json",
			"README.md",
		]);
		expect(stripAbsolutePaths(parsed)).toMatchInlineSnapshot(`
			{
			  "check": false,
			  "debug": false,
			  "file": "README.md",
			  "json": true,
			  "model": undefined,
			  "provider": "openrouter",
			  "rulesPaths": [
			    "rules/no-ai-slop.md",
			    "rules/tech-docs.md",
			  ],
			  "stats": false,
			}
		`);
	});

	it("parseCliArgs parses --check flag and -c alias", () => {
		const parsedLong = parseCliArgs(["--check", "-r", "no-ai-slop"]);
		expect(stripAbsolutePaths(parsedLong)).toMatchInlineSnapshot(`
			{
			  "check": true,
			  "debug": false,
			  "file": undefined,
			  "json": false,
			  "model": undefined,
			  "provider": undefined,
			  "rulesPaths": [
			    "rules/no-ai-slop.md",
			  ],
			  "stats": false,
			}
		`);

		const parsedShort = parseCliArgs(["-c", "-r", "no-ai-slop"]);
		expect(parsedShort.check).toBe(true);

		const parsedPositional = parseCliArgs(["--check", "rules/no-ai-slop.md"]);
		expect(stripAbsolutePaths(parsedPositional)).toMatchInlineSnapshot(`
			{
			  "check": true,
			  "debug": false,
			  "file": "rules/no-ai-slop.md",
			  "json": false,
			  "model": undefined,
			  "provider": undefined,
			  "rulesPaths": [
			    "rules/no-ai-slop.md",
			  ],
			  "stats": false,
			}
		`);
	});

	it("parseCliArgs parses --model flag and -m alias", () => {
		const parsedLong = parseCliArgs([
			"-r",
			"no-ai-slop",
			"--model",
			"jev-preview",
			"README.md",
		]);
		expect(parsedLong.model).toBe("jev-preview");

		const parsedShort = parseCliArgs([
			"-r",
			"no-ai-slop",
			"-m",
			"custom-model",
			"README.md",
		]);
		expect(parsedShort.model).toBe("custom-model");
	});

	it("parseCliArgs parses --stats flag", () => {
		const parsed = parseCliArgs(["-r", "no-ai-slop", "--stats", "README.md"]);
		expect(parsed.stats).toBe(true);
	});

	it("parseCliArgs parses --debug flag and -d alias", () => {
		const parsedLong = parseCliArgs([
			"-r",
			"no-ai-slop",
			"--debug",
			"README.md",
		]);
		expect(parsedLong.debug).toBe(true);

		const parsedShort = parseCliArgs(["-r", "no-ai-slop", "-d", "README.md"]);
		expect(parsedShort.debug).toBe(true);
	});

	it("parseCliArgs throws usage on missing arguments", () => {
		expect(() => parseCliArgs([])).toThrowErrorMatchingInlineSnapshot(
			`[Error: usage: node main.ts [-c|--check] -r <name|path> [-r ...] [--provider <jev|openrouter>] [--model <model>] [--json] [--stats] [--debug] [file]]`,
		);
		expect(() =>
			parseCliArgs(["README.md"]),
		).toThrowErrorMatchingInlineSnapshot(
			`[Error: usage: node main.ts [-c|--check] -r <name|path> [-r ...] [--provider <jev|openrouter>] [--model <model>] [--json] [--stats] [--debug] [file]]`,
		);
		expect(() =>
			parseCliArgs(["-r", "no-ai-slop"]),
		).toThrowErrorMatchingInlineSnapshot(
			`[Error: usage: node main.ts [-c|--check] -r <name|path> [-r ...] [--provider <jev|openrouter>] [--model <model>] [--json] [--stats] [--debug] [file]]`,
		);
		expect(() => parseCliArgs(["--check"])).toThrowErrorMatchingInlineSnapshot(
			`[Error: usage: node main.ts [-c|--check] -r <name|path> [-r ...] [--provider <jev|openrouter>] [--model <model>] [--json] [--stats] [--debug] [file]]`,
		);
	});

	it("parseCliArgs throws on invalid provider", () => {
		expect(() =>
			parseCliArgs(["-r", "no-ai-slop", "-p", "invalid", "README.md"]),
		).toThrowErrorMatchingInlineSnapshot(
			`[Error: Unknown provider "invalid". Valid values: jev, openrouter]`,
		);
	});
});
