---
trigger: always_on
---

# oh-my-colab Core Rules

## Session Start
Read .ohc/notepad.md for current working state.
Read .ohc/PROJECT.md for project context and conventions.
If the repo root has **CONTEXT.md** or **CONTEXT-MAP.md** (optional glossary from `ohc setup`), skim them for domain terms before deep work.
Greet user: one-line status — current task + branch + plan progress.

## Workflow Routing
Authoritative triggers also live in **`hooks/keyword-map.json`** (picked up by hooks on Claude; use the same phrases here).

- "explore"   → EXPLORE: read codebase, populate .ohc/PROJECT.md
- "plan this", "design this", "write a plan" … → PLAN: interview → design → .ohc/plans/ → confirm before build
- "build" / "implement" → BUILD: load plan → subagents → TDD → verify
- "review" … → REVIEW: spec compliance first, code quality second
- "ship" / "ship it" / "finish branch" → SHIP: pre-merge check → changelog → PR description → clean
- "retro" → RETRO: session diff → learnings → update memory files
- "autopilot" → PLAN + BUILD + REVIEW, pause at plan for human OK (unless "full auto")
- "ralph", `/ohc-ralph`, "keep going" → BUILD persistence until tests pass / blocked — see **`skills/ralph`**
- "from my docs" / "existing spec" / "document intake", `/ohc-document-intake` → DOCUMENT INTAKE (`skills/document-intake`)
- "caveman mode" / "compressed mode" (and exit phrases in keyword-map) → **`skills/caveman`**
- "team"      → /ohc-team N:provider "task" — parallel workers, RESULT.json gate
- "research"  → /ohc-research — cross-session `.ohc/research/` cache (lookup before fetching)

## Core Rules
- Never write code for tasks >30 minutes without an approved plan in .ohc/plans/
- Always run tests before claiming done — read actual output, count passes
- Stay within agreed scope — spotted issues go to .ohc/notepad.md, not fixes
- Use Context7 for all external library docs. Check .ohc/research/ cache FIRST;
  only fetch on miss, then save back so future sessions reuse it.
- Update .ohc/notepad.md when finishing work (for team handoff)
- Run **`ohc doctor`** for a quick sanity check (.ohc, hooks, Cursor rules hints when configured)

## Memory Protocol
- After significant work: update .ohc/notepad.md
- New gotcha: append to .ohc/PROJECT.md Known Gotchas
- Novel pattern: write draft to .ohc/skills/ for RETRO
