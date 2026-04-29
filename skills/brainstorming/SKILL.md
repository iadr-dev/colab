---
name: brainstorming
description: >
  Structured ideation before committing to a design. Socratic questioning to
  surface hidden requirements and constraints. Produces 2-3 concrete approaches
  with explicit tradeoffs. Runs at the start of the PLAN workflow.
allowed-tools: Read
---

# Brainstorming

Run before writing-plans. Goal: surface the right approach before committing to it.

## Phase 1: Socratic Questioning (max 5 questions)

Ask questions that reveal hidden requirements or constraints:
- "What happens when [edge case]?"
- "What's the most important constraint — speed, reliability, or simplicity?"
- "What would make this solution a failure?"
- "Is there an existing pattern in the codebase we should follow?"
- "Who is the user and what do they actually need?"

If the user uses project-specific terms, check `.ohc/PROJECT.md` first. Also
read optional domain docs (`CONTEXT.md` / `CONTEXT-MAP.md`) when present.
Sharpen overloaded terms before designing.

Stop when you understand the problem well enough to design for it.

## Phase 2: Idea Expansion

Generate 3 approaches. Go broad first — don't self-censor.
Include at least one "boring but reliable" and one "creative but risky" approach.

```
## Approach A: [Name] — [simple/fast/scalable/etc]
Description: [2 sentences]
Pros: [2-3 bullets]
Cons: [2-3 bullets]
Best when: [conditions]
Estimate: Xh

## Approach B: [Name]
...

## Recommendation: [A/B/C]
[2-3 sentences explaining why this fits the current situation]
```

## Phase 3: Confirmation

Present to user. Get explicit confirmation before moving to writing-plans.
"Does this match what you were thinking? Any constraints I'm missing?"

See references/brainstorm-formats.md for alternative formats.
See references/domain-docs.md for glossary and ADR-aware brainstorming.
