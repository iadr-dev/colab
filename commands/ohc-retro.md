---
name: ohc-retro
description: RETRO workflow: session diff → extract patterns → update memory files → draft skills
---

# /ohc-retro — RETRO Workflow

Usage:
  /ohc-retro        — full retrospective
  /ohc-retro brief  — 3-sentence summary only

Steps:
1. Run: python3 skills/retrospective/scripts/extract-patterns.py
2. Compare plan (.ohc/plans/) vs actual (session log)
3. Identify novel reusable patterns
4. Update .ohc/PROJECT.md with new gotchas or conventions
5. Update ~/.ohc/USER.md with personal preferences discovered
6. Write draft skills to .ohc/skills/ for reusable patterns
7. Write 3-sentence summary to .ohc/state/sessions/{id}/summary.md

After retro: promote confirmed skills via `ohc skill promote {name}`
