# Debug Hypothesis Templates by Error Type

## Network / API Errors
- 5xx: "Server failing to connect to dependency (DB, cache, external API)"
  Test: Check dependency health directly. Check server logs.
- 401/403: "Token expired or missing required scope"
  Test: Decode JWT. Check expiry and claims vs required permissions.
- Timeout: "A DB query is slow or missing an index"
  Test: Run query with EXPLAIN ANALYZE. Check for sequential scans.

## State / React / UI
- Stale data: "State update not triggering re-render (mutation not new reference)"
  Test: Add console.log to render. Check reference equality.
- Infinite re-render: "useEffect dependency includes object/function recreated each render"
  Test: Remove dependencies one by one. Log renders. Find changing reference.

## Async / Timing
- Random test failures: "Test not waiting for async operation to complete"
  Test: Add await to all async calls. Check for missing await.
- Race condition: "Concurrent requests modify shared state without locking"
  Test: Send N concurrent requests. Check if results are consistent.

## Type / Runtime
- "Cannot read property X of undefined"
  Hypothesis: nullable value not checked before access
  Test: Add null check. Log the value at point of failure.
- Wrong type returned
  Hypothesis: JS type coercion (string→number, null→0)
  Test: Log typeof at each stage. Use strict equality (===).

## Configuration
- Works locally, fails in CI
  Hypothesis: env var missing or different value
  Test: Print all env vars at startup. Compare local vs CI.
- Works after first deploy, broken after second
  Hypothesis: migration didn't run / ran in wrong order
  Test: Check migration history table. Compare expected vs actual schema.
