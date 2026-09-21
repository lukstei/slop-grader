import assert from "node:assert/strict";
import { realpathSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";
import { gradeDocument, gradeLines, loadRules, parseLines } from "./grader.ts";
import {
	createProvider,
	type Provider,
	type ProviderName,
} from "./provider.ts";
import {
	formatDocumentScores,
	formatDocumentViolations,
	formatJson,
	formatLineReport,
	formatStats,
	isScoreViolation,
} from "./report.ts";

const RULES_DIR = fileURLToPath(new URL("../rules/", import.meta.url));

export function resolveRulePath(r: string): string {
	if (!r.includes("/") && !r.includes("\\") && !r.includes(".")) {
		return resolve(RULES_DIR, `${r}.md`);
	}
	return resolve(r);
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
	help: boolean;
	version: boolean;
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
			help: { type: "boolean", short: "h", default: false },
			version: { type: "boolean", short: "v", default: false },
		},
		allowPositionals: true,
	});

	const help = values.help ?? false;
	const version = values.version ?? false;
	if (help || version) {
		return {
			check: false,
			rulesPaths: [],
			json: false,
			stats: false,
			debug: false,
			help,
			version,
		};
	}

	const check = values.check ?? false;
	const ruleInputs = [...(values.rules ?? []), ...(check ? positionals : [])];
	const rulesPaths = ruleInputs.map(resolveRulePath);
	const [file] = positionals;

	if (!rulesPaths.length || (!check && !file)) {
		throw new Error(
			"usage: node main.ts [-c|--check] -r <name|path> [-r ...] [--provider <jev|openrouter>] [--model <model>] [--json] [--stats] [--debug] [-h|--help] [-v|--version] [file]",
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
		help: false,
		version: false,
	};
}

const USAGE =
	"usage: slop-grader [-c|--check] -r <name|path> [-r ...] [--provider <jev|openrouter>] [--model <model>] [--json] [--stats] [--debug] [-h|--help] [-v|--version] [file]";

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
		help,
		version,
	} = parseCliArgs();

	if (help) {
		console.log(USAGE);
		return;
	}

	if (version) {
		const pkgPath = fileURLToPath(new URL("../package.json", import.meta.url));
		const pkg = JSON.parse(await readFile(pkgPath, "utf8")) as {
			version: string;
		};
		console.log(pkg.version);
		return;
	}

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

	const skillPath = fileURLToPath(new URL("../SKILL.md", import.meta.url));
	const filePath = resolve(file);

	const [{ lineRules, docRules }, fullText] = await Promise.all([
		loadRules(rulesPaths),
		readFile(file, "utf8"),
	]);
	const lines = parseLines(fullText);

	const [flags, docResult] = await Promise.all([
		gradeLines(lines, lineRules, trackingProvider),
		gradeDocument(fullText, docRules, trackingProvider),
	]);
	const { scores, flags: docFlags } = docResult;

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

	const hasScoreViolation = Object.entries(scores).some(([key, answer]) => {
		const q = docRules[key];
		const criteria = q?.criteria as string[] | undefined;
		if (!criteria || !Array.isArray(criteria)) return false;
		const max = criteria.length - 1;
		return isScoreViolation(answer.score, max);
	});
	const hasViolations =
		flags.size > 0 || docFlags.length > 0 || hasScoreViolation;

	if (json) {
		console.log(
			formatJson(
				filePath,
				rulesPaths,
				lines,
				flags,
				scores,
				docRules,
				docFlags,
				statsData,
			),
		);
		return;
	}

	if (!hasViolations) {
		console.log("No rules violated.");
		const docScores = formatDocumentScores(scores, docRules);
		for (const line of docScores) {
			console.log(line);
		}
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

	const docViolations = formatDocumentViolations(docFlags, docRules);
	for (const line of docViolations) {
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
