# Domain map — bounded contexts (`CONTEXT-MAP.md`)

Optional for multi-boundary repos. Helps agents resolve overloaded names.

## Diagram

Redraw in your toolchain (Mermaid/Figma). Relationships only — not full architecture.

Example Mermaid snippet:

```
flowchart LR
  Billing_ctx[Billing_Context]
  Auth_ctx[Auth_Context]
```

## Contexts

| Context | Responsibility | Canonical paths |
|---------|----------------|-----------------|
| _Billing_ | Invoicing | apps/billing/ |

## Relationships

| From | Relation | To | Notes |
|------|----------|-----|-------|
| Orders | aggregates | Billing | Settlement batches |
