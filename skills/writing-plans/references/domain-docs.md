# Domain Docs in Plans

Plans should use the project's own language so future agents can connect the
task list to the code and product model.

## Read before planning

- **`document-intake`** when the team’s truth lives in **external** specs (paths, URLs); own formats stay as-is — only `.ohc/doc-sources.md` + traced plan mirror execution needs.
- `.ohc/PROJECT.md` for the primary OHC project memory: stack, conventions,
  architecture notes, and known gotchas.
- `CONTEXT.md` for optional domain terms in single-context repos.
- `CONTEXT-MAP.md` for optional multi-context domain maps.
- `docs/adr/` for optional/lazy-created durable architecture decisions.

## Use the glossary

Name tasks and success criteria with glossary terms. Avoid inventing new names
for existing concepts. If the user introduces a term that conflicts with the
glossary, clarify it before writing tasks.

If no `CONTEXT.md` or `CONTEXT-MAP.md` exists, use `.ohc/PROJECT.md` and the
codebase itself. Do not block planning on creating separate domain docs.

## ADR gate

Record a decision as an ADR only when all are true:

1. It is hard to reverse.
2. A future reader would find it surprising without context.
3. Real alternatives existed and one was chosen for a reason.

Skip ADRs for obvious choices, temporary decisions, and easy-to-change details.
Create `docs/adr/` only when the first ADR is actually needed.

## Vertical task shape

Prefer tracer-bullet tasks: a narrow, complete behavior path that can be demoed
or verified on its own. Avoid purely horizontal tasks like "schema only" or "UI
only" unless the task is a deliberate preparatory slice with its own success
criterion.
