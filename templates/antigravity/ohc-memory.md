---
trigger: always_on
---

# Memory Capture Rules

## After Every Significant Task
Update .ohc/notepad.md with:
- What was completed (check off plan items)
- What was NOT completed and why
- What the next developer needs to know before continuing
- Any blockers discovered

## Project Gotchas
When discovering unexpected behavior or workarounds:
Append to .ohc/PROJECT.md Known Gotchas:
`- [YYYY-MM-DD] <description> → WORKAROUND: <solution>`

## Draft Skills
When a novel, reusable pattern emerges:
Write to .ohc/skills/<pattern-name>.md (under 100 lines).
RETRO will review and promote if valid via `ohc skill promote <n>`.

## Research Cache (cross-session)
Context7/Brave/GitHub doc fetches persist to .ohc/research/<library>--<topic>.md.
- Lookup before fetching: `require('./scripts/research').lookup(lib, topic)`.
- On fetch: `research.save({library, topic, payload, source, version})`.
- After code built on that research lands: `ohc research verify <library> <topic> <commit-sha>`.
- Default TTL 30d; stale entries are pruned at session end.

## Team Artifacts (parallel workers)
When running as a `/ohc-team` worker, DO NOT append to .ohc/notepad.md directly —
concurrent writes race. Instead:
- Per-worker notes: .ohc/state/team/<id>/workers/<name>/notes.md
- Structured result: .ohc/state/team/<id>/workers/<name>/RESULT.json
  `{status, tests:{passed,failed,skipped}, files_changed, artifacts, notes, completedAt}`
The orchestrator blocks team-exec → team-verify until every worker has RESULT.json.

## Cross-Session
The agent reads .ohc/notepad.md at session start.
Write it for your teammate, not yourself. Plain language, no jargon.
