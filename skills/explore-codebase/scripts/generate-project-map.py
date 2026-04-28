#!/usr/bin/env python3
"""
generate-project-map.py — auto-detect project tech stack
Outputs: markdown table for .ohc/PROJECT.md tech stack section
Usage: python3 skills/explore-codebase/scripts/generate-project-map.py
"""
import os, json, subprocess
from pathlib import Path

root = Path('.')

def detect(checks):
    for label, paths in checks.items():
        for p in paths:
            if (root / p).exists(): return label
    return 'unknown'

lang = detect({
    'TypeScript': ['tsconfig.json'],
    'JavaScript': ['package.json'],
    'Python':     ['pyproject.toml', 'setup.py', 'requirements.txt'],
    'Go':         ['go.mod'],
    'Rust':       ['Cargo.toml'],
})

framework = 'unknown'
if (root / 'package.json').exists():
    pkg = json.loads((root / 'package.json').read_text())
    deps = {**pkg.get('dependencies', {}), **pkg.get('devDependencies', {})}
    for f, k in [('Next.js','next'),('React','react'),('Vue','vue'),
                 ('Svelte','svelte'),('Express','express'),('Fastify','fastify'),
                 ('NestJS','@nestjs/core'),('Hono','hono')]:
        if k in deps: framework = f; break
elif (root / 'pyproject.toml').exists():
    txt = (root / 'pyproject.toml').read_text().lower()
    for f, k in [('FastAPI','fastapi'),('Django','django'),('Flask','flask')]:
        if k in txt: framework = f; break

test_runner = detect({
    'Vitest':  ['vitest.config.ts','vitest.config.js'],
    'Jest':    ['jest.config.ts','jest.config.js'],
    'pytest':  ['pytest.ini','pyproject.toml'],
    'go test': ['go.mod'],
})

pkg_manager = detect({
    'pnpm':   ['pnpm-lock.yaml'],
    'yarn':   ['yarn.lock'],
    'npm':    ['package-lock.json'],
    'poetry': ['poetry.lock'],
    'pip':    ['requirements.txt'],
})

ci = detect({
    'GitHub Actions': ['.github/workflows'],
    'CircleCI':       ['.circleci'],
    'GitLab CI':      ['.gitlab-ci.yml'],
})

print(f"""## Tech Stack (auto-detected)

| Aspect | Value |
|--------|-------|
| Language | {lang} |
| Framework | {framework} |
| Test runner | {test_runner} |
| Package manager | {pkg_manager} |
| CI | {ci} |

> Run /explore to populate architecture and conventions sections.
""")
