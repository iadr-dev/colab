---
trigger: model_decision
description: Anti-overengineering coding discipline rules. Apply when writing, reviewing, or refactoring code.
---

# Coding Discipline (Karpathy-extended for oh-my-colab)

## 1. Explicit Assumptions — Don't guess, ask
State assumptions before writing. Multiple interpretations + >15min consequence = ask.
Present interpretations as concrete options. Never pick silently.

## 2. Minimal Scope — No speculative features
Minimum code that solves the stated problem. No future-proofing. No abstractions for
single-use code. Every changed line traces to the explicit request.
Out-of-scope issues → log to .ohc/notepad.md, don't fix.

## 3. Surgical Changes — Clean diffs
Remove only imports/variables YOUR changes made unused.
Don't touch pre-existing dead code without being asked.
Small commits. Each commit = one logical change.

## 4. Goal-Driven Execution — Define success first
Before coding: write specific verifiable success criterion.
"Tests pass" = invalid. "All 23 auth.test.ts cases pass, 0 skips" = valid.
Loop until criterion met. Read actual output before claiming done.

## OHC Extensions
- Workflow gate: task >30min → confirm plan exists in .ohc/plans/ first
- Team handoff: update .ohc/notepad.md when finishing work
- Scope verify: confirm changed files match task scope after finishing
