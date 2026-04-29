# Debug Feedback Loops

The feedback loop is the debug engine. A fast, deterministic loop turns
hypotheses into evidence.

## Preferred loop types

Use the first loop that reaches the real failure mode:

1. Failing unit or integration test at the behavior surface.
2. HTTP script against a local dev server.
3. CLI invocation with fixture input and expected output.
4. Browser automation that asserts DOM, console, or network behavior.
5. Replayed trace from a real request, payload, event log, or HAR.
6. Throwaway harness around the smallest runnable subsystem.
7. Stress loop for races and flakes.
8. Differential loop comparing old vs new behavior.

## Loop quality

Improve the loop before debugging deeply:

- Faster: cache setup, skip unrelated boot, narrow the test scope.
- Sharper: assert the specific symptom, not "does not crash."
- More deterministic: pin time, seed randomness, isolate filesystem/network.
- More faithful: verify the loop reproduces the user's bug, not a nearby failure.

## Instrumentation

Each probe should test one hypothesis. Prefer debugger or REPL inspection when
available. Use logs sparingly and tag every temporary log with a unique prefix:

```text
[DEBUG-a4f2] checkout state before commit
```

Before declaring the bug fixed, search for the tag and remove every temporary
probe.

## When no loop exists

Stop and state what is missing. Ask for the smallest useful artifact:

- access to the reproducing environment
- captured request, payload, HAR, logs, core dump, or screen recording
- permission to add temporary production instrumentation

Do not guess from code alone unless the user explicitly accepts that risk.
