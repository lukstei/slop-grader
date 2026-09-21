# Incremental Line Caching Architecture

`slop-grader` caches line-level rule evaluations to disk so repeated runs during editing loops evaluate only modified lines. Unchanged lines resolve from the cache with zero API calls.

---

## Cache Keys & Invalidation

Cache entries are keyed by content hashes rather than document line numbers, allowing lines to move or duplicate without invalidating scores.

### 1. Line Content Hashing
```ts
hashLine(text: string): string
```
- Computed via SHA-256 over `text.trim()` truncated to 16 hex characters (64 bits of entropy).
- Stripping leading and trailing whitespace ensures that indent adjustments or line-ending differences (`\r\n` vs `\n`) do not trigger cache misses. Empty or whitespace-only lines are ignored by the line parser and never cached.

### 2. Rule Definition Hashing
```ts
hashRule(qDef: NoulQuestion): string
```
- Computed via SHA-256 over the canonical JSON payload containing `instructions` and `criteria`, truncated to 16 hex characters.
- Modifying a prompt, adding a criterion bullet, or altering instructions in a Markdown ruleset generates a new rule hash, invalidating stale cache entries for that rule across all documents.

### 3. Provider and Model Namespacing
- Cache files are partitioned by provider and model. Running evaluations against `jev-1.13.0` does not mix with evaluations from alternative models or providers.

---

## Directory Hierarchy & File Format

### Cache Directory Resolution

`slop-grader` selects the cache root in the following precedence:

1. `--cache-dir <dir>` flag
2. `XDG_CACHE_HOME` environment variable (`$XDG_CACHE_HOME/slop-grader`)
3. OS-standard cache directories:
   - **macOS:** `~/Library/Caches/slop-grader`
   - **Linux / BSD:** `~/.cache/slop-grader`
   - **Windows:** `%LOCALAPPDATA%/slop-grader/Cache`

### Storage Layout

```text
<cache-dir>/
  v1/
    <provider>/
      <sanitized-model>/
        <sanitized-rule-id>.json.gz
```

- **Path Sanitization:** Model and rule names replace slashes, backslashes, colons, and leading tildes with double hyphens (`--`). Directory traversal markers (`.` and `..`) are rejected.
- **Example Path:**
  `~/Library/Caches/slop-grader/v1/openrouter/typesafe--jev-1.13.0/banned_word.json.gz`

### On-Disk File Format

Each rule stores its evaluations in an independent, Gzip-compressed JSON file containing:

```json
{
  "ruleHash": "78397ac3ada872de",
  "entries": [
    ["641b0f695d5005a5", 0.95],
    ["a1b2c3d4e5f60718", 0.12]
  ]
}
```

- **Atomic Writes:** Saves compress to a temporary sibling file (`${filePath}.${randomUUID()}.tmp`) and swap into place using `fs.rename`. Because the temporary file shares the parent directory with the target file, the rename is an atomic filesystem operation on the same volume.

---

## Data Structures & Memory Management

### Array Storage vs. Map Allocation

`RuleCache` retains its entries as an array of `[hash, score]` tuples up to 25,000 entries.

- **Allocation Avoidance:** Reconstituting a 25,000-entry `Map` for each rule adds object allocation and garbage collection overhead during single-pass lookups. An array of primitive tuples parses directly from JSON and serializes back to disk without intermediate conversions.
- **Single-Pass Matching:** During matching, `getMatches` iterates the cache array and tests against a small map of the active document's line hashes (`lineHashes.get(hash)`).

### LRU Eviction & Deduplication

- **Capacity Limit:** Default maximum of 25,000 entries per rule (`DEFAULT_MAX_ENTRIES`).
- **LRU Order:** When adding fresh evaluations, existing entries matching the incoming hashes are removed, and the fresh entries are prepended to the head of the array. The array is truncated to `maxEntries`.
- **Deduplication:** Fresh entries pass through a local `Map` before prepending. If a document contains repeated identical lines, the cache retains only one entry per unique line hash.

### Memory Protection

- **Disk-Backed Rules:** `LineCacheManager` does not retain rule caches in an in-memory registry. When evaluating 100+ rules, caches load on demand and discard once matching completes, keeping working memory bounded.
- **Sequential Writeback:** When saving dirty rule caches after an API run, `writebackCaches` processes dirty jobs sequentially. This ensures only one 25,000-entry cache is decompressed and buffered in memory at a time.

---

## Evaluation Lifecycle

```text
Document Lines
      │
      ▼
 indexLines() ──► Map<hash, lineNum[]>
      │
      ▼
 prefilterJobs()
   ├── Load Rule Cache (<rule>.json.gz)
   ├── Match cached hashes ──► Add to cached answers (Cache Hits)
   └── Collect uncached lines
      │
      ▼
 Are uncached lines present?
   ├── No  ──► Skip API calls; extract flags immediately
   └── Yes ──► batchLines() ──► Provider API calls
                  │
                  ▼
               writebackCaches() (sequential disk write)
                  │
                  ▼
               extractLineFlags() ──► Terminal Report / JSON
```

1. **Indexing:** `indexLines` scans the input lines once, mapping each line hash to its line numbers.
2. **Prefiltering:** Each line rule checks its cache file. Line numbers with cached scores populate the rule's answers directly.
3. **Batching:** Only uncached lines are grouped into batch requests. If all lines hit the cache, zero API calls are made.
4. **Writeback:** If new lines were evaluated by the model, `writebackCaches` loads the cache file, prepends the new evaluations, and writes the updated compressed file atomically.

---

## CLI Control

- `--no-cache`: Disables cache reads and writes. Evaluates all lines through the provider API from scratch.
- `--cache-dir <dir>`: Overrides the default cache directory location.
- `--stats` (`-s`): Displays cache hit metrics in the report:
  ```text
  ## Stats

  Rules applied:                6 (5 line, 1 document)
  Lines evaluated:              12
  Questions asked:              61
  API calls:                    2
  Questions evaluated via API:  51
  Cache hits:                   10
  ```
