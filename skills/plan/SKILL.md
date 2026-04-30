---
name: plan
description: PLAN workflow — interview → brainstorm → write task plan to .ohc/plans/
argument-hint: "[task description]"
---

# /plan — PLAN Workflow

Usage: /plan [describe what you want to build]

Steps:
1. Run brainstorming skill — clarifying questions (max 5)
2. Present 2-3 approaches with tradeoffs
3. Await user confirmation on approach
4. Write plan to .ohc/plans/{kebab-name}.md
5. Show plan to user — await explicit "go" before BUILD

Do NOT start building until user confirms the plan.
