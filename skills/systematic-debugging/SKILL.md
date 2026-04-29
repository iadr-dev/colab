---
name: systematic-debugging
description: >
  Hypothesis-driven debugging loop. Forces explicit hypothesis formation before
  any fix attempt. Prevents guess-and-check debugging. Use when investigating
  or fixing an observed bug, failing test, runtime error, broken behavior, or
  performance regression.
allowed-tools: Read Write Bash
---

# Systematic Debugging

Never guess-and-check. Always hypothesize first, then design a test for the hypothesis.

## Step 1: Build the Feedback Loop

Create a fast, deterministic, agent-runnable pass/fail signal for the bug.
Prefer, in order: failing test, curl/CLI script, browser script, replayed trace,
throwaway harness, or stress loop for flakes.

If you cannot build a loop, stop and report what artifact or environment access
is missing. Do not patch from code reading alone.

## Step 2: Reproduce

Run the loop and confirm it matches the user's bug.
- Document: exact inputs → expected output → actual output
- For flakes: raise the reproduction rate until the signal is useful
- If the loop finds a different bug, fix the loop first

## Step 3: Hypothesize

Write 3 hypotheses, ordered by likelihood (most likely first):
```
H1: IF [condition] THEN [expected] BUT we see [actual]
    Evidence for: [why this is likely]
    Evidence against: [why this might be wrong]

H2: [same format]
H3: [same format]
```

## Step 4: Test Most Likely Hypothesis

Design a targeted test that confirms OR rules out H1.
A good test is:
- Targeted: tests H1 specifically, not the whole system
- Binary: clearly confirms OR rules out
- Fast: no full rebuild needed

Use targeted instrumentation only. Tag temporary logs with a unique prefix like
`[DEBUG-a4f2]` so cleanup is mechanical.

## Step 5: Record and Iterate

```
H1: [confirmed | ruled out]
Evidence: [what you observed]
```

If confirmed: root cause found → go to Step 6.
If ruled out: move to H2. Repeat.
If all 3 ruled out: write 3 new hypotheses based on what you learned.

## Step 6: Fix with Confidence

1. Write a regression test that captures the bug (RED)
2. Fix the root cause (not the symptom)
3. Run regression test (GREEN)
4. Re-run the original feedback loop
5. Remove all tagged debug instrumentation
6. Run full test suite — no regressions

## Common Mistake: Fixing the Symptom
Symptom: API returns 500
Root cause: DB connection pool exhausted
Wrong fix: retry API call → symptom addressed, root cause remains

Always trace back to WHY, not just WHAT.

See references/debug-hypotheses.md for hypothesis templates by error type.
See references/feedback-loops.md for ways to construct a reliable debug loop.
