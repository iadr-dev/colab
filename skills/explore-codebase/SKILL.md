---
name: explore-codebase
description: >
  Systematically understand an unfamiliar codebase or feature area. Outputs a
  populated .ohc/PROJECT.md with stack, architecture, conventions, entry points,
  and gotchas. Run at project start or when entering new feature territory.
allowed-tools: Read Bash
---

# Explore Codebase

Use when: new project, new feature area, or significant time since last session.

## Reading Order

Stop when you can answer all output questions below.

### Round 1 — Project meta (always read)
1. README.md — purpose, quick start, architecture overview
2. package.json / pyproject.toml / go.mod / Cargo.toml / pubspec.yaml / build.gradle — deps, scripts, version
3. .env.example — what environment the app expects
4. docker-compose.yml or Dockerfile — infrastructure shape
5. *(Monorepo)* pnpm-workspace.yaml / turbo.json / nx.json / lerna.json — workspace structure

### Round 2 — Entry points
6. Main entry file (src/index.ts, main.py, cmd/main.go, lib/main.dart, MainActivity.kt, ContentView.swift)
7. Router / URL definitions (routes.ts, urls.py, router/index.ts)
8. Database schema (schema.prisma, drizzle.config.ts, models.py, migrations/)
9. *(Mobile)* App manifest (AndroidManifest.xml, Info.plist, app.json)

### Round 3 — Tests
10. One complete test file — understand test style and patterns
11. Test configuration (jest.config.ts, pytest.ini, vitest.config.ts, `flutter test`, XCTest)

### Round 4 — Spot checks (3 files minimum)
12. 3 representative source files — understand code style, patterns
13. CI configuration (.github/workflows/)

## What to Extract

Write findings to .ohc/PROJECT.md:

- **Tech stack**: language, runtime (Node/Deno/Bun), framework, ORM, test runner, package manager, CI
- **Monorepo**: tool used, workspace layout, shared packages
- **Entry points**: main file, router file, config files, test directory
- **Architecture**: how data flows (client → API → service → DB or similar)
- **Conventions**: naming style, file structure, import style, error handling
- **Gotchas**: anything surprising, undocumented, or non-obvious

## Run the Generator
```bash
# Node (preferred — zero Python dependency):
node skills/explore-codebase/scripts/generate-project-map.js

# Python fallback (if Node 18+ unavailable):
python3 skills/explore-codebase/scripts/generate-project-map.py
```
Auto-detects stack and fills the tech stack table in PROJECT.md.

## Output
Tell user: "Exploration complete. PROJECT.md updated. Key findings: [top 3]"

See references/exploration-checklist.md for full checklist.
