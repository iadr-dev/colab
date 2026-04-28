# Assumption Protocol — When to Ask vs Infer

## Decision Tree
```
Is the request unambiguous?
├─ YES → Proceed. State interpretation briefly before coding.
└─ NO → How many interpretations?
         ├─ 1 reasonable → State it, proceed
         └─ 2+ reasonable
              └─ Consequence of choosing wrong?
                   ├─ < 15 min → Pick most likely, state it, proceed
                   └─ > 15 min → ASK before proceeding
```

## How to Ask Well
Bad:  "What do you mean?"
Good: "I see two interpretations:
  A) [specific] — would mean [specific behavior]
  B) [specific] — would mean [specific behavior]
  Which did you mean, or something else?"

## How to State an Assumption
Before coding: "Assuming X means Y. If you meant something else, stop me now."

## Always Ask (regardless of consequence)
- Authentication / authorization behavior (wrong = security hole)
- Database schema changes (wrong = data migration risk)
- Public API changes (wrong = breaking change)
- Error behavior ("handle the error" — silently? show UI? log? throw?)

## Always Infer (never ask)
- Code style matching surrounding file
- Import style matching existing file
- Naming conventions from PROJECT.md
- Test structure matching existing test files
