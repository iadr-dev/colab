# Architecture Vocabulary

Use this vocabulary when reviewing, refactoring, or planning structural changes.
Consistent terms reduce vague architecture advice.

## Terms

**Module**
Anything with an interface and an implementation: function, class, package, or
feature slice.

**Interface**
Everything a caller must know to use the module correctly: types, invariants,
ordering rules, error modes, configuration, and performance expectations.

**Implementation**
The code inside a module.

**Seam**
A place where behavior can change without editing the caller. Avoid using
"boundary" when "seam" is the precise idea.

**Adapter**
A concrete implementation that satisfies an interface at a seam.

**Depth**
How much useful behavior sits behind the interface. Deep modules have small
interfaces and meaningful implementation. Shallow modules expose nearly as much
complexity as they hide.

**Leverage**
What callers get from depth: more capability per fact they must learn.

**Locality**
What maintainers get from depth: bugs, changes, and knowledge concentrated in
one place instead of spread across callers.

## Principles

- The interface is the test surface.
- Depth is about leverage, not line-count ratios.
- One adapter means a hypothetical seam; two adapters means a real seam.
- If deleting a module only moves the complexity to callers, the module was
  earning its keep.
- If deleting a module makes complexity disappear, it may be a pass-through.

## Refactoring posture

Do not create seams speculatively. Add or move a seam when it improves testing,
locality, or caller simplicity in the current task.
