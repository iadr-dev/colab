---
name: ohc-explore
description: EXPLORE workflow: read codebase, populate PROJECT.md with stack, conventions, gotchas
---

# /ohc-explore — EXPLORE Workflow

Systematically understand this codebase or a specific area.

Usage:
  /ohc-explore             — full codebase
  /ohc-explore src/auth    — focus on specific path

Steps:
1. Read files in exploration order (see skills/explore-codebase/SKILL.md)
2. Run: python3 skills/explore-codebase/scripts/generate-project-map.py
3. Populate or update .ohc/PROJECT.md
4. Report: "Exploration complete. Key findings: [top 3]"
