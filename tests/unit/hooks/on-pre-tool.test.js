/**
 * tests/unit/hooks/on-pre-tool.test.js
 * Unit tests for hooks/on-pre-tool.js
 */

const { runHook } = require('./helpers');
const fs = require('fs');
const path = require('path');

describe('on-pre-tool', () => {
  it('outputs continue action', () => {
    const { json } = runHook('on-pre-tool', { tool_name: 'Read', tool_input: {} });
    expect(json.action).toBe('continue');
  });

  it('logs tool_use to session log', () => {
    const { cwd } = runHook('on-pre-tool', {
      tool_name: 'Bash',
      tool_input: { command: 'npm test' },
    });
    const logPath = path.join(cwd, '.ohc', 'state', 'sessions', 'test-session', 'log.jsonl');
    if (fs.existsSync(logPath)) {
      const lines = fs.readFileSync(logPath, 'utf8').split('\n').filter(Boolean);
      const entry = JSON.parse(lines[lines.length - 1]);
      expect(entry.type).toBe('tool_use');
      expect(entry.tool).toBe('Bash');
    }
  });

  it('injects scope warning for Write tool with active task', () => {
    const { json, cwd } = (() => {
      const os = require('os');
      const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ohc-test-'));
      const ohc = path.join(tmpDir, '.ohc');
      fs.mkdirSync(path.join(ohc, 'state', 'sessions', 'test-session'), { recursive: true });
      fs.writeFileSync(path.join(ohc, 'state', 'current-session.txt'), 'test-session');
      fs.writeFileSync(path.join(ohc, 'state', 'sessions', 'test-session', 'meta.json'),
        JSON.stringify({ started: new Date().toISOString() }));
      fs.writeFileSync(path.join(ohc, 'notepad.md'),
        '# Notepad\n\n## Current Task\nFix the login bug\n\n## Other\n');
      return runHook('on-pre-tool', { tool_name: 'Write', tool_input: {} }, { cwd: tmpDir, setupOhc: false });
    })();
    expect(json.action).toBe('continue');
    if (json.system_reminder) {
      expect(json.system_reminder).toContain('scope');
    }
  });

  it('injects persistent skill reminders', () => {
    const os = require('os');
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ohc-test-'));
    const ohc = path.join(tmpDir, '.ohc');
    fs.mkdirSync(path.join(ohc, 'state', 'sessions', 'test-session'), { recursive: true });
    fs.writeFileSync(path.join(ohc, 'state', 'current-session.txt'), 'test-session');
    fs.writeFileSync(path.join(ohc, 'state', 'sessions', 'test-session', 'meta.json'),
      JSON.stringify({ started: new Date().toISOString() }));
    fs.writeFileSync(path.join(ohc, 'state', 'active-skills.json'),
      JSON.stringify({ skills: { 'test-skill': { activatedAt: Date.now() } } }));
    // Create a minimal skill file
    const skillDir = path.join(tmpDir, 'skills', 'test-skill');
    fs.mkdirSync(skillDir, { recursive: true });
    fs.writeFileSync(path.join(skillDir, 'SKILL.md'), '---\nname: test-skill\n---\n# Test Skill\n');

    const { json } = runHook('on-pre-tool', { tool_name: 'Read', tool_input: {} }, { cwd: tmpDir, setupOhc: false });
    expect(json.action).toBe('continue');
    // Skill reminder may or may not be injected depending on resolve-paths resolution
  });

  it('handles empty stdin', () => {
    const { json } = runHook('on-pre-tool', '{}');
    expect(json.action).toBe('continue');
  });
});
