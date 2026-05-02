---
name: ohc-autopilot
description: Chain PLAN + BUILD + REVIEW automatically. Pauses at plan for human OK.
---

# /ohc-autopilot — Full Chain

Usage: /ohc-autopilot [describe what you want to build]

Steps:
1. Run PLAN workflow → write plan to .ohc/plans/
2. PAUSE: show plan to user, await "go" confirmation
3. Run BUILD workflow — subagents + TDD
4. Run REVIEW workflow — spec compliance + quality
5. If REVIEW passes: prompt user for /ohc-ship
6. If REVIEW has ✗ items: run BUILD again to fix, then re-review

"autopilot no-gate": skips plan confirmation (use carefully)
