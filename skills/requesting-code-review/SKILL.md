---
name: requesting-code-review
description: >
  Two-pass code review: spec compliance first, code quality second. Produces
  structured report with ✓/⚠/✗ items. Blocking issues must be fixed before ship.
  Triggers on keyword "review" or when REVIEW workflow is active.
allowed-tools: Read Bash
---

# Code Review — Two-Pass Protocol

Pass 1: does it do what was asked? Pass 2: is it well-written?
Never merge until all ✗ blocking issues are resolved.

## Pass 1 — Spec Compliance

Compare against .ohc/plans/ success criteria and user requirements.

For each requirement:
- ✓ **Implemented** — code clearly implements this
- ⚠ **Partial** — implemented with a gap (name the gap)
- ✗ **Missing** — not implemented (blocking)

Do NOT comment on code quality in Pass 1. Only: does it do what was asked?

## Pass 2 — Code Quality (only after Pass 1 clean)

**Naming** (⚠ severity):
- Variable, function, file names clear without comments to explain?
- Names match conventions in PROJECT.md?

**Complexity** (⚠ severity):
- Functions >10 branches → flag for decomposition
- Files >300 lines → flag for splitting

**Test coverage** (✓ required):
- Happy path tested?
- Error cases tested?
- Edge cases (null, empty, boundary values)?

**Security** (✗ severity):
- SQL injection: raw string interpolation into queries?
- XSS: user input rendered without escaping?
- Auth bypass: unauthenticated request reaching protected routes?
- Secret exposure: API keys or passwords in code?

**Error handling** (⚠ severity):
- All failure modes handled explicitly?
- Error messages include useful context?

## Output Format
```
# Review: {task/PR name}

## Pass 1: Spec Compliance
✓ Implements: user login with email + password
⚠ Partial: logout — clears session but doesn't invalidate server-side token
✗ Missing: refresh token rotation (in success criteria)

## Pass 2: Code Quality
✓ Naming clear and consistent with conventions
⚠ auth.service.ts:87 — function has 12 branches — suggest splitting
✗ auth.controller.ts:42 — SQL uses string interpolation — injection risk

## Summary
Blocking: 2 — SQL injection + missing refresh token rotation
```

See references/review-checklist.md for full checklist.
