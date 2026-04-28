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

## Cross-Session
The agent reads .ohc/notepad.md at session start.
Write it for your teammate, not yourself. Plain language, no jargon.
