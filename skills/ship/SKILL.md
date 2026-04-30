---
name: ship
description: SHIP workflow — pre-merge check → changelog → PR description → clean worktrees
---

# /ship — SHIP Workflow

Steps:
1. Run: bash skills/finishing-a-branch/scripts/pre-merge-check.sh
   - No debug code, tests pass
   - If fails: fix, re-run, do not proceed
2. Write changelog entry (writer agent)
3. Write PR description (writer agent)
4. Clean up worktrees: git worktree list | grep ohc/
5. Final test run on branch tip
