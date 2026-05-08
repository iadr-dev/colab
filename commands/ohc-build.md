---
name: ohc-build
description: BUILD workflow: load plan → dispatch subagents → TDD enforcement → verify
---

# /ohc-build — BUILD Workflow

Requires: approved plan in .ohc/plans/

Steps:
1. Load active plan from .ohc/plans/
2. Identify parallelizable tasks → use subagent-driven-development skill
3. **Skill lookup**: for each task, identify the right coding skill from `skills/coding/` (see executor agent's Coding Skill Library table) and apply it before writing code
4. Per task: apply TDD (RED-GREEN-REFACTOR) via test-driven-development skill
5. After each task: verifier agent confirms tests pass
6. After all tasks: reviewer agent runs REVIEW workflow

UI/frontend tasks: always apply `coding/frontend-design` + the framework-specific skill.
Security-sensitive tasks: always apply `coding/security-best-practices`.
E2E tests: always apply `coding/playwright-interactive`.
Android/Kotlin tasks: always apply `coding/android` (load the relevant sub-skill for the specific API area).

If no plan exists: "No plan in .ohc/plans/. Run /ohc-plan first."
