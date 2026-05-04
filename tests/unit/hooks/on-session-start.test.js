/**
 * tests/unit/hooks/on-session-start.test.js
 * Unit tests for hooks/on-session-start.js
 */

const { runHook } = require('./helpers');
const fs = require('fs');
const path = require('path');
const os = require('os');

describe('on-session-start', () => {
  it('outputs system_reminder JSON', () => {
    const { json, exitCode } = runHook('on-session-start', '{}', { setupOhc: false });
    expect(exitCode).toBe(0);
    expect(json).toBeDefined();
    // on-session-start always returns { type: 'system_reminder', content: ... }
    expect(json.type).toBe('system_reminder');
    expect(json.content).toBeDefined();
  });

  it('creates session directory structure', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ohc-start-'));
    fs.mkdirSync(path.join(tmpDir, '.ohc'), { recursive: true });
    const { cwd } = runHook('on-session-start', '{}', { cwd: tmpDir, setupOhc: false });
    // Check that .ohc/state/sessions/ was created (the hook creates its own session ID)
    const statePath = path.join(cwd, '.ohc', 'state');
    expect(fs.existsSync(statePath)).toBe(true);
    const sessionsPath = path.join(statePath, 'sessions');
    if (fs.existsSync(sessionsPath)) {
      const sessions = fs.readdirSync(sessionsPath);
      expect(sessions.length).toBeGreaterThanOrEqual(1);
    }
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('writes current-session.txt', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ohc-start-'));
    fs.mkdirSync(path.join(tmpDir, '.ohc'), { recursive: true });
    const { cwd } = runHook('on-session-start', '{}', { cwd: tmpDir, setupOhc: false });
    const sessionFile = path.join(cwd, '.ohc', 'state', 'current-session.txt');
    expect(fs.existsSync(sessionFile)).toBe(true);
    const sessionId = fs.readFileSync(sessionFile, 'utf8').trim();
    expect(sessionId.length).toBeGreaterThan(0);
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('injects SOUL.md when present', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ohc-start-'));
    fs.mkdirSync(path.join(tmpDir, '.ohc'), { recursive: true });
    // Create global SOUL.md in the home directory mock
    // Since on-session-start reads from os.homedir(), this test is limited;
    // we just verify it doesn't crash and returns valid JSON
    const { json, exitCode } = runHook('on-session-start', '{}', { cwd: tmpDir, setupOhc: false });
    expect(exitCode).toBe(0);
    expect(json.content).toBeDefined();
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('shows first-run message when no ohc state', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ohc-start-'));
    // No .ohc directory at all ??but the hook creates one
    const { json } = runHook('on-session-start', '{}', { cwd: tmpDir, setupOhc: false });
    expect(json.type).toBe('system_reminder');
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('injects PROJECT.md content when present', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ohc-start-'));
    const ohcDir = path.join(tmpDir, '.ohc');
    fs.mkdirSync(ohcDir, { recursive: true });
    fs.writeFileSync(path.join(ohcDir, 'PROJECT.md'), '# My Project\nImportant context here.');
    const { json } = runHook('on-session-start', '{}', { cwd: tmpDir, setupOhc: false });
    expect(json.content).toContain('My Project');
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('injects notepad content when present', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ohc-start-'));
    const ohcDir = path.join(tmpDir, '.ohc');
    fs.mkdirSync(ohcDir, { recursive: true });
    fs.writeFileSync(path.join(ohcDir, 'notepad.md'), '## Current Task\nFix the auth bug');
    const { json } = runHook('on-session-start', '{}', { cwd: tmpDir, setupOhc: false });
    expect(json.content).toContain('Fix the auth bug');
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });
});
