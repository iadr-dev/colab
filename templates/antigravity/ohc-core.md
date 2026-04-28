---
trigger: always_on
---

# oh-my-colab Core Rules

## Session Start
Read .ohc/notepad.md for current working state.
Read .ohc/PROJECT.md for project context and conventions.
Greet user: one-line status — current task + branch + plan progress.

## Workflow Routing
- "explore"   → EXPLORE: read codebase, populate .ohc/PROJECT.md
- "plan this" → PLAN: interview → design → .ohc/plans/ → confirm before build
- "build"     → BUILD: load plan → subagents → TDD → verify
- "review"    → REVIEW: spec compliance first, code quality second
- "ship it"   → SHIP: pre-merge check → changelog → PR description → clean
- "retro"     → RETRO: session diff → learnings → update memory files
- "autopilot" → PLAN + BUILD + REVIEW, pause at plan for human OK

## Core Rules
- Never write code for tasks >30 minutes without an approved plan in .ohc/plans/
- Always run tests before claiming done — read actual output, count passes
- Stay within agreed scope — spotted issues go to .ohc/notepad.md, not fixes
- Use Context7 for all external library documentation — no guessing API signatures
- Update .ohc/notepad.md when finishing work (for team handoff)

## Memory Protocol
- After significant work: update .ohc/notepad.md
- New gotcha: append to .ohc/PROJECT.md Known Gotchas
- Novel pattern: write draft to .ohc/skills/ for RETRO
