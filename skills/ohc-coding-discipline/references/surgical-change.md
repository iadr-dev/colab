# Surgical Changes — Reference Guide

## What "Surgical" Means
A surgical change touches exactly what is needed and nothing else.

## Examples

### ✓ Surgical: Adding a parameter
```diff
- function createUser(name: string) {
+ function createUser(name: string, role: string = 'user') {
```
Only adds what was asked. Does not rename, restructure, or add validation.

### ✗ Not Surgical: Adding a parameter + unrequested improvements
```diff
- function createUser(name: string) {
+ function createUser(
+   name: string,
+   role: UserRole = UserRole.User,  // changed to enum — not asked
+ ) {
+   validateName(name);               // added validation — not asked
```

### ✓ Surgical: Fixing a bug
```diff
- if (user.age > 18) {
+ if (user.age >= 18) {
```
One character. Nothing else. If you notice the function name is confusing,
log it to notepad.md — don't rename it.

## The "Would You Notice?" Test
Surgical: reviewer sees exactly what was needed.
Not surgical: reviewer says "why did you also change X?"

## Imports and Unused Variables
Remove ONLY what your changes made unused.
✓ OK: import you added then removed; variable you declared then removed.
✗ Do NOT: pre-existing unused imports; pre-existing commented code; pre-existing TODOs.
