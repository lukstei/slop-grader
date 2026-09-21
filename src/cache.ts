import assert from "node:assert/strict";
import { createHash, randomUUID } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { dirname, resolve } from "node:path";
import { gunzipSync, gzipSync } from "node:zlib";
import type { Line, NoulQuestion } from "./types.ts";

export const CACHE_VERSION = "v1";
export const DEFAULT_MAX_ENTRIES = 25_000;

export function getDefaultCacheDir(appName = "slop-grader"): string {
	if (process.env.XDG_CACHE_HOME) {
		return resolve(process.env.XDG_CACHE_HOME, appName);
	}
	const home = homedir();
	switch (process.platform) {
		case "darwin":
			return resolve(home, "Library/Caches", appName);
		case "win32":
			return resolve(
				process.env.LOCALAPPDATA || resolve(home, "AppData", "Local"),
				appName,
				"Cache",
			);
		default:
			return resolve(home, ".cache", appName);
	}
}

export function sanitizePathComponent(name: string): string {
	assert(name.length > 0, "Path component must not be empty");
	const sanitized = name.replace(/^~+/, "").replace(/[/\\:~]+/g, "--");
	assert(sanitized.length > 0, "Sanitized path component must not be empty");
	assert(
		sanitized !== "." && sanitized !== "..",
		"Path component must not be a relative path segment",
	);
	return sanitized;
}

export const HASH_LENGTH = 16;

export function hashRule(qDef: NoulQuestion): string {
	const content = JSON.stringify({
		instructions: qDef.instructions,
		criteria: qDef.criteria ?? null,
	});
	return createHash("sha256")
		.update(content)
		.digest("hex")
		.slice(0, HASH_LENGTH);
}

export function hashLine(text: string): string {
	return createHash("sha256")
		.update(text.trim())
		.digest("hex")
		.slice(0, HASH_LENGTH);
}

type CacheEntry = [hash: string, score: number];

type CachePayload = {
	ruleHash: string;
	entries: CacheEntry[];
};

/**
 * RuleCache stores line evaluation scores for a single rule in an array of [hash, score] tuples.
 * An array representation is chosen over Map to avoid allocation and garbage collection
 * overhead for 25,000 entries during single-pass matching, while allowing direct serialization.
 */
export class RuleCache {
	#entries: CacheEntry[] = [];
	readonly #ruleHash: string;
	readonly #maxEntries: number;
	#dirty = false;

	constructor(
		ruleHash: string,
		initial?: CachePayload,
		maxEntries = DEFAULT_MAX_ENTRIES,
	) {
		assert(maxEntries > 0, "maxEntries must be positive");
		this.#ruleHash = ruleHash;
		this.#maxEntries = maxEntries;

		if (
			initial &&
			initial.ruleHash === ruleHash &&
			Array.isArray(initial.entries)
		) {
			const valid: CacheEntry[] = [];
			for (const entry of initial.entries) {
				if (
					Array.isArray(entry) &&
					entry.length === 2 &&
					typeof entry[0] === "string" &&
					typeof entry[1] === "number"
				) {
					valid.push([entry[0], entry[1]]);
					if (valid.length === maxEntries) break;
				}
			}
			this.#entries = valid;
		}
	}

	get dirty(): boolean {
		return this.#dirty;
	}

	getMatches(lineHashes: Map<string, number[]>): Map<number, number> {
		const matches = new Map<number, number>();
		for (const [hash, score] of this.#entries) {
			const lineNums = lineHashes.get(hash);
			if (lineNums !== undefined) {
				for (const num of lineNums) {
					matches.set(num, score);
				}
			}
		}
		return matches;
	}

	/**
	 * Adds fresh evaluations to the cache. Incoming entries are deduplicated so duplicate
	 * lines in a batch cannot pollute the LRU array with duplicate keys.
	 */
	addMatches(fresh: Iterable<[hash: string, score: number]>): void {
		const freshMap = new Map<string, number>();
		for (const [hash, score] of fresh) {
			freshMap.set(hash, score);
		}
		if (freshMap.size === 0) return;

		const freshArray: CacheEntry[] = Array.from(freshMap.entries());
		const remaining = this.#entries.filter(([h]) => !freshMap.has(h));
		this.#entries = [...freshArray, ...remaining];

		if (this.#entries.length > this.#maxEntries) {
			this.#entries.length = this.#maxEntries;
		}
		this.#dirty = true;
	}

	toPayload(): CachePayload {
		return {
			ruleHash: this.#ruleHash,
			entries: this.#entries,
		};
	}
}

/**
 * Manages rule-level cache persistence on disk. Cache files remain disk-backed
 * and are not retained in an in-memory map across rules to prevent heap exhaustion
 * when grading documents against hundreds of rules with up to 25,000 entries each.
 */
export class LineCacheManager {
	readonly #baseDir: string;
	readonly #providerName: string;
	readonly #modelName: string;
	readonly #maxEntries: number;

	constructor(options: {
		baseDir?: string;
		provider: string;
		model: string;
		maxEntries?: number;
	}) {
		this.#baseDir = options.baseDir ?? getDefaultCacheDir();
		this.#providerName = sanitizePathComponent(options.provider);
		this.#modelName = sanitizePathComponent(options.model);
		this.#maxEntries = options.maxEntries ?? DEFAULT_MAX_ENTRIES;
	}

	getCacheFilePath(ruleId: string): string {
		const safeRule = sanitizePathComponent(ruleId);
		return resolve(
			this.#baseDir,
			CACHE_VERSION,
			this.#providerName,
			this.#modelName,
			`${safeRule}.json.gz`,
		);
	}

	async loadRuleCache(ruleId: string, qDef: NoulQuestion): Promise<RuleCache> {
		const ruleHash = hashRule(qDef);
		const filePath = this.getCacheFilePath(ruleId);
		let initial: CachePayload | undefined;

		try {
			const raw = await readFile(filePath);
			const json = gunzipSync(raw).toString("utf8");
			initial = JSON.parse(json) as CachePayload;
		} catch {
			// File does not exist, or gzip/JSON is corrupt: start fresh
		}

		return new RuleCache(ruleHash, initial, this.#maxEntries);
	}

	async saveRuleCache(ruleId: string, cache: RuleCache): Promise<void> {
		if (!cache.dirty) return;
		const filePath = this.getCacheFilePath(ruleId);
		const payload = cache.toPayload();
		const json = JSON.stringify(payload);
		const compressed = gzipSync(Buffer.from(json, "utf8"));
		const dir = dirname(filePath);
		await mkdir(dir, { recursive: true });
		const tmpPath = `${filePath}.${randomUUID()}.tmp`;
		await writeFile(tmpPath, compressed);
		await rename(tmpPath, filePath);
	}

	async prefilterRule(
		ruleId: string,
		qDef: NoulQuestion,
		lines: Line[],
		lineHashes: Map<string, number[]>,
	): Promise<{ cachedScores: Map<number, number>; uncachedLines: Line[] }> {
		const cache = await this.loadRuleCache(ruleId, qDef);
		const cachedScores = cache.getMatches(lineHashes);
		const uncachedLines = lines.filter((l) => !cachedScores.has(l.lineNum));
		return { cachedScores, uncachedLines };
	}

	async saveRuleScores(
		ruleId: string,
		qDef: NoulQuestion,
		freshScores: Iterable<[hash: string, score: number]>,
	): Promise<void> {
		const cache = await this.loadRuleCache(ruleId, qDef);
		cache.addMatches(freshScores);
		await this.saveRuleCache(ruleId, cache);
	}
}
