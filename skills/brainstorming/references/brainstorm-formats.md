# Alternative Brainstorm Formats

## Comparison Table (for feature parity decisions)
| Criterion | Approach A | Approach B | Approach C |
|-----------|-----------|-----------|-----------|
| Implementation time | 2h | 5h | 1h |
| Maintenance burden | Low | Medium | High |
| Scalability | Poor | Good | Excellent |
| Existing patterns | Follows | New | Extends |

## Decision Tree (for binary choices)
```
Is the data >1MB?
├─ NO → Use in-memory cache
└─ YES → Is it shared across processes?
          ├─ NO → Use disk cache
          └─ YES → Use Redis
```

## Risk Matrix (for high-stakes decisions)
| Approach | If it works | If it fails | Recovery time |
|----------|------------|-------------|--------------|
| A | Fast delivery | Minor rework | 1h |
| B | Best UX | Major rework | 2 days |
| C | Future-proof | Partial rewrite | 1 week |
