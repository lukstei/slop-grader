import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { gunzipSync } from "node:zlib";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
	CACHE_VERSION,
	getDefaultCacheDir,
	hashLine,
	hashRule,
	LineCacheManager,
	RuleCache,
	sanitizePathComponent,
} from "./cache.ts";
import type { NoulQuestion } from "./types.ts";

describe("cache module", () => {
	let tempDir: string;

	beforeEach(async () => {
		tempDir = await mkdtemp(join(tmpdir(), "slop-grader-cache-test-"));
	});

	afterEach(async () => {
		await rm(tempDir, { recursive: true, force: true });
	});

	describe("getDefaultCacheDir", () => {
		const originalEnv = { ...process.env };
		const originalPlatform = process.platform;

		afterEach(() => {
			process.env = { ...originalEnv };
			Object.defineProperty(process, "platform", {
				value: originalPlatform,
			});
		});

		it("prefers XDG_CACHE_HOME when present", () => {
			process.env.XDG_CACHE_HOME = "/custom/cache";
			expect(getDefaultCacheDir("slop-grader")).toBe(
				"/custom/cache/slop-grader",
			);
		});

		it("returns Library/Caches on macOS when XDG_CACHE_HOME is absent", () => {
			delete process.env.XDG_CACHE_HOME;
			Object.defineProperty(process, "platform", { value: "darwin" });
			const dir = getDefaultCacheDir("slop-grader");
			expect(dir).toContain("Library/Caches/slop-grader");
		});

		it("returns .cache on linux when XDG_CACHE_HOME is absent", () => {
			delete process.env.XDG_CACHE_HOME;
			Object.defineProperty(process, "platform", { value: "linux" });
			const dir = getDefaultCacheDir("slop-grader");
			expect(dir).toContain(".cache/slop-grader");
		});
	});

	describe("sanitizePathComponent", () => {
		it("replaces special characters and leading tilde", () => {
			expect(sanitizePathComponent("~typesafe/jev-1.13.0")).toBe(
				"typesafe--jev-1.13.0",
			);
			expect(sanitizePathComponent("provider:name/model\\v1")).toBe(
				"provider--name--model--v1",
			);
			expect(sanitizePathComponent("normal_name")).toBe("normal_name");
		});

		it("rejects empty or relative directory segments", () => {
			expect(() => sanitizePathComponent(".")).toThrow();
			expect(() => sanitizePathComponent("..")).toThrow();
			expect(() => sanitizePathComponent("~")).toThrow();
		});
	});

	describe("hashing functions", () => {
		const q: NoulQuestion = {
			type: "noul",
			instructions: "Check for passive voice",
			criteria: { true: "Passive", false: "Active" },
		};

		it("produces deterministic 16-character rule hashes", () => {
			const hash1 = hashRule(q);
			const hash2 = hashRule({ ...q });
			expect(hash1).toBe(hash2);
			expect(hash1).toHaveLength(16);

			const differentRule: NoulQuestion = {
				...q,
				instructions: "Different instructions",
			};
			expect(hashRule(differentRule)).not.toBe(hash1);
		});

		it("trims whitespace and produces 16-character line hashes", () => {
			const hash = hashLine("hello world");
			expect(hash).toHaveLength(16);
			expect(hash).toBe(hashLine("  hello world  \r\n"));
			expect(hash).not.toBe(hashLine("hello world!"));
		});
	});

	describe("RuleCache", () => {
		const ruleHash = "rule-hash-123";

		it("stores and retrieves noul scores via getMatches", () => {
			const cache = new RuleCache(ruleHash);
			cache.addMatches([
				["line-1", 0.12],
				["line-2", 0.95],
			]);

			const matches = cache.getMatches(
				new Map([
					["line-1", [1]],
					["line-2", [2]],
					["line-missing", [3]],
				]),
			);
			expect(matches.get(1)).toBe(0.12);
			expect(matches.get(2)).toBe(0.95);
			expect(matches.has(3)).toBe(false);
		});

		it("deduplicates fresh entries with identical hashes in a single call", () => {
			const cache = new RuleCache(ruleHash);
			cache.addMatches([
				["duplicate-line", 0.3],
				["duplicate-line", 0.85],
			]);
			expect(cache.toPayload().entries).toEqual([["duplicate-line", 0.85]]);
		});

		it("filters out malformed entry elements from initial payload", () => {
			const initial = {
				ruleHash,
				entries: [
					["valid-line", 0.5] as [string, number],
					null as unknown as [string, number],
					["missing-score"] as unknown as [string, number],
					[123, "not-a-number"] as unknown as [string, number],
				],
			};
			const cache = new RuleCache(ruleHash, initial);
			const matches = cache.getMatches(new Map([["valid-line", [1]]]));
			expect(matches.get(1)).toBe(0.5);
			expect(cache.toPayload().entries).toEqual([["valid-line", 0.5]]);
		});

		it("prunes least recently added entries when exceeding maxEntries", () => {
			const cache = new RuleCache(ruleHash, undefined, 3);
			cache.addMatches([["l1", 0.1]]);
			cache.addMatches([["l2", 0.2]]);
			cache.addMatches([["l3", 0.3]]);

			// Re-add l1 to make it most recently added (l2 becomes oldest)
			cache.addMatches([["l1", 0.1]]);

			// Insert 4th entry -> l2 should be evicted
			cache.addMatches([["l4", 0.4]]);

			const matches = cache.getMatches(
				new Map([
					["l1", [1]],
					["l2", [2]],
					["l3", [3]],
					["l4", [4]],
				]),
			);
			expect(matches.get(1)).toBe(0.1);
			expect(matches.has(2)).toBe(false);
			expect(matches.get(3)).toBe(0.3);
			expect(matches.get(4)).toBe(0.4);
		});

		it("invalidates initial payload if ruleHash differs", () => {
			const initial = {
				ruleHash: "old-rule-hash",
				entries: [["line-1", 0.12] as [string, number]],
			};
			const cache = new RuleCache("new-rule-hash", initial);
			const matches = cache.getMatches(new Map([["line-1", [1]]]));
			expect(matches.has(1)).toBe(false);
		});

		it("matches multiple line occurrences via single-pass lineHashes map", () => {
			const cache = new RuleCache(ruleHash);
			cache.addMatches([
				["hash-a", 0.9],
				["hash-b", 0.2],
			]);

			const lineHashes = new Map<string, number[]>([
				["hash-a", [1, 5]],
				["hash-b", [2]],
				["hash-missing", [3]],
			]);

			const matches = cache.getMatches(lineHashes);
			expect(matches.get(1)).toBe(0.9);
			expect(matches.get(5)).toBe(0.9);
			expect(matches.get(2)).toBe(0.2);
			expect(matches.has(3)).toBe(false);
		});
	});

	describe("LineCacheManager", () => {
		const q: NoulQuestion = {
			type: "noul",
			instructions: "Detect passive voice",
		};

		it("constructs correct versioned path with CACHE_VERSION", () => {
			const manager = new LineCacheManager({
				baseDir: tempDir,
				provider: "jev",
				model: "jev-1.13.0",
			});

			const filePath = manager.getCacheFilePath("passive_voice");
			expect(filePath).toBe(
				resolve(
					tempDir,
					CACHE_VERSION,
					"jev",
					"jev-1.13.0",
					"passive_voice.json.gz",
				),
			);
		});

		it("persists and reloads gzipped cache files across instances", async () => {
			const manager1 = new LineCacheManager({
				baseDir: tempDir,
				provider: "jev",
				model: "jev-1.13.0",
			});

			await manager1.saveRuleScores("passive_voice", q, [
				["line-hash-abc", 0.88],
			]);

			// Verify file on disk is gzipped JSON
			const filePath = manager1.getCacheFilePath("passive_voice");
			const rawGz = await readFile(filePath);
			const uncompressed = gunzipSync(rawGz).toString("utf8");
			expect(JSON.parse(uncompressed)).toEqual({
				ruleHash: hashRule(q),
				entries: [["line-hash-abc", 0.88]],
			});

			// Verify clean instance loads saved entries
			const manager2 = new LineCacheManager({
				baseDir: tempDir,
				provider: "jev",
				model: "jev-1.13.0",
			});
			const cache2 = await manager2.loadRuleCache("passive_voice", q);
			const matches = cache2.getMatches(new Map([["line-hash-abc", [1]]]));
			expect(matches.get(1)).toBe(0.88);
		});

		it("prefilters lines cleanly into cached matches and uncached lines", async () => {
			const manager = new LineCacheManager({
				baseDir: tempDir,
				provider: "jev",
				model: "jev-1.13.0",
			});

			await manager.saveRuleScores("passive_voice", q, [
				[hashLine("Line one"), 0.95],
			]);

			const lines = [
				{ lineNum: 1, text: "Line one" },
				{ lineNum: 2, text: "Line two" },
			];
			const lineHashes = new Map<string, number[]>([
				[hashLine("Line one"), [1]],
				[hashLine("Line two"), [2]],
			]);

			const result = await manager.prefilterRule(
				"passive_voice",
				q,
				lines,
				lineHashes,
			);
			expect(result.cachedScores.get(1)).toBe(0.95);
			expect(result.uncachedLines).toEqual([{ lineNum: 2, text: "Line two" }]);
		});

		it("recovers gracefully from corrupted gzip files", async () => {
			const manager = new LineCacheManager({
				baseDir: tempDir,
				provider: "jev",
				model: "jev-1.13.0",
			});
			const filePath = manager.getCacheFilePath("passive_voice");

			// Write corrupt file
			const dir = resolve(tempDir, CACHE_VERSION, "jev", "jev-1.13.0");
			const { mkdir } = await import("node:fs/promises");
			await mkdir(dir, { recursive: true });
			await writeFile(filePath, Buffer.from("not-a-gzip-file"));

			// Should not throw, should return fresh cache
			const cache = await manager.loadRuleCache("passive_voice", q);
			expect(cache.toPayload().entries).toEqual([]);
			await manager.saveRuleScores("passive_voice", q, [
				["recovered-line", 0.42],
			]);

			const reloaded = await manager.loadRuleCache("passive_voice", q);
			const matches = reloaded.getMatches(new Map([["recovered-line", [1]]]));
			expect(matches.get(1)).toBe(0.42);
		});
	});
});
