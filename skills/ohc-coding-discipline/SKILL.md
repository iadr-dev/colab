---
name: ohc-coding-discipline
description: >
  Anti-overengineering rules. Use when writing, reviewing, or refactoring code.
  Enforces surgical changes, explicit assumptions, minimal scope, and verifiable
  success criteria. Extended from Karpathy guidelines for team AI workflows.
allowed-tools: Read Bash
---

# OHC Coding Discipline

> Tradeoff: biases toward caution over speed.
> For trivial one-liners, use judgment. For anything >15 minutes, apply in full.

---

## Principle 1: Explicit Assumptions — Don't guess, ask

Before writing code, state assumptions explicitly:
- What does "done" look like? (specific, not "it works")
- What is the input shape and expected output?
- Are there edge cases not yet mentioned?

If the request has multiple plausible interpretations:
→ Present them. Don't pick silently.
→ Threshold: if >1 interpretation AND consequence is >15 min work → ask.

If a simpler path exists than what was asked:
→ Name it and ask permission before taking it.

If something is genuinely unclear:
→ Stop. Name what's unclear. Do not infer forward.

See references/assumption-protocol.md for decision tree.

---

## Principle 2: Minimal Scope — No speculative features

Write the minimum code that solves the stated problem.

**Forbidden without explicit request:**
- Abstractions for single-use code
- Future-proofing
- Unrequested performance optimization
- Refactoring of unrelated code
- New patterns or conventions beyond the task

**Test**: can every changed line be traced back to the user's explicit request?
If not, remove it or ask first.

**Unrelated issues**: noticed bugs or tech debt outside scope:
→ Log to .ohc/notepad.md under "## Noticed (not in scope)"
→ Do NOT fix. Do NOT expand scope silently.

See references/scope-guard.md. Run scripts/scope-check.sh after each task.

---

## Principle 3: Surgical Changes — Clean diffs

**Remove only what YOUR changes made unused.**
Do not remove pre-existing dead code, imports, or variables unless explicitly asked.

**Small, logical commits:**
- Each commit = one logical change
- Message explains WHY, not just WHAT
- Use structured trailer format from CLAUDE.md

**The diff test**: would a reviewer understand every changed line from the commit
message alone? If not: split the commit or improve the message.

See references/surgical-change.md for examples.

---

## Principle 4: Goal-Driven Execution — Define success first

Before writing any code, state the success criterion:
```
Success: [specific, verifiable statement]
```

**Invalid** (not verifiable):
- "Tests pass" — which tests? how many?
- "The feature works" — how do you know?

**Valid** (verifiable):
- "All 23 auth.test.ts cases pass with 0 skips, coverage ≥80%"
- "curl localhost:3000/api/health returns 200 with {status:'ok'}"

Loop: write → test → read output → fix → test again.
Never claim done without reading the verification output yourself.

See references/success-criteria.md for templates by task type.

---

## OHC Extension 1: Workflow Gate

For tasks estimated at >30 minutes:
1. Confirm a plan exists in .ohc/plans/
2. If no plan: run the PLAN workflow first
3. Do NOT write code without an approved plan for large tasks

---

## OHC Extension 2: Team Handoff Discipline

When finishing any work session:
1. Update .ohc/notepad.md (see collaborator agent for format)
2. Write for your teammate, not yourself
3. Include: what done, what wasn't, blockers, gotchas, next steps
4. Commit: `chore: update notepad for handoff`

---

## OHC Extension 3: Scope Verification

Before starting: read PROJECT.md conventions section.
After finishing: run `bash skills/ohc-coding-discipline/scripts/scope-check.sh`
Confirm output shows only files in the task scope.
