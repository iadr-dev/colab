/**
 * project-scanner.js — detect project tech stack from filesystem
 */
const fs = require('fs');
const path = require('path');

function readJSON(p) { try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch { return null; } }
function exists(p)   { return fs.existsSync(p); }
function readText(p) { try { return fs.readFileSync(p, 'utf8'); } catch { return ''; } }

function scan(cwd = process.cwd()) {
  const pkg     = readJSON(path.join(cwd, 'package.json'));
  const allDeps = { ...(pkg?.dependencies || {}), ...(pkg?.devDependencies || {}) };
  const pyproj  = readText(path.join(cwd, 'pyproject.toml')).toLowerCase();

  // Language
  let language = 'unknown';
  if (exists(path.join(cwd, 'tsconfig.json')) || allDeps['typescript']) language = 'TypeScript';
  else if (pkg) language = 'JavaScript';
  else if (pyproj || exists(path.join(cwd, 'requirements.txt'))) language = 'Python';
  else if (exists(path.join(cwd, 'go.mod'))) language = 'Go';
  else if (exists(path.join(cwd, 'Cargo.toml'))) language = 'Rust';
  else if (exists(path.join(cwd, 'build.gradle')) || exists(path.join(cwd, 'build.gradle.kts'))) language = 'Kotlin';
  else if (exists(path.join(cwd, 'Package.swift'))) language = 'Swift';
  else if (exists(path.join(cwd, 'pubspec.yaml'))) language = 'Dart';
  else if (exists(path.join(cwd, 'Gemfile'))) language = 'Ruby';

  // Framework
  let framework = 'none';
  for (const [name, dep] of [
    ['Next.js','next'],['Expo','expo'],['React Native','react-native'],['React','react'],
    ['Vue','vue'],['Svelte','svelte'],['Express','express'],['Fastify','fastify'],
    ['NestJS','@nestjs/core'],['Hono','hono']
  ]) {
    if (allDeps[dep]) { framework = name; break; }
  }
  if (framework === 'none') {
    if (pyproj.includes('fastapi')) framework = 'FastAPI';
    else if (pyproj.includes('django')) framework = 'Django';
    else if (pyproj.includes('flask')) framework = 'Flask';
    // Kotlin / Android
    else if (exists(path.join(cwd, 'build.gradle.kts'))) {
      const gradle = readText(path.join(cwd, 'build.gradle.kts')).toLowerCase();
      if (gradle.includes('compose')) framework = 'Jetpack Compose';
      else if (gradle.includes('ktor')) framework = 'Ktor';
      else framework = 'Android';
    } else if (exists(path.join(cwd, 'build.gradle'))) {
      const gradle = readText(path.join(cwd, 'build.gradle')).toLowerCase();
      if (gradle.includes('compose')) framework = 'Jetpack Compose';
      else if (gradle.includes('ktor')) framework = 'Ktor';
      else framework = 'Android';
    }
    // Swift
    else if (exists(path.join(cwd, 'Package.swift'))) {
      const swift = readText(path.join(cwd, 'Package.swift')).toLowerCase();
      framework = swift.includes('swiftui') ? 'SwiftUI' : 'Swift Package';
    }
    // Dart / Flutter
    else if (exists(path.join(cwd, 'pubspec.yaml'))) framework = 'Flutter';
    // Ruby
    else if (exists(path.join(cwd, 'Gemfile'))) {
      const gemfile = readText(path.join(cwd, 'Gemfile')).toLowerCase();
      framework = gemfile.includes('rails') ? 'Rails' : 'Ruby';
    }
  }

  // Test runner
  let testRunner = 'unknown';
  if (exists(path.join(cwd, 'vitest.config.ts')) || allDeps['vitest']) testRunner = 'Vitest';
  else if (allDeps['jest'] || exists(path.join(cwd, 'jest.config.ts'))) testRunner = 'Jest';
  else if (pyproj.includes('[tool.pytest') || exists(path.join(cwd, 'pytest.ini'))) testRunner = 'pytest';
  else if (exists(path.join(cwd, 'go.mod'))) testRunner = 'go test';
  else if (exists(path.join(cwd, 'pubspec.yaml'))) testRunner = 'flutter test';
  else if (exists(path.join(cwd, 'Package.swift'))) testRunner = 'XCTest';
  else if (exists(path.join(cwd, 'build.gradle')) || exists(path.join(cwd, 'build.gradle.kts'))) testRunner = 'JUnit';
  else if (exists(path.join(cwd, 'Gemfile'))) testRunner = 'RSpec';

  // Package manager
  let packageManager = 'npm';
  if (exists(path.join(cwd, 'pnpm-lock.yaml'))) packageManager = 'pnpm';
  else if (exists(path.join(cwd, 'yarn.lock'))) packageManager = 'yarn';
  else if (exists(path.join(cwd, 'poetry.lock'))) packageManager = 'poetry';
  else if (exists(path.join(cwd, 'pubspec.yaml'))) packageManager = 'pub';
  else if (exists(path.join(cwd, 'Package.swift'))) packageManager = 'spm';
  else if (exists(path.join(cwd, 'build.gradle.kts')) || exists(path.join(cwd, 'gradlew'))) packageManager = 'gradle';
  else if (exists(path.join(cwd, 'pom.xml'))) packageManager = 'maven';
  else if (exists(path.join(cwd, 'Gemfile.lock'))) packageManager = 'bundler';

  // CI
  let ci = 'none';
  if (exists(path.join(cwd, '.github/workflows'))) ci = 'GitHub Actions';
  else if (exists(path.join(cwd, '.circleci'))) ci = 'CircleCI';

  // Git remote
  let gitRemote = '';
  try {
    const m = readText(path.join(cwd, '.git/config')).match(/url = (.+)/);
    if (m) gitRemote = m[1].trim();
  } catch {}

  return {
    projectName:    pkg?.name || path.basename(cwd),
    language, framework, testRunner, packageManager, ci, gitRemote,
    mainEntry:      exists(path.join(cwd, 'src/index.ts')) ? 'src/index.ts' : 'src/main.ts',
    testDirectory:  exists(path.join(cwd, 'tests')) ? 'tests/' : '*.test.ts',
    version:        pkg?.version || '0.0.0'
  };
}

module.exports = { scan };
