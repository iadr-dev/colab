---
name: writing-plans
description: >
  Transform a goal into a precise executable task list saved to .ohc/plans/.
  Run before any task >30 minutes. Includes deep interview, approach selection,
  task decomposition with success criteria. Triggers on keyword "plan".
allowed-tools: Read Write
---

# Writing Plans

Run before building anything estimated at >30 minutes.

## Externally maintained specifications
If PRDs, RFCs, or other authoritative docs live outside oh-my-colab conventions, run **`document-intake`** first so `.ohc/doc-sources.md` and reconciliation are settled. Shorten Step 1 to **unanswered questions, document↔repository conflicts, and ambiguous acceptance**. Always include **Sources** and **Traceability** (`assets/plan-template.md`).

## Step 1: Deep Interview (3–5 questions max)

Clarify before designing:
1. **What is done?** — the specific verifiable end state
2. **What is NOT in scope?** — explicit boundaries prevent scope creep
3. **What are the constraints?** — performance, compatibility, deadline
4. **Are there existing patterns?** — check PROJECT.md conventions
5. **What could go wrong?** — risks to address upfront

Use `.ohc/PROJECT.md` as the primary project context. Also use optional domain
docs (`CONTEXT.md` / `CONTEXT-MAP.md`) when present. If the plan creates a
durable architectural decision, record whether an ADR is needed.

## Step 2: Approach Selection

Propose 2-3 approaches with tradeoffs. Get user confirmation on approach before
writing the full plan. See brainstorming skill for format.

## Step 3: Task Decomposition Rules

Each task must be:
- **≤2 hours** — if longer, split it
- **Single responsibility** — one logical change
- **Independently verifiable** — has its own success criterion
- **Clear file scope** — lists which files will change
- **Agent-assigned** — specifies which agent does it

## Step 4: Write and Save

Save to: `.ohc/plans/{kebab-case-name}.md`
Use template from assets/plan-template.md.

## Step 5: Gate

**Do NOT proceed to BUILD without explicit user confirmation.**
"Plan ready. Does this look right? Reply 'go' to start building."

See references/plan-template.md for canonical format.
See references/task-decomposition.md for splitting rules.
See references/domain-docs.md for glossary and ADR-aware planning.
