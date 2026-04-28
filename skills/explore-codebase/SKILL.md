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
2. package.json / pyproject.toml / go.mod / Cargo.toml — deps, scripts, version
3. .env.example — what environment the app expects
4. docker-compose.yml or Dockerfile — infrastructure shape

### Round 2 — Entry points
5. Main entry file (src/index.ts, main.py, cmd/main.go)
6. Router / URL definitions (routes.ts, urls.py, router/index.ts)
7. Database schema (schema.prisma, models.py, migrations/)

### Round 3 — Tests
8. One complete test file — understand test style and patterns
9. Test configuration (jest.config.ts, pytest.ini, vitest.config.ts)

### Round 4 — Spot checks (3 files minimum)
10. 3 representative source files — understand code style, patterns
11. CI configuration (.github/workflows/)

## What to Extract

Write findings to .ohc/PROJECT.md:

- **Tech stack**: language, runtime, framework, ORM, test runner, package manager, CI
- **Entry points**: main file, router file, config files, test directory
- **Architecture**: how data flows (client → API → service → DB or similar)
- **Conventions**: naming style, file structure, import style, error handling
- **Gotchas**: anything surprising, undocumented, or non-obvious

## Run the Generator
```bash
python3 skills/explore-codebase/scripts/generate-project-map.py
```
Auto-detects stack and fills the tech stack table in PROJECT.md.

## Output
Tell user: "Exploration complete. PROJECT.md updated. Key findings: [top 3]"

See references/exploration-checklist.md for full checklist.
