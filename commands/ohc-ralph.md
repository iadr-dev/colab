---
name: ohc-ralph
description: Activate ralph persistence mode — keep iterating until the task is done or max iterations reached
argument-hint: "[task description or leave blank to resume active PRD]"
---

# /ohc-ralph — Persistence Mode

Activate ralph: a PRD-driven persistence loop that keeps going until the goal is met or you're blocked N times in a row.

## What it does
1. If no active PRD exists, writes `.ohc/state/sessions/<id>/prd.json` from the current task description
2. Executes iteration N of the build loop
3. Runs the verifier after each iteration
4. If tests pass → marks PRD story complete, advances to next story
5. If blocked after `stopOnBlocked` attempts → pauses and reports to you
6. After Stop/resume: picks up exactly where it left off

## To stop early
Say "stop ralph" or "ralph stop" — this deactivates the persistence mode.

## State files
- `.ohc/state/ralph-state.json` — active PRD, iteration count, stop threshold
- `.ohc/state/sessions/<id>/prd.json` — current PRD

## See also
- `skills/ralph/SKILL.md` — full protocol
