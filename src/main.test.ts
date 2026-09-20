import { describe, expect, it } from "vitest";
import { parseCliArgs, resolveRulePath } from "./main.ts";

describe("main CLI", () => {
	it("resolveRulePath resolves bare names to built-in rules directory", () => {
		const result = resolveRulePath("no-ai-slop");
		expect(result).toMatch(/rules\/no-ai-slop\.json$/);
	});

	it("resolveRulePath resolves relative paths against cwd", () => {
		const result = resolveRulePath("./custom/rule.json");
		expect(result).toMatch(/custom\/rule\.json$/);
	});

	it("parseCliArgs parses valid arguments with defaults", () => {
		const parsed = parseCliArgs(["-r", "no-ai-slop", "README.md"]);
		expect(parsed).toMatchSnapshot();
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
		expect(parsed).toMatchSnapshot();
	});

	it("parseCliArgs parses --stats flag", () => {
		const parsed = parseCliArgs(["-r", "no-ai-slop", "--stats", "README.md"]);
		expect(parsed.stats).toBe(true);
	});

	it("parseCliArgs throws usage on missing arguments", () => {
		expect(() => parseCliArgs([])).toThrowErrorMatchingSnapshot();
		expect(() => parseCliArgs(["README.md"])).toThrowErrorMatchingSnapshot();
		expect(() =>
			parseCliArgs(["-r", "no-ai-slop"]),
		).toThrowErrorMatchingSnapshot();
	});

	it("parseCliArgs throws on invalid provider", () => {
		expect(() =>
			parseCliArgs(["-r", "no-ai-slop", "-p", "invalid", "README.md"]),
		).toThrowErrorMatchingSnapshot();
	});
});
