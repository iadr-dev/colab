# Code Review Checklist

## Spec Compliance (Pass 1)
- [ ] All success criteria from .ohc/plans/ are implemented
- [ ] All user requirements addressed
- [ ] No requirements partially implemented without known reason
- [ ] No out-of-scope code added (or documented as intentional side effect)

## Security (✗ Blocking)
- [ ] No raw string interpolation in SQL queries
- [ ] No user input rendered without escaping in HTML contexts
- [ ] All routes requiring auth have auth middleware
- [ ] No secrets, tokens, or passwords hardcoded
- [ ] File uploads validate type and size before processing

## Tests (✓ Required)
- [ ] Happy path has test coverage
- [ ] Error cases have test coverage (400, 404, 500 variants)
- [ ] Edge cases covered: null, empty arrays, boundary values
- [ ] Tests use real assertions (not expect(true).toBe(true))

## Code Quality (⚠ Suggested)
- [ ] No function exceeds 50 lines
- [ ] No function exceeds 10 branches (cyclomatic complexity)
- [ ] No file exceeds 300 lines
- [ ] Variable names self-explanatory without inline comments
- [ ] Error messages are descriptive — include context

## Conventions (⚠ Suggested)
- [ ] Naming matches PROJECT.md conventions
- [ ] File structure matches existing patterns
- [ ] Import style matches existing files
- [ ] Commit message follows structured trailer format
