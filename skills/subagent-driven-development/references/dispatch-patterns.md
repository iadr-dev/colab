# Dispatch Patterns

## Pattern 1: Layer Parallelization
```
[PARALLEL A] DB schema + migration
[PARALLEL A] API types/interfaces
[SEQUENTIAL] Service layer (depends on A)
[SEQUENTIAL] API routes (depends on service)
```

## Pattern 2: Feature Slicing
```
[PARALLEL B] User profile page
[PARALLEL B] Settings page
[PARALLEL B] Notification preferences
[SEQUENTIAL] Navigation (links to all three)
```

## Anti-Patterns (don't parallelize)
❌ Task A and Task B both write to the same file
❌ Task B starts with Task A's output as input
❌ Tasks share a database migration
