---
name: subagent-driven-development
description: >
  Dispatch multiple specialized subagents to work in parallel on independent tasks
  using git worktrees to prevent conflicts. Use when a plan has 3+ independent tasks
  or total work >2h. Triggers when BUILD workflow runs a multi-task plan.
allowed-tools: Read Write Bash
---

# Subagent-Driven Development

Use when: plan has multiple independent tasks that can be parallelized.

## When to Dispatch vs Do Inline

**Dispatch when:**
- Tasks touch different files (no conflicts possible)
- Tasks are independent (B doesn't depend on A's output)
- Each task is >30min
- 3+ tasks total in the plan

**Do inline when:**
- Tasks are sequential (B needs A's output)
- Tasks are <30min each
- Tasks share files (git conflicts)
- Only 1-2 tasks total

## Dispatch Protocol

### 1. Prepare worktrees
```bash
git worktree add .git/worktrees/ohc-task-1 -b ohc/task-1
git worktree add .git/worktrees/ohc-task-2 -b ohc/task-2
```

### 2. Write task spec per subagent
Save to `.ohc/state/dispatch-{id}.json`:
```json
{
  "task": "Task name from plan",
  "agent": "executor",
  "worktree": ".git/worktrees/ohc-task-1",
  "files": ["src/auth.ts", "tests/auth.test.ts"],
  "success_criterion": "All auth tests pass",
  "plan_ref": ".ohc/plans/auth-feature.md#task-1"
}
```

### 3. Launch
```bash
ohc team 3:claude "implement tasks from .ohc/state/dispatch-*.json"
```
Or: `/team 3:executor` in Claude Code with task specs attached.

### 4. Merge results
```bash
git merge ohc/task-1 ohc/task-2 ohc/task-3
```
Run verifier on merged result.

### 5. Cleanup
```bash
git worktree remove .git/worktrees/ohc-task-1
git branch -d ohc/task-1
```

See references/dispatch-patterns.md for when to dispatch.
See references/worktree-coordination.md for conflict prevention.
