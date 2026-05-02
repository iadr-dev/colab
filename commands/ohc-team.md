---
name: ohc-team
description: Spawn N parallel agent workers that run an internal five-stage pipeline (plan → prd → exec → verify → fix → merge). Usage: /ohc-team N:provider "task".
argument-hint: "N:provider \"task\" | status <id> | advance <id> | poll <id> | merge <id> | shutdown <id> [--force]"
---

# /ohc-team — Parallel Team Pipeline

Spawn N workers that run a **five-stage pipeline** internally:

```
team-plan → team-prd → team-exec → team-verify → team-fix → team-merge → done
```

The `team-fix` stage loops back to `team-verify` until failures clear or the
retry cap (3) is hit. Every transition is gated by evidence — the orchestrator
refuses to advance unless each worker has written `RESULT.json`.

## Quick Start
```
/ohc-team 1:executor "fix all TypeScript errors"
/ohc-team 2:codex    "review auth module for security issues"
/ohc-team 1:gemini   "redesign the onboarding flow"
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
   Freeform markdown. Do **not** append to shared `.ohc/notepad.md` — concurrent
   appends race and lose writes. The orchestrator merges per-worker notes into
   notepad at `team-merge`.

2. **RESULT.json** — `.ohc/state/team/<id>/workers/<name>/RESULT.json`
   ```json
   {
     "status": "success" | "blocked" | "failed",
     "tests":  { "passed": 12, "failed": 0, "skipped": 1 } | null,
     "files_changed": ["src/auth.ts", "tests/auth.test.ts"],
     "artifacts": [".ohc/plans/auth.md"],
     "notes": "one-line summary",
     "completedAt": "2026-04-29T12:00:00Z"
   }
   ```
   The orchestrator reads this at the `team-exec → team-verify` gate.
   Missing RESULT.json = stage cannot advance.

## Worktrees + research cache
- Each worker runs in `.ohc/team/<id>/worktrees/<name>/` on branch `ohc/<id>-<name>`.
- `.ohc/research/` is symlinked into each worktree so all workers share the
  cross-session research cache (no duplicate Context7 fetches).
- Dirty worktrees block shutdown without `--force`.

## State files
```
.ohc/state/team/<id>/state.json            — team metadata (stage, provider, n)
.ohc/state/team/<id>/events.jsonl          — append-only event log
.ohc/state/team/<id>/workers/<name>/       — per-worker state
  started.json                             — dispatch record
  completed.json                           — subagent completion marker
  notes.md                                 — per-worker freeform notes
  RESULT.json                              — structured completion payload
  tmux-exit                                — exit code sentinel (tmux only)
.ohc/state/team/<id>/handoffs/             — stage transition records
```

## Typical flow
```bash
/ohc-team 2:executor "implement the 3 tasks in .ohc/plans/auth-feature.md"
# … workers run in parallel, each writes RESULT.json when done …
ohc team status <id>          # confirm all workers succeeded
ohc team advance <id>         # team-exec → team-verify
ohc team advance <id>         # team-verify → team-merge (or → team-fix if failures)
ohc team merge <id>           # merges worker branches, stops on conflict
ohc team shutdown <id>        # removes worktrees
```
