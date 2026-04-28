---
description: EXPLORE workflow: read codebase, populate PROJECT.md with stack, conventions, gotchas
---

# /explore — EXPLORE Workflow

Systematically understand this codebase or a specific area.

Usage:
  /explore             — full codebase
  /explore src/auth    — focus on specific path

Steps:
1. Read files in exploration order (see skills/explore-codebase/SKILL.md)
2. Run: python3 skills/explore-codebase/scripts/generate-project-map.py
3. Populate or update .ohc/PROJECT.md
4. Report: "Exploration complete. Key findings: [top 3]"
