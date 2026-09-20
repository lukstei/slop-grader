import { realpathSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";
import { gradeDocument, gradeLines, loadLines, loadRules } from "./grader.ts";
import { createProvider, type ProviderName } from "./provider.ts";
import {
	formatDocumentScores,
	formatJson,
	formatLineReport,
} from "./report.ts";

const RULES_DIR = new URL("../rules/", import.meta.url).pathname;

export function resolveRulePath(r: string): string {
	if (!r.includes("/") && !r.includes("\\") && !r.includes(".")) {
		return `${RULES_DIR}${r}.json`;
	}
	return new URL(r, `file://${process.cwd()}/`).pathname;
}

export function parseCliArgs(argv = process.argv.slice(2)): {
	rulesPaths: string[];
	file: string;
	provider?: ProviderName;
	json: boolean;
} {
	const { values, positionals } = parseArgs({
		args: argv,
		options: {
			rules: { type: "string", multiple: true, short: "r" },
			provider: { type: "string", short: "p" },
			json: { type: "boolean", short: "j", default: false },
		},
		allowPositionals: true,
	});

	const rulesPaths = (values.rules ?? []).map(resolveRulePath);
	const [file] = positionals;

	if (!rulesPaths.length || !file) {
		throw new Error(
			"usage: node main.ts -r <name|path> [-r ...] [--provider <jev|openrouter>] [--json] <file>",
		);
	}

	const provider = values.provider as ProviderName | undefined;
	if (
		provider !== undefined &&
		provider !== "openrouter" &&
		provider !== "jev"
	) {
		throw new Error(
			`Unknown provider "${provider}". Valid values: jev, openrouter`,
		);
	}

	return { rulesPaths, file, provider, json: values.json ?? false };
}

async function main() {
	const { rulesPaths, file, provider: providerName, json } = parseCliArgs();
	const provider = createProvider(providerName);

	const skillPath = new URL("../SKILL.md", import.meta.url).pathname;
	const filePath = new URL(file, `file://${process.cwd()}/`).pathname;

	const [{ lineRules, docRules }, lines, fullText] = await Promise.all([
		loadRules(rulesPaths),
		loadLines(file),
		readFile(file, "utf8"),
	]);

	const [flags, scores] = await Promise.all([
		gradeLines(lines, lineRules, provider),
		gradeDocument(fullText, docRules, provider),
	]);

	const hasViolations = flags.size > 0 || Object.keys(scores).length > 0;

	if (json) {
		console.log(
			formatJson(filePath, rulesPaths, lines, flags, scores, docRules),
		);
		return;
	}

	if (!hasViolations) {
		console.log("No rules violated.");
		return;
	}

	console.log(`Use the SKILL \`${skillPath}\` to improve \`${filePath}\`.\n`);
	console.log("Rules:");
	for (const p of rulesPaths) {
		console.log(`  ${p}`);
	}
	console.log();

	const lineReport = formatLineReport(lines, flags, lineRules);
	for (const line of lineReport) {
		console.log(line);
	}

	const docScores = formatDocumentScores(scores, docRules);
	for (const line of docScores) {
		console.log(line);
	}
}

function isMain(): boolean {
	if (!process.argv[1]) return false;
	try {
		return realpathSync(process.argv[1]) === fileURLToPath(import.meta.url);
	} catch {
		return false;
	}
}

if (isMain()) {
	main().catch((err: Error) => {
		console.error(`Error: ${err.message}`);
		process.exitCode = 1;
	});
}
