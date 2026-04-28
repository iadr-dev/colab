# Plan Template — Canonical Format

```markdown
---
plan: {kebab-case-name}
created: {YYYY-MM-DD}
status: draft | approved | in-progress | complete
estimated_total: {Xh}
approach: {selected approach name}
---

# Plan: {Title}

## Goal
{One paragraph. What problem does this solve?}

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
