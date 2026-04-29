# Task Decomposition Guide

## The 2-Hour Rule
If a task takes >2 hours, split it.
Reason: long tasks are harder to verify, parallelize, and recover from.

## How to Split

### Prefer vertical slices
Instead of: "Implement user authentication"
Do:
- Task 1: User can log in with valid credentials (schema, route, logic, test)
- Task 2: User sees a clear error for invalid credentials
- Task 3: Authenticated request can access one protected route
- Task 4: User can log out and protected route rejects the old session

Each task should deliver a narrow but complete behavior through the relevant
layers. A completed slice should be demoable or independently verifiable.

### Use horizontal tasks sparingly
Schema-only, API-only, or UI-only tasks are acceptable when they are deliberate
preparatory work and have their own success criterion. Do not split by layer just
because it is easier to assign.

### Split by happy path vs edge cases
Instead of: "Handle file uploads"
Do:
- Task 1: Valid file uploads and appears in the file list
- Task 2: Oversized or wrong-type file is rejected with a useful message
- Task 3: Upload progress can be cancelled and leaves no partial record

## Signs a Task is Too Big
- "and" appears more than twice in the description
- Files list has more than 5 files
- You're not sure where to start

## Parallelization
Tasks can run in parallel if:
- They touch different files
- Neither depends on the other's output
Mark parallel tasks: [PARALLEL GROUP A], [PARALLEL GROUP A], [PARALLEL GROUP B]
