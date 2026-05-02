---
name: ralph
description: >
  PRD-loop persistence mode: iterate BUILD until verifier passes or max blocked attempts.
  Triggers ralph keep going keywords and /ohc-ralph. Deactivate via stop ralph.
allowed-tools: Read Write Bash
---

# Ralph persistence

Operate with **`scripts/ralph.js`** and session state files.

## Lifecycle

1. **Activate** via keyword `"ralph"`, `"keep going"`, or `/ohc-ralph`. On first run without an active PRD, the script initializes `.ohc/state/sessions/<id>/prd.json` from the current task narrative.
2. **Loop** — execute BUILD iteration; verifier runs tests; persist `RESULT`-style narrative in worker notes where applicable.
3. **Advance** — on success mark story done and move to next `prd.stories[]` entry; on repeated block update `attempt_count`; hard-stop after `stopOnBlocked` (keyword-map default **3**).
4. **Deactivate** — user says `"stop ralph"` or `"ralph stop"` (clears active skill flag in `.ohc/state/active-skills.json`).

## State files

- `.ohc/state/ralph-state.json` — active session id, story index, iteration counters
- `.ohc/state/sessions/<id>/prd.json` — `{ goal, stories:[{title,status,attempt_count}], ... }` per `scripts/ralph.js`

## Guardrails

- Do not claim DONE without verifier-aligned evidence.
- If stories are ambiguous, widen them only after syncing with **`writing-plans`** or user OK.
