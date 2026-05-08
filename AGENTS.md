## Project guardrails (do not regress)

Unless the user explicitly asks to remove or replace specific paths, **do not delete or strip** tracked work under:

- `skills/` — first-class plugin skills and bundles (e.g. `skills/<name>/`, `skills/coding/`)
- `agents/` — agent definitions
- `commands/` — slash command sources (`commands/ohc-*.md`, etc.)
- `hooks/` — hook handlers and manifest JSON (`hooks/*.js`, `hooks/*.json`)
- `scripts/` — CLI, setup, team, utilities
- `templates/` — setup and platform templates

Treat refactors here as **surgical**: change only what the task requires. For cleanup, prefer deprecation notes or archiving with user approval—not silent deletion.
