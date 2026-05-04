/**
 * tests/unit/scripts/project-scanner.test.js
 * Unit tests for scripts/utils/project-scanner.js
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

let tmpDir, prevCwd;

function freshRequire() {
  const modPath = require.resolve('../../../scripts/utils/project-scanner');
  delete require.cache[modPath];
  return require(modPath);
}

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ohc-scan-'));
  prevCwd = process.cwd();
  process.chdir(tmpDir);
});

afterEach(() => {
  process.chdir(prevCwd);
  try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch {}
});

describe('language detection', () => {
  it('detects TypeScript via tsconfig.json', () => {
    fs.writeFileSync(path.join(tmpDir, 'tsconfig.json'), '{}');
    fs.writeFileSync(path.join(tmpDir, 'package.json'), '{"name":"test"}');
    const { scan } = freshRequire();
    expect(scan(tmpDir).language).toBe('TypeScript');
  });

  it('detects JavaScript via package.json without tsconfig', () => {
    fs.writeFileSync(path.join(tmpDir, 'package.json'), '{"name":"test"}');
    const { scan } = freshRequire();
    expect(scan(tmpDir).language).toBe('JavaScript');
  });

  it('detects Python via pyproject.toml', () => {
    fs.writeFileSync(path.join(tmpDir, 'pyproject.toml'), '[tool.poetry]\nname = "test"');
    const { scan } = freshRequire();
    expect(scan(tmpDir).language).toBe('Python');
  });

  it('detects Go via go.mod', () => {
    fs.writeFileSync(path.join(tmpDir, 'go.mod'), 'module example.com/app');
    const { scan } = freshRequire();
    expect(scan(tmpDir).language).toBe('Go');
  });

  it('detects Rust via Cargo.toml', () => {
    fs.writeFileSync(path.join(tmpDir, 'Cargo.toml'), '[package]\nname = "test"');
    const { scan } = freshRequire();
    expect(scan(tmpDir).language).toBe('Rust');
  });

  it('returns unknown when no markers found', () => {
    const { scan } = freshRequire();
    expect(scan(tmpDir).language).toBe('unknown');
  });
});

describe('framework detection', () => {
  it('detects Next.js', () => {
    fs.writeFileSync(path.join(tmpDir, 'package.json'), JSON.stringify({
      name: 'test', dependencies: { next: '15.0.0', react: '19.0.0' }
    }));
    const { scan } = freshRequire();
    expect(scan(tmpDir).framework).toBe('Next.js');
  });

  it('detects Express', () => {
    fs.writeFileSync(path.join(tmpDir, 'package.json'), JSON.stringify({
      name: 'test', dependencies: { express: '4.18.0' }
    }));
    const { scan } = freshRequire();
    expect(scan(tmpDir).framework).toBe('Express');
  });

  it('detects FastAPI from pyproject.toml', () => {
    fs.writeFileSync(path.join(tmpDir, 'pyproject.toml'), '[tool.poetry.dependencies]\nfastapi = "0.100.0"');
    const { scan } = freshRequire();
    expect(scan(tmpDir).framework).toBe('FastAPI');
  });

  it('returns none when no framework detected', () => {
    fs.writeFileSync(path.join(tmpDir, 'package.json'), '{"name":"test"}');
    const { scan } = freshRequire();
    expect(scan(tmpDir).framework).toBe('none');
  });
});

describe('test runner detection', () => {
  it('detects Vitest', () => {
    fs.writeFileSync(path.join(tmpDir, 'package.json'), JSON.stringify({
      name: 'test', devDependencies: { vitest: '1.0.0' }
    }));
    const { scan } = freshRequire();
    expect(scan(tmpDir).testRunner).toBe('Vitest');
  });

  it('detects Jest', () => {
    fs.writeFileSync(path.join(tmpDir, 'package.json'), JSON.stringify({
      name: 'test', devDependencies: { jest: '29.0.0' }
    }));
    const { scan } = freshRequire();
    expect(scan(tmpDir).testRunner).toBe('Jest');
  });

  it('detects pytest', () => {
    fs.writeFileSync(path.join(tmpDir, 'pyproject.toml'), '[tool.pytest.ini_options]\naddopts = "-v"');
    const { scan } = freshRequire();
    expect(scan(tmpDir).testRunner).toBe('pytest');
  });
});

describe('package manager detection', () => {
  it('detects pnpm', () => {
    fs.writeFileSync(path.join(tmpDir, 'package.json'), '{"name":"test"}');
    fs.writeFileSync(path.join(tmpDir, 'pnpm-lock.yaml'), '');
    const { scan } = freshRequire();
    expect(scan(tmpDir).packageManager).toBe('pnpm');
  });

  it('detects yarn', () => {
    fs.writeFileSync(path.join(tmpDir, 'package.json'), '{"name":"test"}');
    fs.writeFileSync(path.join(tmpDir, 'yarn.lock'), '');
    const { scan } = freshRequire();
    expect(scan(tmpDir).packageManager).toBe('yarn');
  });

  it('defaults to npm', () => {
    fs.writeFileSync(path.join(tmpDir, 'package.json'), '{"name":"test"}');
    const { scan } = freshRequire();
    expect(scan(tmpDir).packageManager).toBe('npm');
  });
});

describe('CI detection', () => {
  it('detects GitHub Actions', () => {
    fs.mkdirSync(path.join(tmpDir, '.github', 'workflows'), { recursive: true });
    fs.writeFileSync(path.join(tmpDir, 'package.json'), '{"name":"test"}');
    const { scan } = freshRequire();
    expect(scan(tmpDir).ci).toBe('GitHub Actions');
  });

  it('returns none when no CI', () => {
    fs.writeFileSync(path.join(tmpDir, 'package.json'), '{"name":"test"}');
    const { scan } = freshRequire();
    expect(scan(tmpDir).ci).toBe('none');
  });
});
