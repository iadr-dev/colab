---
name: skill
description: Manage skills — list installed skills, promote drafts, or scaffold new ones
argument-hint: "list | promote <name> | draft <name>"
---

# /skill — Manage Skills

Usage:
  /skill list              — list installed skills + .ohc/skills/ drafts
  /skill promote <name>    — promote draft to skills/ folder
  /skill draft <name>      — scaffold new skill with template

list output:
  Installed (skills/):
    ✓ ohc-coding-discipline
    ✓ explore-codebase
    ...
  Drafts (.ohc/skills/):
    📝 auth-service-quirks → ohc skill promote auth-service-quirks

promote: moves .ohc/skills/{name}.md → skills/{name}/SKILL.md
         creates references/ scripts/ assets/ subdirs
         warns if content >200 lines
