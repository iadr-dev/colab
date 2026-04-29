# Behavior-First Testing

Tests should describe what callers or users can observe, not how the current
implementation happens to produce it.

## Vertical tracer bullets

Use one behavior at a time:

1. Write one failing test for one externally visible behavior.
2. Add the smallest implementation that passes that test.
3. Repeat for the next behavior.
4. Refactor only while all tests are green.

Avoid horizontal slicing:

```text
Wrong: RED test1, test2, test3 -> GREEN impl1, impl2, impl3
Right: RED test1 -> GREEN impl1 -> RED test2 -> GREEN impl2
```

Horizontal slicing locks in imagined interfaces before the implementation teaches
you what the real shape should be.

## Test through public interfaces

Good tests use the same interface a real caller uses:

```typescript
it("makes a created user retrievable", async () => {
  const user = await createUser({ name: "Alice" })
  await expect(getUser(user.id)).resolves.toMatchObject({ name: "Alice" })
})
```

Bad tests reach past the interface:

```typescript
it("calls save on the repository", async () => {
  await createUser({ name: "Alice" })
  expect(repo.save).toHaveBeenCalled()
})
```

The second test breaks when internals change even if behavior stays correct.

## Mocking rule

Mock at system boundaries:

- third-party APIs
- time, randomness, and clocks
- network or filesystem dependencies when no cheap local substitute exists
- databases only when a test database or local substitute is impractical

Do not mock modules you own just to make testing easier. If testing requires
mocking internals, the interface may be too shallow or the seam is in the wrong
place.

## Interface design pressure

Good tests reveal good interfaces. Prefer modules where:

- dependencies are accepted rather than constructed internally
- the caller gets meaningful behavior from a small surface area
- error modes and ordering constraints are explicit
- complexity sits behind the interface, not in every caller

When refactoring, delete old shallow-module tests once behavior is covered at the
deeper module's interface.
