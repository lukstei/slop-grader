# Incremental Line Caching

`slop-grader` caches line-level rule evaluations to disk so repeated runs during editing loops evaluate only modified lines. Unchanged lines resolve from the cache with zero API calls.

---

## Cache Keys & Invalidation

Cache entries use content hashes instead of document line numbers, so lines can move or repeat without invalidating scores.

### Line Content Hashing

- Computed with SHA-256 over trimmed line text, truncated to 16 hex characters (64 bits of entropy).
- Trimming leading and trailing whitespace ensures that indent adjustments and line-ending differences (`\r\n` vs `\n`) do not trigger cache misses. Empty or whitespace-only lines are ignored and never cached.

### Rule Definition Hashing

- Computed with SHA-256 over canonical JSON containing instructions and criteria, truncated to 16 hex characters.
- Changing a prompt, adding a criterion, or altering instructions produces a new rule hash, invalidating stale cache entries for that rule across all documents.

### Provider and Model Namespacing

- Cache files are partitioned by provider and model. Running evaluations against `jev-1.13.0` does not mix with evaluations from other models or providers.

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

- **Path sanitization:** Model and rule names replace slashes, backslashes, colons, and leading tildes with double hyphens (`--`). Directory traversal markers (`.` and `..`) are rejected.
- **Example path:**
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

- **Atomic writes:** Saves compress to a temporary sibling file in the same directory and swap into place with an atomic rename on the same volume.

---

## Data Structures & Memory Management

### Array Storage

Entries are stored as an array of `[hash, score]` pairs up to 25,000 entries.

- **Allocation avoidance:** Parsing an array of primitive pairs directly from JSON and serializing back to disk avoids the object allocation and garbage collection overhead of large map lookups.
- **Single-pass matching:** During evaluation, the cache scans the array against a lookup map of the active document's line hashes.

### Eviction & Deduplication

- **Capacity limit:** Default maximum of 25,000 entries per rule.
- **Eviction order:** Eviction follows insertion order (FIFO by evaluation recency), not access-based LRU. When adding fresh evaluations, existing entries matching the incoming hashes are removed, and new entries are prepended to the head of the array. The array is then truncated to 25,000 entries. Cached hits do not rewrite disk files or bump positions, keeping cache hits purely read-only with zero overhead.
- **Deduplication:** Repeated identical lines within a document are deduplicated before prepending, storing only one entry per unique line hash.

### Memory Protection

- **Disk-backed rules:** Rule caches do not stay resident in memory. Each cache loads on demand for matching and is discarded immediately after, keeping working memory bounded across large rulesets.
- **Sequential writeback:** Disk saves run sequentially after an API call, so only one 25,000-entry cache is decompressed and buffered in memory at a time.

---

## Evaluation Lifecycle

```text
Document lines
      │
      ▼
Map line hashes to line numbers
      │
      ▼
Check rule caches (<rule>.json.gz)
    ├── Cache hits ──► Reuse saved scores
    └── Uncached lines collected
       │
       ▼
Are uncached lines present?
    ├── No  ──► Skip API calls; extract flags immediately
    └── Yes ──► Batch lines ──► Provider API calls
                   │
                   ▼
                Sequential disk writeback
                   │
                   ▼
                Terminal report / JSON
```

1. **Indexing:** Scans input lines once and maps each line hash to its line numbers.
2. **Prefiltering:** Each line rule checks its cache file. Line numbers with cached scores populate results directly.
3. **Batching:** Only uncached lines are grouped into batch requests. If all lines hit the cache, zero API calls are made.
4. **Writeback:** When new lines are evaluated by the model, the cache file loads, prepends the new evaluations, and writes the updated compressed file atomically.

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
