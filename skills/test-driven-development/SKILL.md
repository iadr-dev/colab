---
name: test-driven-development
description: >
  RED-GREEN-REFACTOR discipline. Write failing test first, minimum code to pass,
  then refactor. Enforces verifier check before claiming any task done. Triggers
  on keyword "tdd" or when BUILD workflow is active.
allowed-tools: Read Write Bash
---

# Test-Driven Development

The loop: RED → GREEN → REFACTOR. Never skip a phase.
Work in vertical slices: one behavior test, the minimum implementation, then the
next behavior. Do not write all tests first and all implementation later.

## RED — Write a failing test first

Before any implementation code:
1. Write a test describing observable behavior through the public interface
2. Run the test — confirm it FAILS
3. Confirm it fails for the RIGHT reason:
   - ✓ "function doesn't exist yet"
   - ✓ "function returns wrong value"
   - ✗ "syntax error in test" → fix the test first
   - ✗ "missing import in test" → fix the import first

Do not write implementation until the test fails correctly.
Avoid implementation-detail tests: private methods, internal call counts, and
mocked internal collaborators. Mock only system boundaries.

## GREEN — Minimum code to pass

Write the MINIMUM code needed to make the test pass.
No optimization. No refactoring. No extra features.
The ugliest correct code beats the prettiest incorrect code.

Run the test. Read the output.
If it doesn't pass: fix implementation, not the test (unless test was wrong).

## REFACTOR — Clean up while staying green

Improve the code. Rename. Extract. Simplify.
After each change: run the tests. If they fail: revert the change.
Refactor ends when: code is clean AND tests still pass.

Never move to the next task while tests are red.

## Verifier Handoff

After RED-GREEN-REFACTOR for each task:
→ Hand to verifier agent with exact test command
→ Verifier runs both tests AND static quality checks, reports pass/fail counts
→ Only proceed if: 0 failing tests, 0 skipped, 0 failing quality checks, success criterion met

```bash
# Tests
bash skills/test-driven-development/scripts/verify-tests-pass.sh

# Typecheck + lint (auto-detects TS, JS, Python, Go, Rust, Dart, Swift; skips missing tools)
bash skills/test-driven-development/scripts/verify-code-quality.sh
```

## Common Mistakes

**Writing implementation first**: Resist. The test comes first, always.
**Tests that always pass**: A test that never fails is not a test. Confirm RED first.
**"I'll add tests later"**: Post-implementation tests test the implementation, not the requirement.
**Horizontal slicing**: Writing many tests before any implementation creates brittle imagined tests.
**Skipping refactor**: Technical debt is immediate. Refactor now while context is fresh.

See references/red-green-refactor.md for detailed examples.
See references/test-patterns.md for patterns by language.
See references/behavior-first-testing.md for vertical slices, mocking, and interface design.
