---
name: vercel-react-best-practices
description: "Comprehensive performance and architecture optimization for React and Next.js. Use this for code reviews, refactoring, or building new components."
allowed-tools: [grep_search, view_file]
---

# vercel-react-best-practices

Optimizes React and Next.js applications using Vercel Engineering's 70+ rules across 8 categories.

## Phase 1: Audit & Identify
Scan the codebase for common performance bottlenecks and anti-patterns.
- **Tools**: `grep_search` or `rg` for specific hooks (`useEffect`, `useState`), Server Components, and Layout patterns.
- **Focus**: RSC vs. Client Component boundaries, hydration mismatches, and waterfall fetches.

## Phase 2: Category Analysis
Evaluate the code against these 8 core categories:
1. **Performance**: Bundle size, re-renders, and memoization.
2. **RSC Optimization**: Minimizing Client Component usage, data fetching patterns.
3. **Hydration**: Preventing mismatches, using `Suspense` correctly.
4. **Data Fetching**: Using `fetch` in RSC, cache tags, and revalidation.
5. **State Management**: Avoiding prop drilling, choosing the right hook.
6. **Form Handling**: Server Actions vs. traditional forms.
7. **Routing**: Layout vs. Page structure, segment config.
8. **Security**: Sanitizing inputs, CSRF protection in Server Actions.

## Phase 3: Severity Ranking
Assign a priority to each finding:
- **P0 (Critical)**: Hydration errors, security gaps (missing auth in Server Actions).
- **P1 (High)**: Large bundle size regressions, blocking waterfalls.
- **P2 (Medium)**: Suboptimal hook usage, minor re-render issues.
- **P3 (Low)**: Style improvements, naming conventions.

## Phase 4: Recommendation
Propose specific code changes using the "Fix it" or "Refactor it" pattern. Explain the "Why" behind each change (e.g., "Moving this to an RSC reduces client bundle by 20KB").

## References
| File | Purpose |
|------|---------|
| [rsc-checklist.md](file:///c:/Users/Ray.Shen/WebProjects/colab/skills/coding/vercel-react-best-practices/references/rsc-checklist.md) | Server Component best practices |
| [performance-rules.md](file:///c:/Users/Ray.Shen/WebProjects/colab/skills/coding/vercel-react-best-practices/references/performance-rules.md) | Specific React performance rules |
