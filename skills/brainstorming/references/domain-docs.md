# Domain Docs in Brainstorming

Use domain docs to reduce ambiguity before design hardens.

## What to read

- `.ohc/PROJECT.md`: primary OHC project memory for stack, conventions,
  architecture notes, and gotchas.
- `CONTEXT.md`: optional shared domain language for a single-context repo.
- `CONTEXT-MAP.md`: optional map for multiple domain contexts, each with its
  own `CONTEXT.md`.
- `docs/adr/`: optional/lazy-created records for hard-to-reverse decisions.

## During questioning

When a user uses vague or overloaded terms, propose one canonical term:

```text
You said "account." Do you mean Customer, User, or Organization? Those imply
different ownership and permission rules.
```

When a term conflicts with the glossary, surface it:

```text
`CONTEXT.md` defines Cancellation as order-level only, but this plan mentions
partial cancellation. Is that a new capability or different wording?
```

When code can answer a question, inspect the code instead of asking the user.

If only `.ohc/PROJECT.md` exists, use its conventions and architecture summary;
do not assume a separate domain glossary exists.

## Updating docs

Only update domain docs when the term is genuinely domain-specific. Do not add
general engineering concepts like "timeout" or "error handler."

Add or refine:

- one-sentence term definitions
- aliases to avoid
- relationships between terms
- resolved ambiguities

Offer an ADR only when the decision is hard to reverse, surprising without
context, and the result of a real tradeoff. Create `docs/adr/` only when the
first ADR is actually needed.
