---
description: Advisor: recommend which agent or model to use for a given task
---

# /ask — Agent Advisor

Usage: /ask [describe your task]

Output: "For [task]: use [agent] ([model]). Reason: ..."

Routing logic:
  design / architecture / ambiguous → planner (opus)
  writing code with clear spec → executor (sonnet)
  code review → reviewer (opus)
  test execution → verifier (sonnet)
  unexpected behavior / errors → debugger (sonnet)
  library docs / research → researcher (haiku)
  changelog / PR description → writer (haiku)
  team handoff / context → collaborator (sonnet)
