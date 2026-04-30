---
name: build
description: BUILD workflow — load plan → dispatch subagents → TDD enforcement → verify
---

# /build — BUILD Workflow

Requires: approved plan in .ohc/plans/

Steps:
1. Load active plan from .ohc/plans/
2. Identify parallelizable tasks → use subagent-driven-development skill
3. Per task: apply TDD (RED-GREEN-REFACTOR) via test-driven-development skill
4. After each task: verifier agent confirms tests pass
5. After all tasks: reviewer agent runs REVIEW workflow

If no plan exists: "No plan in .ohc/plans/. Run /plan first."
