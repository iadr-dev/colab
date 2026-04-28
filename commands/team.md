---
description: Spawn N parallel agents: /team N:provider task. Max 8. Providers: claude|codex|gemini
---

# /team — Spawn Parallel Agents

Usage: /team N:provider "task description"

Examples:
  /team 3:executor "implement 3 tasks in .ohc/plans/auth-feature.md"
  /team 2:claude "review security in src/auth and src/payments"

Providers: executor | claude | codex | gemini
Max: 8 parallel agents

What happens:
1. Creates N git worktrees (.git/worktrees/ohc-task-N)
2. Dispatches task spec to each agent
3. Each works independently in their worktree
4. Results collected and merged
5. Verifier runs on merged result
