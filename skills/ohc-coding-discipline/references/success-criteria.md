# Success Criteria — Templates by Task Type

## The Rule
Criteria must be specific and independently verifiable.
Anyone following the criterion should reach the same yes/no conclusion.

## API Endpoint
```
- GET /api/users returns 200 with array of {id, name, email}
- GET /api/users?role=admin returns only users with role === 'admin'
- GET /api/users with invalid token returns 401
- All 3 endpoint tests in users.test.ts pass with 0 skips
```

## UI Feature
```
- Form submits without console errors on Chrome 120+ and Firefox 120+
- Submitted data appears in list within 500ms of submission
- Error state shows when API returns 400 with field errors highlighted
- All 5 Cypress form interaction tests pass
```

## Refactor
```
- All existing N tests pass after refactor
- No new public APIs changed (diff shows only internal renames)
- Bundle size does not increase by more than 1KB
- TypeScript: zero new type errors
```

## Bug Fix
```
- The specific reproduction steps no longer reproduce the bug
- Existing tests pass
- New regression test for this bug passes
- Manual test: [exact steps] produces [expected result]
```

## Anti-patterns to Avoid
❌ "The code is cleaner now" — not verifiable
❌ "It should be faster" — not measured
❌ "Tests pass" — which tests? how many?
❌ "Works in my testing" — not repeatable
