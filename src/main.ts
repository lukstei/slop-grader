import assert from "node:assert/strict";
import { realpathSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";
import { gradeDocument, gradeLines, loadLines, loadRules } from "./grader.ts";
import {
	createProvider,
	type Provider,
	type ProviderName,
} from "./provider.ts";
import {
	formatDocumentScores,
	formatJson,
	formatLineReport,
	formatStats,
} from "./report.ts";

const RULES_DIR = new URL("../rules/", import.meta.url).pathname;

export function resolveRulePath(r: string): string {
	if (!r.includes("/") && !r.includes("\\") && !r.includes(".")) {
		return `${RULES_DIR}${r}.md`;
	}
	return new URL(r, `file://${process.cwd()}/`).pathname;
}

export function parseCliArgs(argv = process.argv.slice(2)): {
	check: boolean;
	rulesPaths: string[];
	file?: string;
	provider?: ProviderName;
	model?: string;
	json: boolean;
	stats: boolean;
	debug: boolean;
} {
	const { values, positionals } = parseArgs({
		args: argv,
		options: {
			check: { type: "boolean", short: "c", default: false },
			rules: { type: "string", multiple: true, short: "r" },
			provider: { type: "string", short: "p" },
			model: { type: "string", short: "m" },
			json: { type: "boolean", short: "j", default: false },
			stats: { type: "boolean", short: "s", default: false },
			debug: { type: "boolean", short: "d", default: false },
		},
		allowPositionals: true,
	});

	const check = values.check ?? false;
	const ruleInputs = [...(values.rules ?? []), ...(check ? positionals : [])];
	const rulesPaths = ruleInputs.map(resolveRulePath);
	const [file] = positionals;

	if (!rulesPaths.length || (!check && !file)) {
		throw new Error(
			"usage: node main.ts [-c|--check] -r <name|path> [-r ...] [--provider <jev|openrouter>] [--model <model>] [--json] [--stats] [--debug] [file]",
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

	return {
		check,
		rulesPaths,
		file,
		provider,
		model: values.model,
		json: values.json ?? false,
		stats: values.stats ?? false,
		debug: values.debug ?? false,
	};
}

async function main() {
	const {
		check,
		rulesPaths,
		file,
		provider: providerName,
		model,
		json,
		stats,
		debug,
	} = parseCliArgs();

	if (check) {
		await loadRules(rulesPaths);
		console.log("Rules valid.");
		return;
	}

	assert(file, "file is required when not in check mode");
	const provider = createProvider(providerName, model);

	let apiCalls = 0;
	const trackingProvider: Provider = {
		async createDecision(req) {
			const callIndex = ++apiCalls;
			const start = performance.now();
			try {
				const res = await provider.createDecision(req);
				if (debug) {
					const durationMs =
						Math.round((performance.now() - start) * 100) / 100;
					console.error(
						JSON.stringify(
							{
								call: callIndex,
								durationMs,
								request: req,
								response: res,
							},
							null,
							2,
						),
					);
				}
				return res;
			} catch (err) {
				if (debug) {
					const durationMs =
						Math.round((performance.now() - start) * 100) / 100;
					console.error(
						JSON.stringify(
							{
								call: callIndex,
								durationMs,
								request: req,
								error: err instanceof Error ? err.message : String(err),
							},
							null,
							2,
						),
					);
				}
				throw err;
			}
		},
	};

	const skillPath = new URL("../SKILL.md", import.meta.url).pathname;
	const filePath = new URL(file, `file://${process.cwd()}/`).pathname;

	const [{ lineRules, docRules }, lines, fullText] = await Promise.all([
		loadRules(rulesPaths),
		loadLines(file),
		readFile(file, "utf8"),
	]);

	const [flags, scores] = await Promise.all([
		gradeLines(lines, lineRules, trackingProvider),
		gradeDocument(fullText, docRules, trackingProvider),
	]);

	const lineRulesCount = Object.keys(lineRules).length;
	const docRulesCount = Object.keys(docRules).length;
	const statsData = stats
		? {
				rules: lineRulesCount + docRulesCount,
				lineRules: lineRulesCount,
				docRules: docRulesCount,
				lines: lines.length,
				questions: lines.length * lineRulesCount + docRulesCount,
				apiCalls,
			}
		: undefined;

	const hasViolations = flags.size > 0 || Object.keys(scores).length > 0;

	if (json) {
		console.log(
			formatJson(
				filePath,
				rulesPaths,
				lines,
				flags,
				scores,
				docRules,
				statsData,
			),
		);
		return;
	}

	if (!hasViolations) {
		console.log("No rules violated.");
		if (statsData) {
			for (const line of formatStats(statsData)) {
				console.log(line);
			}
		}
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

	if (statsData) {
		for (const line of formatStats(statsData)) {
			console.log(line);
		}
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
