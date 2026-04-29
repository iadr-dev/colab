---
name: ralph
description: >
  Activate the ralph persistence loop. Use when you want to keep iterating
  BUILD → VERIFY → FIX until the goal is met or you're blocked N times.
  Ralph is PRD-driven: it writes a product requirement document, works stories
  one at a time, and picks up exactly where it left off after any Stop.
  Trigger: "ralph", "/ralph", "ralph mode", "keep going until done".
allowed-tools: Read Write Edit MultiEdit Bash Task
---

# Ralph — Persistence Loop Protocol

## What Ralph Does
Ralph is a PRD-driven build loop that keeps going until every story in the PRD is green.
It is not an infinite loop — it has a `max_iterations` ceiling per story and a `stop_on_blocked` gate.

```
ACTIVATE ralph
  ↓
Does .ohc/state/ralph-state.json exist?
  YES → resume from saved state
  NO  → write PRD, initialize state
  ↓
LOOP:
  1. Read current story from PRD
  2. Executor builds story
  3. Verifier checks (run tests)
  4. If PASS → mark story complete, advance to next
  5. If FAIL → increment attempt_count
     - If attempt_count < stop_on_blocked → retry with fix
     - If attempt_count >= stop_on_blocked → PAUSE, report to human
  6. If all stories complete → deactivate ralph, run /retro
```

## Activation
Say "ralph mode", "/ralph", or "ralph: [task description]"

If a task description is provided, ralph writes the PRD from it.
If no description, ralph resumes the active PRD.

## State File (managed by scripts/ralph.js)
`.ohc/state/ralph-state.json`:
```json
{
  "active": true,
  "prd_path": ".ohc/state/sessions/<id>/prd.json",
  "current_story": 0,
  "total_stories": 3,
  "attempt_count": 0,
  "max_iterations": 10,
  "stop_on_blocked": 3,
  "started_at": "ISO8601"
}
```

## PRD Format (`.ohc/state/sessions/<id>/prd.json`)
```json
{
  "goal": "description of what done looks like",
  "stories": [
    { "id": 1, "title": "...", "status": "pending|in_progress|done|blocked", "success_criterion": "..." }
  ]
}
```

## Stopping Ralph
- Say "stop ralph" or "ralph stop" — deactivates persistence mode
- Ralph auto-stops when all stories are complete
- Ralph auto-pauses when `stop_on_blocked` attempts fail on the same story

## Continuation After Stop
When a session ends with ralph active, `on-stop.js` injects:
> "Ralph is active. Continue iteration N+1 on story X."
The next session picks this up from session start context.

## Gotchas
- Ralph does not skip the verifier — it always runs tests before marking a story done
- Ralph does not expand scope silently — new stories require explicit user approval
- If you get stuck, say "stop ralph" and examine with the debugger agent first
