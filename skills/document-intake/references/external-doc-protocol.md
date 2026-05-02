# External document intake protocol

## Text-first

Prefer markdown, plain text, or copy-paste excerpts. For **PDF**, **DOCX**, scanned images, or proprietary viewers: ask the user for an **extract** (export to `.md` / paste sections) before blocking. Do not pretend to parse opaque binaries without tools.

## Authoritative precedence

When two external docs disagree:

1. The user explicitly says which wins, or  
2. The **newer** dated doc wins after you surface the conflict.

Record the resolution in `.ohc/doc-sources.md` Notes and in the plan **Risks** if residual ambiguity remains.

## Reconciliation notes format

In the conversational handoff before the plan file, list:

```
CONFLICT: {source A ref} vs {source B ref} → resolution: {...}
GAP: requirement X has no codebase anchor (module?: unknown)
STALE: doc claims endpoint /v1/foo; code shows /v2/bar
```

## Section mapping for messy layouts

Infer equivalents when headings differ:

| Intent            | Typical headings                         |
|-------------------|------------------------------------------|
| Goal / problem    | Problem, Goal, JTBD, Summary             |
| Scope             | In scope / Out of scope, Non-goals       |
| Architecture      | HLD, System design, Components           |
| Data flow         | Sequences, Flows, Integrations           |
| API               | Contracts, Endpoints, OpenAPI            |
| Acceptance        | NFRs, Success metrics, Acceptance tests  |

## Traceability IDs

Ask the user for stable IDs if present (REQ-001, FEAT-12). Otherwise use **`DocName § heading`** as the canonical ref in the plan trace table.

## Security

Never copy secrets, tokens, credentials, or PII from specs into tracked files unless the user insists and the repo treats them as test fixtures — prefer env var placeholders.
