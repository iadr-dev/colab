/**
 * tests/unit/scripts/skill.test.js
 * Unit tests for scripts/skill.js
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

let tmpDir, prevCwd;

function freshRequire() {
  const modPath = require.resolve('../../../scripts/skill');
  delete require.cache[modPath];
  return require(modPath);
}

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ohc-skill-'));
  prevCwd = process.cwd();
  process.chdir(tmpDir);
});

afterEach(() => {
  process.chdir(prevCwd);
  try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch {}
});

describe('list', () => {
  it('lists installed skills', () => {
    const skillDir = path.join(tmpDir, 'skills', 'tdd');
    fs.mkdirSync(skillDir, { recursive: true });
    fs.writeFileSync(path.join(skillDir, 'SKILL.md'), '# TDD\ncontent\n');

    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const skill = freshRequire();
    skill(['list']);
    const output = consoleSpy.mock.calls.map(c => c[0]).join('\n');
    expect(output).toContain('tdd');
    consoleSpy.mockRestore();
  });

  it('shows drafts from .ohc/skills/', () => {
    const draftDir = path.join(tmpDir, '.ohc', 'skills');
    fs.mkdirSync(draftDir, { recursive: true });
    fs.writeFileSync(path.join(draftDir, 'my-draft.md'), '# Draft');

    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const skill = freshRequire();
    skill(['list']);
    const output = consoleSpy.mock.calls.map(c => c[0]).join('\n');
    expect(output).toContain('my-draft');
    consoleSpy.mockRestore();
  });
});

describe('draft', () => {
  it('creates template file', () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const skill = freshRequire();
    skill(['draft', 'my-new-skill']);
    const draftPath = path.join(tmpDir, '.ohc', 'skills', 'my-new-skill.md');
    expect(fs.existsSync(draftPath)).toBe(true);
    const content = fs.readFileSync(draftPath, 'utf8');
    expect(content).toContain('name: my-new-skill');
    expect(content).toContain('## Steps');
    consoleSpy.mockRestore();
  });

  it('prevents overwriting existing draft', () => {
    const draftDir = path.join(tmpDir, '.ohc', 'skills');
    fs.mkdirSync(draftDir, { recursive: true });
    fs.writeFileSync(path.join(draftDir, 'existing.md'), 'old content');

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const skill = freshRequire();
    skill(['draft', 'existing']);
    const output = consoleSpy.mock.calls.map(c => c[0]).join('\n');
    expect(output).toContain('already exists');
    consoleSpy.mockRestore();
  });

  it('shows usage when no name provided', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const skill = freshRequire();
    skill(['draft']);
    const output = consoleSpy.mock.calls.map(c => c[0]).join('\n');
    expect(output).toContain('Usage');
    consoleSpy.mockRestore();
  });
});

describe('promote', () => {
  it('moves draft to skills/<name>/SKILL.md', () => {
    const draftDir = path.join(tmpDir, '.ohc', 'skills');
    fs.mkdirSync(draftDir, { recursive: true });
    fs.writeFileSync(path.join(draftDir, 'my-skill.md'), '# My Skill\nline 1\nline 2\n');

    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const skill = freshRequire();
    skill(['promote', 'my-skill']);

    const promoted = path.join(tmpDir, 'skills', 'my-skill', 'SKILL.md');
    expect(fs.existsSync(promoted)).toBe(true);
    expect(fs.readFileSync(promoted, 'utf8')).toContain('# My Skill');

    // Check subdirs created
    expect(fs.existsSync(path.join(tmpDir, 'skills', 'my-skill', 'references'))).toBe(true);
    expect(fs.existsSync(path.join(tmpDir, 'skills', 'my-skill', 'scripts'))).toBe(true);
    expect(fs.existsSync(path.join(tmpDir, 'skills', 'my-skill', 'assets'))).toBe(true);
    consoleSpy.mockRestore();
  });

  it('errors when draft not found', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const skill = freshRequire();
    skill(['promote', 'nonexistent']);
    const output = consoleSpy.mock.calls.map(c => c[0]).join('\n');
    expect(output).toContain('not found');
    consoleSpy.mockRestore();
  });
});
