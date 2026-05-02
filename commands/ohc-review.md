---
name: ohc-review
description: REVIEW workflow: spec compliance (pass 1) then code quality (pass 2)
---

# /ohc-review — REVIEW Workflow

Usage:
  /ohc-review            — review current branch diff
  /ohc-review src/auth   — review specific file or directory

Steps:
1. Pass 1: spec compliance — compare against .ohc/plans/ success criteria
2. Pass 2: code quality — naming, complexity, tests, security
3. Output structured ✓/⚠/✗ report
4. ✗ blocking items → hand to executor with fix instructions
5. Clean → hand to writer for changelog + PR description

Severity:
  ✗ Blocking — must fix before ship
  ⚠ Suggested — should fix
  💡 Optional — consider
