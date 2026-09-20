# Markdown Rule Syntax Reference

This document specifies the Markdown syntax for `slop-grader` rule files (`.md`).

---

## Document Hierarchy

A rule file follows a strict Markdown heading hierarchy:

```text
[Preamble]                     ← Optional description text before the first H1
# <Scope Section>              ← H1: strictly "# Line Rules" or "# Document Rules"
  ## <rule_id>                 ← H2: Rule identifier
    [Instructions]             ← Freeform prompt text
    ### Criteria               ← H3: Optional ("### Criteria")
      - <Item>                 ← Unordered bullet items defining criteria
```

---

## Specification

### 1. Preamble (Optional)

Any text, paragraphs, or notes placed at the start of the file before the first H1 heading are treated as a human-readable description and ignored by the parser.

```markdown
Custom documentation and quality checks for backend services.
These rules run on all pull requests.

# Line Rules
...
```

### 2. Scope Sections (`H1`)

Scope sections define whether subsequent rules evaluate line-by-line or over the complete document text.

- **`# Line Rules`**: Rules evaluate against individual non-empty lines (`L0001`, `L0002`, ...). Questions under this section always run as boolean `noul` evaluations.
- **`# Document Rules`**: Rules evaluate against the complete file text. Questions under this section run as either multi-tier `score` distributions or document-level `noul` questions.

#### Constraints
- Only `# Line Rules` and `# Document Rules` are permitted as H1 headings. Any other H1 heading (such as `# My Rules`) produces a validation error.
- Each section heading may appear at most once per file.
- Section headings must be H1 (`#`). Placing a section heading at H2 (`## Line Rules`) produces a validation error.
- A file may contain `# Line Rules`, `# Document Rules`, or both.

### 3. Rule Definitions (`H2`)

Each rule begins with an H2 heading specifying its identifier:

```markdown
## banned_word
```

- **Identifier syntax:** Heading text forms the rule ID. Leading and trailing backticks are stripped (`## `banned_word`` resolves to `banned_word`).
- **Placement:** Must appear under an active `# Line Rules` or `# Document Rules` section.
- **Uniqueness:** Rule IDs must be unique within the ruleset.

### 4. Instructions

All text under the rule heading (`## <rule_id>`) up to `### Criteria` (or until the next rule or section heading if criteria is omitted) serves as the instructions prompt for the AI model:

```markdown
## ambiguous_pronoun
Does the line use a pronoun ("it", "this", "that") whose antecedent is unclear?
In particular, flag cases where two preceding nouns could both be the referent.

### Criteria
...
```

- Freeform text: Markdown formatting, code snippets, quotes, and multiple paragraphs are supported without character escaping.

### 5. Type Specification

Question types dictate how the model evaluates the target:

- **`noul`**: Evaluates probability ($0.0$ to $1.0$) of a violation. Flags lines crossing the confidence threshold (default $0.8$).
- **`score`**: Evaluates distribution across discrete levels ($0$ to $N$).

#### Type Detection
- Rules under `# Line Rules` always use type `noul`.
- Rules under `# Document Rules`:
  - Default to `noul` if `### Criteria` is omitted.
  - Detected as `noul` if `### Criteria` defines both `true` and `false` items.
  - Detected as `score` if `### Criteria` defines a list of level descriptions.

### 6. Criteria Section (`H3`, Optional)

The criteria section is optional. When omitted, the rule evaluates as a boolean `noul` question based solely on its instructions.

When present, it must be headed strictly with `### Criteria`:

#### Format for `noul` Questions (Line Rules & Document Boolean Rules)
Requires both `true` and `false` cases defined as unordered bullet points:

```markdown
### Criteria
- **true**: Condition that confirms a violation.
- **false**: Condition where the line or document is clean.
```

- Case-insensitive: accepts `- **true**:`, `- true:`, `- **false**:`, `- false:`.
- Wrapped lines: Continuation lines indented with 2 or more spaces are appended to the preceding case.

#### Format for `score` Questions (Document Multi-Tier Rules)
Requires an unordered bullet list of at least 2 levels (typically 4 levels: 0 to 3):

```markdown
### Criteria
- Level 0 description (lowest quality or absent)
- Level 1 description (partial or basic)
- Level 2 description (solid or complete)
- Level 3 description (exemplary)
```

- Ordering: The first bullet item represents score index 0; the last bullet represents the maximum score index.
- Multi-line continuation: Indent continuation lines with 2 or more spaces.

---

## Validation Diagnostics Reference

When a Markdown rule file deviates from the specification, `slop-grader` fails with an explicit error identifying the file and rule:

| Condition | Diagnostic Message | Resolution |
|---|---|---|
| Non-standard H1 | `Invalid top-level heading "# ...": only "# Line Rules" and "# Document Rules" are allowed as H1 headings` | Move document descriptions above the first H1 |
| Section heading at H2 | `Invalid heading "## ...": section headings must be H1` | Change heading to H1 (`# Line Rules` or `# Document Rules`) |
| Duplicate section | `Duplicate "# ..." heading: each section may only appear once` | Group all rules of the same scope under one H1 |
| Rule outside scope | `Rule "<id>" must be defined under a "# Line Rules" or "# Document Rules" section` | Place the rule under `# Line Rules` or `# Document Rules` |
| Incomplete noul criteria | `Rule "<id>" (...) criteria must define both "true" and "false" cases` | Provide both `- **true**:` and `- **false**:` items |
| Insufficient score levels | `Rule "<id>" (...) criteria must contain at least 2 levels` | Provide at least 2 unordered bullet items |
| Empty instructions | `Rule "<id>" is missing instructions text` | Add prompt text between `## <id>` and `### Criteria` (or before the next rule) |

---

## Reference Examples

### Example 1 — Pure Line Ruleset

```markdown
Custom style checks for English technical drafts.

# Line Rules

## empty_adverb
Does the line use an adverb that adds nothing to the meaning?

### Criteria
- **true**: The adverb can be deleted without changing meaning or spoken cadence.
- **false**: The adverb carries necessary emphasis or distinction.

## passive_voice
Is the line written in passive voice where naming the actor would improve clarity?

### Criteria
- **true**: Passive voice hides the actor ("the request was submitted").
- **false**: Active voice is used, or the actor is genuinely irrelevant or unknown.
```

### Example 2 — Pure Document Score Ruleset

```markdown
Scoring rubric for blog articles and technical guides.

# Document Rules

## technical_depth
Rate how thoroughly the article explains underlying mechanics and trade-offs.

### Criteria
- Surface-level mention of tools without architectural reasoning
- Basic architectural overview but glosses over operational trade-offs
- Detailed analysis of architecture, failure modes, and trade-offs
- Deep dive with production-tested benchmarks and concrete mitigation strategies

## practical_utility
Can a reader immediately apply the guidance in this document?

### Criteria
- Pure theory with no runnable examples or implementation steps
- Contains snippets, but critical configuration or dependencies are missing
- Complete, runnable snippets with clear prerequisites
- Production-grade examples with end-to-end steps and error handling
```

### Example 3 — Mixed Ruleset (Document + Line)

```markdown
Technical documentation standards.

# Document Rules

## task_orientation
Is the guide organized around user tasks rather than internal system architecture?

### Criteria
- Architecture dump with no clear user workflow
- Mixed explanations requiring the reader to assemble the workflow
- Task-oriented with clear sequential steps
- Cookbook-grade with inputs, steps, and expected outputs

# Line Rules

## minimizing_language
Does the line use condescending shortcuts ("simply", "just", "obviously") to minimize a complex step?

### Criteria
- **true**: The line minimizes a step requiring configuration or technical decisions.
- **false**: The step is genuinely trivial (e.g. "click Save"), or no minimizing term appears.
```

### Example 4 — Document Boolean Rule (`noul`)

```markdown
Structural verification for RFC proposals.

# Document Rules

## executive_summary_present
Does the document contain an executive summary or abstract section near the beginning?

### Criteria
- **true**: An executive summary or abstract is present.
- **false**: No summary exists; the document jumps straight into technical details.
```
