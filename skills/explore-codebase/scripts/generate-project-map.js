#!/usr/bin/env node
/**
 * harness/generate-project-map.js — auto-detect project tech stack
 * Migration of: skills/explore-codebase/scripts/generate-project-map.py
 * No Python dependency required.
 *
 * Usage: node harness/generate-project-map.js
 * Output: Markdown table suitable for pasting into .ohc/PROJECT.md
 */

const fs   = require('fs');
const path = require('path');

const root = process.cwd();

function exists(rel) {
  return fs.existsSync(path.join(root, rel));
}

function detect(checks, fallback = 'unknown') {
  for (const [label, paths] of Object.entries(checks)) {
    if (Array.isArray(paths)) {
      for (const p of paths) { if (exists(p)) return label; }
    }
  }
  return fallback;
}

const lang = detect({
  TypeScript:       ['tsconfig.json'],
  JavaScript:       ['package.json'],
  Python:           ['pyproject.toml', 'setup.py', 'requirements.txt'],
  Go:               ['go.mod'],
  Rust:             ['Cargo.toml'],
  'Dart/Flutter':   ['pubspec.yaml'],
  'Kotlin/Android': ['build.gradle', 'build.gradle.kts'],
  'Swift/iOS':      ['Package.swift', 'Podfile'],
});

let framework = 'unknown';
if (exists('package.json')) {
  try {
    const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
    const deps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) };
    const fw = [
      ['Next.js','next'], ['React','react'], ['Vue','vue'], ['Svelte','svelte'],
      ['Express','express'], ['Fastify','fastify'], ['NestJS','@nestjs/core'],
      ['Hono','hono'], ['React Native','react-native'], ['Expo','expo'],
    ];
    for (const [name, key] of fw) {
      if (deps[key]) { framework = name; break; }
    }
  } catch {}
} else if (exists('pubspec.yaml')) {
  framework = 'Flutter';
} else if (exists('build.gradle.kts') || exists('build.gradle')) {
  const f = exists('build.gradle.kts') ? 'build.gradle.kts' : 'build.gradle';
  const txt = fs.readFileSync(path.join(root, f), 'utf8').toLowerCase();
  framework = txt.includes('compose') ? 'Jetpack Compose' : 'Android';
} else if (exists('Package.swift')) {
  framework = 'Swift Package / SwiftUI';
} else if (exists('pyproject.toml')) {
  const txt = fs.readFileSync(path.join(root, 'pyproject.toml'), 'utf8').toLowerCase();
  for (const [name, key] of [['FastAPI','fastapi'],['Django','django'],['Flask','flask']]) {
    if (txt.includes(key)) { framework = name; break; }
  }
}

const testRunner = detect({
  Vitest:        ['vitest.config.ts', 'vitest.config.js'],
  Jest:          ['jest.config.ts', 'jest.config.js'],
  pytest:        ['pytest.ini', 'pyproject.toml'],
  'go test':     ['go.mod'],
  'flutter test':['pubspec.yaml'],
  XCTest:        ['Package.swift', 'Podfile'],
});

const pkgManager = detect({
  pnpm:   ['pnpm-lock.yaml'],
  yarn:   ['yarn.lock'],
  bun:    ['bun.lockb'],
  npm:    ['package-lock.json'],
  poetry: ['poetry.lock'],
  pip:    ['requirements.txt'],
  pub:    ['pubspec.yaml'],
  gradle: ['build.gradle', 'build.gradle.kts'],
  swift:  ['Package.swift'],
});

const runtime = detect({
  Deno:  ['deno.json', 'deno.jsonc'],
  Bun:   ['bun.lockb'],
  Node:  ['package.json'],
});

const monorepo = detect({
  'pnpm workspaces': ['pnpm-workspace.yaml'],
  Turborepo:         ['turbo.json'],
  Nx:                ['nx.json'],
  Lerna:             ['lerna.json'],
});

const database = detect({
  Prisma:  ['schema.prisma', 'prisma/schema.prisma'],
  Drizzle: ['drizzle.config.ts', 'drizzle.config.js'],
  Alembic: ['alembic.ini'],
});

const ci = detect({
  'GitHub Actions': ['.github/workflows'],
  CircleCI:         ['.circleci'],
  'GitLab CI':      ['.gitlab-ci.yml'],
});

console.log(`## Tech Stack (auto-detected)

| Aspect | Value |
|--------|-------|
| Language | ${lang} |
| Framework | ${framework} |
| Runtime | ${runtime} |
| Test runner | ${testRunner} |
| Package manager | ${pkgManager} |
| Database / ORM | ${database} |
| Monorepo tool | ${monorepo} |
| CI | ${ci} |

> Run /ohc-explore to populate architecture and conventions sections.
`);
