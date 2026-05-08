# Code Review Quick Checklist

## Spec Compliance (Pass 1 — first)

- [ ] All success criteria from `.ohc/plans/` are implemented
- [ ] All user requirements addressed
- [ ] No requirements partially implemented without documented reason
- [ ] No out-of-scope code added (or documented as intentional side effect)

## SOLID + Architecture (P1-P2)

- [ ] No module with multiple unrelated responsibilities (SRP)
- [ ] New behavior added by extension, not by editing core logic (OCP)
- [ ] Subclasses can substitute the parent without breaking callers (LSP)
- [ ] Interfaces are narrow — no unused methods on implementers (ISP)
- [ ] High-level logic does not import concrete I/O or infrastructure (DIP)
- [ ] No god objects, feature envy, shotgun surgery, or magic numbers

## Removal Candidates (P2-P3)

- [ ] No dead/unreachable code
- [ ] No feature-flagged-off code without a deletion plan
- [ ] No redundant logic or duplicated helpers
      → See `references/removal-plan.md` for template

## Security (P0 — Blocking)

- [ ] No raw string interpolation in SQL/NoSQL/command queries
- [ ] No user input rendered without escaping in HTML contexts
- [ ] All routes requiring auth have auth middleware
- [ ] No secrets, tokens, or passwords hardcoded or logged
- [ ] File uploads validate type and size before processing
- [ ] No IDOR — resource access checks ownership, not just authentication
- [ ] JWT: validates `exp`, `iss`, `aud`; no algorithm confusion (`none`)
- [ ] No overly permissive CORS with credentials
- [ ] No race conditions: TOCTOU, check-then-act, missing DB transactions
      → See `references/security-checklist.md` for full coverage

## Tests (P1 — Required)

- [ ] Happy path has test coverage
- [ ] Error cases have test coverage (400, 404, 500 variants)
- [ ] Edge cases covered: null, empty arrays, boundary values
- [ ] Tests use real assertions (not `expect(true).toBe(true)`)

## Code Quality (P2 — Suggested)

- [ ] No function exceeds 100 lines
- [ ] No function exceeds 10 branches (cyclomatic complexity)
- [ ] No file exceeds 1000 lines
- [ ] No swallowed exceptions or empty catch blocks
- [ ] No unhandled promise rejections
- [ ] No N+1 queries (loop that runs a query per item)
- [ ] No unbounded loops, collections, or in-memory buffers
- [ ] Null/undefined handled before property access
- [ ] Array access guarded by length check
- [ ] Variable names self-explanatory; error messages include context
      → See `references/code-quality-checklist.md` for full coverage

## Conventions (P3 — Suggested)

- [ ] Naming matches PROJECT.md conventions
- [ ] File structure matches existing patterns
- [ ] Import style matches existing files
- [ ] Commit message follows structured trailer format
