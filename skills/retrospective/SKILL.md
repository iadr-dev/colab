---
name: retrospective
description: >
  Post-session learning loop. Compares plan vs actual, extracts novel patterns,
  updates USER.md and PROJECT.md, promotes draft skills. Run after any session
  >30 minutes. Triggers on keyword "retro" or auto-suggested by on-stop hook.
allowed-tools: Read Write Bash
---

# Retrospective

The learning loop that prevents the goldfish brain.
Run after significant sessions. Takes 5-10 minutes. Pays off every future session.

## Step 1: Session Diff
```bash
python3 skills/retrospective/scripts/extract-patterns.py
```
Answer:
- What was planned? (from .ohc/plans/)
- What actually happened? (from session log)
- What took longer than expected, and why?
- What was skipped, and why?
- What was added that wasn't planned?

## Step 2: Extract Patterns

For each thing that went differently than planned:
"Is this a one-off, or would this happen again in a similar situation?"

If it would happen again → capture it.

**Good patterns to capture:**
- A debugging technique that worked well
- A library API that was confusing (with correct usage)
- A project-specific quirk (e.g., "auth service returns both 401 and 403 for expired tokens")
- A workflow improvement ("next time, check X before starting Y")

## Step 3: Update Memory Files

**Update .ohc/PROJECT.md** if:
- A project gotcha was discovered
- The architecture understanding changed
- A new convention was identified

Format: `- [YYYY-MM-DD] {description} → WORKAROUND: {solution}`

**Update ~/.ohc/USER.md** if:
- A personal workflow preference emerged
- A strength or weakness pattern appeared

## Step 4: Write Draft Skills

For each novel reusable pattern:
1. Write to `.ohc/skills/{kebab-name}.md`
2. Keep under 100 lines — just the pattern and when to use it
3. Stays in .ohc/skills/ until promoted:
   ```bash
   ohc skill promote {name}
   ```

## Step 5: Cursor Users — Generate Rules
If session revealed Cursor-specific learnings:
→ Use `/Generate Cursor Rules` to create permanent .mdc rules

## Step 6: Summarize
Write 3-sentence summary to .ohc/state/sessions/{id}/summary.md:
1. What was accomplished
2. What was learned
3. Recommended next action

See references/retro-template.md for structured format.
