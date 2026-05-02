---
name: document-intake
description: >
  Normalize user-provided specs in any format into .ohc/doc-sources.md plus a
  traced plan. Triggers: from my docs, existing spec, external spec, /ohc-document-intake.
allowed-tools: Read Write
---

# Document Intake — externally authored specifications

Use when stakeholders reference PRDs, RFCs, diagrams, or wiki exports in whichever structure they already use. **Do not** require re-hosting copy in oh-my-colab formats unless the team asks for it; register sources and derive an executable plan under `.ohc/`.

## Steps

1. **Inventory** — List every path, URL, or paste block the user gives. Assign each a **role**: `product`, `architecture`, `api`, `data_flow`, `design`, `testing`, `security`, `unknown`.
2. **Read** — Load `.ohc/PROJECT.md` first. Read cited sources (text-first; see references for binary limits).
3. **Reconcile** — Compare claims to the repo: note **conflicts**, **stale** sections, **missing** code for specified behavior. Do not hide gaps.
4. **Internal notes (ephemeral)** — Draft bullets: goal, out of scope, constraints, acceptance signals, APIs, data flow. Use for the plan only; do not duplicate entire foreign specs into repo files.
5. **Write `.ohc/doc-sources.md`** — Merge with `assets/doc-sources.template.md`: table columns Path or URL | Role | Version or date | Notes. Single index for this initiative; update in place on later intakes.
6. **Handoff to writing-plans** — Narrow Step 1 of writing-plans to **unresolved questions and conflicts** only. Produce `.ohc/plans/{kebab}.md` using the plan template (**Sources**, **Traceability** table: source ref → task).
7. **Gate** — Same as writing-plans: no BUILD until user confirms the plan.

See `references/external-doc-protocol.md` for edge cases and reconciliation format.
