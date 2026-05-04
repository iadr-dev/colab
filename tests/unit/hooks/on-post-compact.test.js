/**
 * tests/unit/hooks/on-post-compact.test.js
 * Unit tests for hooks/on-post-compact.js
 */

const { runHook } = require('./helpers');
const fs = require('fs');
const path = require('path');
const os = require('os');

describe('on-post-compact', () => {
  it('outputs system_reminder JSON', () => {
    const { json, exitCode } = runHook('on-post-compact', '{}');
    expect(exitCode).toBe(0);
    expect(json).toBeDefined();
    expect(json.type).toBe('system_reminder');
    expect(json.content).toContain('ohc_post_compact_reinjection');
  });

  it('re-injects PROJECT.md after compaction', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ohc-postcomp-'));
    const ohc = path.join(tmpDir, '.ohc');
    fs.mkdirSync(path.join(ohc, 'state'), { recursive: true });
    fs.writeFileSync(path.join(ohc, 'PROJECT.md'), '# My Project\nCritical context.');
    const { json } = runHook('on-post-compact', '{}', { cwd: tmpDir, setupOhc: false });
    expect(json.content).toContain('My Project');
    expect(json.content).toContain('Critical context');
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('re-injects notepad after compaction', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ohc-postcomp-'));
    const ohc = path.join(tmpDir, '.ohc');
    fs.mkdirSync(path.join(ohc, 'state'), { recursive: true });
    fs.writeFileSync(path.join(ohc, 'notepad.md'), '## Current Task\nFix the bug');
    const { json } = runHook('on-post-compact', '{}', { cwd: tmpDir, setupOhc: false });
    expect(json.content).toContain('Fix the bug');
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('re-injects active skill names', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ohc-postcomp-'));
    const ohc = path.join(tmpDir, '.ohc');
    fs.mkdirSync(path.join(ohc, 'state'), { recursive: true });
    fs.writeFileSync(path.join(ohc, 'state', 'active-skills.json'),
      JSON.stringify({ skills: { tdd: {}, ralph: {} } }));
    const { json } = runHook('on-post-compact', '{}', { cwd: tmpDir, setupOhc: false });
    expect(json.content).toContain('tdd');
    expect(json.content).toContain('ralph');
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('handles missing files gracefully', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ohc-postcomp-'));
    // No .ohc at all
    const { json, exitCode } = runHook('on-post-compact', '{}', { cwd: tmpDir, setupOhc: false });
    expect(exitCode).toBe(0);
    expect(json.type).toBe('system_reminder');
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });
});
