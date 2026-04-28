---
name: systematic-debugging
description: >
  Hypothesis-driven debugging loop. Forces explicit hypothesis formation before
  any fix attempt. Prevents guess-and-check debugging. Triggers on keywords
  "debug", "error", "broken", "failing", "why is", "not working".
allowed-tools: Read Write Bash
---

# Systematic Debugging

Never guess-and-check. Always hypothesize first, then design a test for the hypothesis.

## Step 1: Reproduce

Confirm you can reproduce the bug.
- Write a minimal reproduction case
- If you can't reproduce: the bug is environment-specific — investigate environment first
- Document: exact inputs → expected output → actual output

## Step 2: Hypothesize

Write 3 hypotheses, ordered by likelihood (most likely first):
```
H1: IF [condition] THEN [expected] BUT we see [actual]
    Evidence for: [why this is likely]
    Evidence against: [why this might be wrong]

H2: [same format]
H3: [same format]
```

## Step 3: Test Most Likely Hypothesis

Design a targeted test that confirms OR rules out H1.
A good test is:
- Targeted: tests H1 specifically, not the whole system
- Binary: clearly confirms OR rules out
- Fast: no full rebuild needed

## Step 4: Record and Iterate

```
H1: [confirmed | ruled out]
Evidence: [what you observed]
```

If confirmed: root cause found → go to Step 5.
If ruled out: move to H2. Repeat.
If all 3 ruled out: write 3 new hypotheses based on what you learned.

## Step 5: Fix with Confidence

1. Write a regression test that captures the bug (RED)
2. Fix the root cause (not the symptom)
3. Run regression test (GREEN)
4. Run full test suite — no regressions

## Common Mistake: Fixing the Symptom
Symptom: API returns 500
Root cause: DB connection pool exhausted
Wrong fix: retry API call → symptom addressed, root cause remains

Always trace back to WHY, not just WHAT.

See references/debug-hypotheses.md for hypothesis templates by error type.
