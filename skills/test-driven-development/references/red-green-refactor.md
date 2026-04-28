# RED-GREEN-REFACTOR — Detailed Guide

## Full Cycle Example: discount calculation

### RED
```typescript
describe('calculateDiscount', () => {
  it('applies 10% to orders over $100', () => {
    expect(calculateDiscount(150, 'SAVE10')).toBe(135)
  })
  it('no discount for orders under $100', () => {
    expect(calculateDiscount(80, 'SAVE10')).toBe(80)
  })
})
```
Run → FAIL: "calculateDiscount is not defined" ✓ correct failure

### GREEN (minimum code)
```typescript
export function calculateDiscount(total: number, code: string): number {
  if (code === 'SAVE10' && total > 100) return total * 0.9
  return total
}
```
Run → PASS ✓

### REFACTOR
```typescript
const DISCOUNTS: Record<string, number> = { 'SAVE10': 0.10 }
const THRESHOLD = 100

export function calculateDiscount(total: number, code: string): number {
  const rate = DISCOUNTS[code]
  if (!rate || total <= THRESHOLD) return total
  return total * (1 - rate)
}
```
Run → PASS ✓

## The "Obvious Implementation" Exception
If implementation is trivially obvious (one-liner), you may write it with the test.
But STILL run red-then-green to confirm the test works correctly.

## Handling Pre-existing Tests
1. Run existing tests — baseline: all passing
2. Write new test (RED)
3. Implement (GREEN)
4. Refactor
5. Run ALL tests — no regressions allowed
