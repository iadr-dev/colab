---
name: requesting-code-review
description: >
  Senior-engineer code review: spec compliance first, then SOLID, security,
  performance, and code quality. Produces a structured P0-P3 severity report.
  Blocking issues (P0/P1) must be resolved before merge.
  Triggers on keyword "review" or when REVIEW workflow is active.
allowed-tools: Read Bash
---

# Code Review — Senior Engineer Protocol

**Default**: review-only output. Do NOT implement fixes unless user explicitly confirms.

## Severity Levels

| Level | Name | Description | Action |
|-------|------|-------------|--------|
| **P0** | Critical | Security vulnerability, data loss, correctness bug | Must block merge |
| **P1** | High | Logic error, significant SOLID violation, performance regression | Should fix before merge |
| **P2** | Medium | Code smell, maintainability concern, minor violation | Fix now or create follow-up |
| **P3** | Low | Style, naming, minor suggestion | Optional improvement |

## Workflow

### Step 1 — Preflight Context

```bash
git status -sb
git diff --stat
git diff
```

- Identify entry points, auth boundaries, and critical paths (payments, data writes, network).
- **If no diff**: inform user, ask if they want staged changes or a specific commit range.
- **If large diff (>500 lines)**: summarize by file first, then review in batches by module.

### Step 2 — Spec Compliance (Pass 1)

Compare against `.ohc/plans/` success criteria and user requirements.

For each requirement:
- ✓ **Implemented** — code clearly implements this
- ⚠ **Partial** — implemented with a gap (name the gap)
- ✗ **Missing** — not implemented (blocking)

Do NOT comment on code quality in this pass. Only: does it do what was asked?

### Step 3 — SOLID + Architecture

Load `references/solid-checklist.md`. Look for:
- **SRP**: Modules with unrelated responsibilities
- **OCP**: Behavior added by editing, not extending
- **LSP**: Subclasses that break parent contract
- **ISP**: Wide interfaces with unused methods
- **DIP**: High-level logic coupled to concrete implementations

When proposing a refactor, explain *why* and outline a minimal, safe, incremental plan.

### Step 4 — Removal Candidates

Load `references/removal-plan.md`. Identify:
- Unused code, redundant logic, feature-flagged-off code
- Distinguish **safe delete now** vs **defer with plan**

### Step 5 — Security & Reliability Scan

Load `references/security-checklist.md`. Check for:
- XSS, injection (SQL/NoSQL/command), SSRF, path traversal
- AuthZ/AuthN gaps, IDOR, missing tenancy checks
- JWT issues: algorithm confusion, weak secrets, missing `exp`/`iss`/`aud`
- Secret/PII leakage, excessive logging, missing data masking
- Race conditions: TOCTOU, check-then-act, missing DB transactions
- Runtime risks: unbounded loops, missing timeouts, ReDoS
- Weak crypto (MD5/SHA1), hardcoded IVs, missing HMAC

### Step 6 — Code Quality Scan

Load `references/code-quality-checklist.md`. Check for:
- **Error handling**: swallowed exceptions, unhandled promise rejections, missing context
- **Performance**: N+1 queries, sync I/O in async context, unbounded collections, missing cache
- **Boundary conditions**: null/undefined, empty collections, off-by-one, integer overflow

### Step 7 — Output Format

```markdown
## Code Review Summary

**Files reviewed**: X files, Y lines changed
**Overall assessment**: [APPROVE / REQUEST_CHANGES / COMMENT]

---

## Findings

### P0 - Critical
(none or list)

### P1 - High
1. **[file:line]** Brief title
   - Description of issue
   - Suggested fix

### P2 - Medium
2. (continue numbering across sections)

### P3 - Low
...

---

## Spec Compliance
✓ Implements: ...
⚠ Partial: ...
✗ Missing: ...

## Removal/Iteration Plan
(if applicable)
```

**Inline comment format** for file-specific findings:
```
::code-comment{file="path/to/file.ts" line="42" severity="P1"}
Description of the issue and suggested fix.
::
```

**Clean review**: If no issues found, explicitly state:
- What was checked
- Areas not covered (e.g., "Did not verify database migrations")
- Residual risks or recommended follow-up tests

### Step 8 — Next Steps Confirmation

After presenting findings, ask:

```markdown
## Next Steps

I found X issues (P0: _, P1: _, P2: _, P3: _).

**How would you like to proceed?**
1. **Fix all** — I'll implement all suggested fixes
2. **Fix P0/P1 only** — Address critical and high priority issues
3. **Fix specific items** — Tell me which issues to fix
4. **No changes** — Review complete, no implementation needed
```

**Important**: Do NOT implement any changes until user explicitly confirms.

---

See `references/review-checklist.md` for quick checklist reference.
See `references/solid-checklist.md`, `references/security-checklist.md`,
`references/code-quality-checklist.md`, `references/removal-plan.md` for full coverage.
