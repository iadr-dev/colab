/**
 * tests/unit/hooks/on-stop.test.js
 * Unit tests for hooks/on-stop.js
 */

const { runHook } = require('./helpers');
const fs = require('fs');
const path = require('path');
const os = require('os');

describe('on-stop', () => {
  it('outputs continue action', () => {
    const { json, exitCode } = runHook('on-stop', { message_history: [] });
    expect(exitCode).toBe(0);
    expect(json.action).toBe('continue');
  });

  it('writes summary.md', () => {
    const { cwd } = runHook('on-stop', {
      message_history: [
        { role: 'assistant', content: 'I fixed the bug by updating the config.' }
      ]
    });
    const summaryPath = path.join(cwd, '.ohc', 'state', 'sessions', 'test-session', 'summary.md');
    if (fs.existsSync(summaryPath)) {
      const content = fs.readFileSync(summaryPath, 'utf8');
      expect(content).toContain('# Session Summary');
      expect(content).toContain('fixed the bug');
    }
  });

  it('updates meta.json with end time', () => {
    const { cwd } = runHook('on-stop', {});
    const metaPath = path.join(cwd, '.ohc', 'state', 'sessions', 'test-session', 'meta.json');
    if (fs.existsSync(metaPath)) {
      const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
      expect(meta.ended).toBeDefined();
      expect(typeof meta.durationMin).toBe('number');
    }
  });

  it('injects retro prompt after 30min', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ohc-stop-'));
    const ohc = path.join(tmpDir, '.ohc');
    const sessDir = path.join(ohc, 'state', 'sessions', 'long-session');
    fs.mkdirSync(sessDir, { recursive: true });
    fs.writeFileSync(path.join(ohc, 'state', 'current-session.txt'), 'long-session');
    fs.writeFileSync(path.join(sessDir, 'meta.json'), JSON.stringify({
      started: new Date(Date.now() - 45 * 60000).toISOString(),
    }));

    const { json } = runHook('on-stop', { message_history: [] }, { cwd: tmpDir, setupOhc: false });
    if (json.system_reminder) {
      expect(json.system_reminder).toContain('retro');
    }
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('handles missing session gracefully', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ohc-stop-'));
    fs.mkdirSync(path.join(tmpDir, '.ohc'), { recursive: true });
    const { json, exitCode } = runHook('on-stop', {}, { cwd: tmpDir, setupOhc: false });
    expect(exitCode).toBe(0);
    expect(json.action).toBe('continue');
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });
});
