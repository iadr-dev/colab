# Task Decomposition Guide

## The 2-Hour Rule
If a task takes >2 hours, split it.
Reason: long tasks are harder to verify, parallelize, and recover from.

## How to Split

### Split by layer
Instead of: "Implement user authentication"
Do:
- Task 1: Add User model + migration (1h)
- Task 2: Write auth service (login, logout, token) (2h)
- Task 3: Add auth middleware (1h)
- Task 4: Add auth routes + tests (1h)

### Split by happy path vs edge cases
Instead of: "Handle file uploads"
Do:
- Task 1: Happy path — valid file, uploads to S3 (1h)
- Task 2: Error cases — too large, wrong type, S3 failure (1h)
- Task 3: Progress indicator + cancellation (45m)

## Signs a Task is Too Big
- "and" appears more than twice in the description
- Files list has more than 5 files
- You're not sure where to start

## Parallelization
Tasks can run in parallel if:
- They touch different files
- Neither depends on the other's output
Mark parallel tasks: [PARALLEL GROUP A], [PARALLEL GROUP A], [PARALLEL GROUP B]
