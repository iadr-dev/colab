/**
 * tests/unit/hooks/resolve-paths.test.js
 * Unit tests for hooks/resolve-paths.js
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

// Direct require (not a hook ??it's a utility module)
const ROOT = path.join(__dirname, '..', '..', '..');

let tmpDir, prevCwd;

function freshRequire() {
  const modPath = require.resolve('../../../hooks/resolve-paths');
  delete require.cache[modPath];
  return require(modPath);
}

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ohc-paths-'));
  prevCwd = process.cwd();
  process.chdir(tmpDir);
});

afterEach(() => {
  process.chdir(prevCwd);
  delete process.env.CLAUDE_PLUGIN_ROOT;
  try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch {}
});

describe('keywordMapJson', () => {
  it('resolves beside-hook path first (always works in this repo)', () => {
    const { keywordMapJson } = freshRequire();
    const result = keywordMapJson(tmpDir);
    // Since the hooks/ dir exists in the source repo, it should find keyword-map.json there
    expect(result).toContain('keyword-map.json');
    expect(fs.existsSync(result)).toBe(true);
  });

  it('falls back to .claude/hooks/ path', () => {
    const { keywordMapJson } = freshRequire();
    // Create .claude/hooks/keyword-map.json in the temp dir
    const claudeHooksDir = path.join(tmpDir, '.claude', 'hooks');
    fs.mkdirSync(claudeHooksDir, { recursive: true });
    fs.writeFileSync(path.join(claudeHooksDir, 'keyword-map.json'), '{}');
    // The beside-hook path still wins (it exists in the repo)
    const result = keywordMapJson(tmpDir);
    expect(result).toContain('keyword-map.json');
  });

  it('respects CLAUDE_PLUGIN_ROOT env', () => {
    const pluginRoot = path.join(tmpDir, 'fake-plugin');
    fs.mkdirSync(path.join(pluginRoot, 'hooks'), { recursive: true });
    fs.writeFileSync(path.join(pluginRoot, 'hooks', 'keyword-map.json'), '{"test":true}');
    process.env.CLAUDE_PLUGIN_ROOT = pluginRoot;
    // Need to re-require to pick up env
    const { keywordMapJson } = freshRequire();
    // beside-hook still takes priority since the source repo has it
    const result = keywordMapJson(tmpDir);
    expect(result).toContain('keyword-map.json');
  });
});

describe('skillSkillMd', () => {
  it('resolves .claude/skills/ path when it exists', () => {
    const { skillSkillMd } = freshRequire();
    const skillDir = path.join(tmpDir, '.claude', 'skills', 'test-skill');
    fs.mkdirSync(skillDir, { recursive: true });
    fs.writeFileSync(path.join(skillDir, 'SKILL.md'), '# Test Skill');
    const { abs, rel } = skillSkillMd(tmpDir, 'test-skill');
    expect(abs).toContain('test-skill');
    expect(abs).toContain('SKILL.md');
    expect(rel).toContain('.claude/skills/test-skill/SKILL.md');
    expect(fs.existsSync(abs)).toBe(true);
  });

  it('falls back to skills/ path', () => {
    const { skillSkillMd } = freshRequire();
    const skillDir = path.join(tmpDir, 'skills', 'my-skill');
    fs.mkdirSync(skillDir, { recursive: true });
    fs.writeFileSync(path.join(skillDir, 'SKILL.md'), '# My Skill');
    const { abs, rel } = skillSkillMd(tmpDir, 'my-skill');
    expect(abs).toContain('my-skill');
    expect(rel).toBe('skills/my-skill/SKILL.md');
  });

  it('returns path even when file does not exist', () => {
    const { skillSkillMd } = freshRequire();
    const { abs, rel } = skillSkillMd(tmpDir, 'nonexistent');
    expect(abs).toContain('nonexistent');
    expect(rel).toContain('nonexistent');
    // Path returned but file won't exist
    expect(fs.existsSync(abs)).toBe(false);
  });

  it('prefers .claude/skills over skills/', () => {
    const { skillSkillMd } = freshRequire();
    // Create both
    const claudeSkill = path.join(tmpDir, '.claude', 'skills', 'dual');
    const srcSkill = path.join(tmpDir, 'skills', 'dual');
    fs.mkdirSync(claudeSkill, { recursive: true });
    fs.mkdirSync(srcSkill, { recursive: true });
    fs.writeFileSync(path.join(claudeSkill, 'SKILL.md'), '# Claude version');
    fs.writeFileSync(path.join(srcSkill, 'SKILL.md'), '# Source version');
    const { abs } = skillSkillMd(tmpDir, 'dual');
    const content = fs.readFileSync(abs, 'utf8');
    expect(content).toContain('Claude version');
  });

  it('respects CLAUDE_PLUGIN_ROOT', () => {
    const pluginRoot = path.join(tmpDir, 'plugin');
    const skillDir = path.join(pluginRoot, 'skills', 'plugin-skill');
    fs.mkdirSync(skillDir, { recursive: true });
    fs.writeFileSync(path.join(skillDir, 'SKILL.md'), '# Plugin Skill');
    process.env.CLAUDE_PLUGIN_ROOT = pluginRoot;
    const { skillSkillMd } = freshRequire();
    const { abs } = skillSkillMd(tmpDir, 'plugin-skill');
    expect(fs.readFileSync(abs, 'utf8')).toContain('Plugin Skill');
  });
});
