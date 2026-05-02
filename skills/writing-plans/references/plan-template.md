# Plan Template — Canonical Format

```markdown
---
plan: {kebab-case-name}
created: {YYYY-MM-DD}
status: draft | approved | in-progress | complete
estimated_total: {Xh}
approach: {selected approach name}
authoritative_sources: '.ohc/doc-sources.md' | inline list optional
---

# Plan: {Title}

## Goal
{One paragraph. What problem does this solve?}

## Sources

- Canonical index when using external specs (from `.ohc/plans/`): `../doc-sources.md`
- Do **not** duplicate full foreign specs — link and summarize only.

## Traceability

| Source ref (section or ID) | Plan task |
|----------------------------|-----------|
| REQ-004 | Task 1 |

## Success Criteria
- [ ] {specific verifiable criterion}
- [ ] All existing tests pass (count: N)

## Out of Scope
- {item}

## Risks
- {risk}: {mitigation}

## Tasks

### Task 1: {Name}
**Agent**: executor
**Files**: {list}
**Estimate**: Xh
**Description**: {what to do}
**Output**: {verifiable artifact}

## Review
**Agent**: reviewer
**Criteria**: spec compliance + code quality
```
