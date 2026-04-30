---
name: team
description: Spawn N parallel agent workers running a five-stage pipeline (plan→prd→exec→verify→fix→merge)
argument-hint: "N:provider \"task\" | status <id> | advance <id> | poll <id> | merge <id> | shutdown <id> [--force]"
---

# /team — Parallel Team Pipeline

Spawn N workers that run a **five-stage pipeline** internally:

```
team-plan → team-prd → team-exec → team-verify → team-fix → team-merge → done
```

The `team-fix` stage loops back to `team-verify` until failures clear or the
retry cap (3) is hit. Every transition is gated by evidence — the orchestrator
refuses to advance unless each worker has written `RESULT.json`.

## Quick Start
```
/team 1:executor "fix all TypeScript errors"
/team 2:codex    "review auth module for security issues"
/team 1:gemini   "redesign the onboarding flow"
```

## Providers
| Provider | Backend | Best For |
|----------|---------|----------|
| executor | Claude Code Task() | Code implementation, TDD |
| claude   | Claude Code Task() | General tasks |
| codex    | tmux pane (Codex CLI) | Code review, security analysis |
| gemini   | tmux pane (Gemini CLI) | UI/UX, docs, large-context tasks |

## CLI Commands
```
ohc team N:provider "task"    — spawn team (starts at team-exec)
ohc team status <team-id>     — show worker state + RESULT.json summary
ohc team advance <team-id>    — drive one pipeline step (exec → verify → …)
ohc team poll <team-id>       — check tmux worker exit sentinels
ohc team merge <team-id>      — merge worker branches back to current branch
ohc team shutdown <team-id>   — remove worktrees (refuses dirty without --force)
ohc team list                 — list all active teams
```

## Worker Contract
Every worker MUST produce two files before exit:

1. **Per-worker notes** — `.ohc/state/team/<id>/workers/<name>/notes.md`
2. **RESULT.json** — `.ohc/state/team/<id>/workers/<name>/RESULT.json`
   ```json
   { "status": "success|blocked|failed", "tests": {...}, "files_changed": [...], "notes": "..." }
   ```

## State files
```
.ohc/state/team/<id>/state.json
.ohc/state/team/<id>/workers/<name>/RESULT.json
```
