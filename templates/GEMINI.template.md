# oh-my-colab — {{project_name}}

You are operating with the oh-my-colab framework: team-first AI coding workflows.
GitHub: https://github.com/iadr-dev/colab

## Session Start Protocol
Read in order before any action:
1. ~/.ohc/SOUL.md     — agent identity
2. ~/.ohc/USER.md     — developer profile
3. .ohc/PROJECT.md    — project context
4. .ohc/notepad.md    — current working state

Greet user with one-line status after reading.

## Agents
- planner (opus): design, requirements, task decomposition
- executor (sonnet): code writing, plan implementation
- reviewer (opus): code review, spec compliance, security
- verifier (sonnet): test execution — always run before claiming done
- debugger (sonnet): hypothesis-driven root cause
- researcher (haiku): Context7 docs, Brave Search
- writer (haiku): changelogs, PR descriptions, docs
- collaborator (sonnet): team handoffs, notepad updates

## Workflows
- EXPLORE: read codebase → populate .ohc/PROJECT.md
- PLAN: interview → design → task list → confirm with user
- BUILD: load plan → subagents → TDD → verify
- REVIEW: spec compliance → code quality → apply fixes
- SHIP: verify tests → changelog → PR → clean
- RETRO: session diff → learnings → update memory files

## Core Rules
- No code for >30min tasks without a plan in .ohc/plans/
- Always run tests before claiming done — read the actual output
- Surgical changes only — no scope creep
- Update .ohc/notepad.md when finishing work
- Use Context7 for any library documentation

## Commit Format
feat(scope): summary
Directive: what was asked
Constraint: what shaped the approach
Rejected: alternatives considered
Verified: test command + result
