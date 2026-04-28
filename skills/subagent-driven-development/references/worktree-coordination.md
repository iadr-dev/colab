# Worktree Coordination — Preventing Conflicts

## File Ownership Rule
Each parallel task owns unique files. Two tasks touching the same file = sequential, not parallel.

## Safe Shared Files (read-only across agents)
- README.md, package.json, tsconfig.json

## Merge Strategy
1. Schema/migration branches first
2. Type definition branches
3. Implementation branches
4. Test branches

## Conflict Resolution
If conflict occurs: accept one side entirely, apply other side on top manually, run tests.

## Cleanup
```bash
git worktree list | grep ohc/ | awk '{print $1}' | xargs -I{} git worktree remove {}
git branch | grep ohc/ | xargs git branch -d
```
