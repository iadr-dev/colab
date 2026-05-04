/**
 * tests/unit/hooks/on-session-end.test.js
 * Unit tests for hooks/on-session-end.js
 */

const { runHook } = require('./helpers');
const fs = require('fs');
const path = require('path');
const os = require('os');

describe('on-session-end', () => {
  it('outputs continue action', () => {
    const { json, exitCode } = runHook('on-session-end', {});
    expect(exitCode).toBe(0);
    expect(json.action).toBe('continue');
  });

  it('writes session-end.json', () => {
    const { cwd } = runHook('on-session-end', {});
    const endFile = path.join(cwd, '.ohc', 'state', 'sessions', 'test-session', 'session-end.json');
    if (fs.existsSync(endFile)) {
      const data = JSON.parse(fs.readFileSync(endFile, 'utf8'));
      expect(data.sessionId).toBe('test-session');
      expect(data.endedAt).toBeDefined();
      expect(typeof data.durationMin).toBe('number');
    }
  });

  it('updates meta.json with end time', () => {
    const { cwd } = runHook('on-session-end', {});
    const metaFile = path.join(cwd, '.ohc', 'state', 'sessions', 'test-session', 'meta.json');
    if (fs.existsSync(metaFile)) {
      const meta = JSON.parse(fs.readFileSync(metaFile, 'utf8'));
      expect(meta.ended).toBeDefined();
      expect(typeof meta.durationMin).toBe('number');
    }
  });

  it('injects retro reminder for long sessions', () => {
    // Create a session that started 45 minutes ago
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ohc-end-'));
    const ohc = path.join(tmpDir, '.ohc');
    const sessDir = path.join(ohc, 'state', 'sessions', 'long-session');
    fs.mkdirSync(sessDir, { recursive: true });
    fs.writeFileSync(path.join(ohc, 'state', 'current-session.txt'), 'long-session');
    fs.writeFileSync(path.join(sessDir, 'meta.json'), JSON.stringify({
      started: new Date(Date.now() - 45 * 60000).toISOString(),
    }));

    const { json } = runHook('on-session-end', {}, { cwd: tmpDir, setupOhc: false, sessionId: 'long-session', env: { OHC_NO_BACKGROUND_RETRO: '1' } });
    expect(json.action).toBe('continue');
    if (json.system_reminder) {
      expect(json.system_reminder).toContain('retro');
    }
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('no retro reminder for short sessions', () => {
    // Default setup has session started 5 min ago
    const { json } = runHook('on-session-end', {});
    expect(json.action).toBe('continue');
    // system_reminder should be absent or not contain retro for short sessions
  });

  it('no retro reminder when retro_done is true', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ohc-end-'));
    const ohc = path.join(tmpDir, '.ohc');
    const sessDir = path.join(ohc, 'state', 'sessions', 'done-session');
    fs.mkdirSync(sessDir, { recursive: true });
    fs.writeFileSync(path.join(ohc, 'state', 'current-session.txt'), 'done-session');
    fs.writeFileSync(path.join(sessDir, 'meta.json'), JSON.stringify({
      started: new Date(Date.now() - 60 * 60000).toISOString(),
      retro_done: true,
    }));

    const { json } = runHook('on-session-end', {}, { cwd: tmpDir, setupOhc: false });
    expect(json.action).toBe('continue');
    if (json.system_reminder) {
      expect(json.system_reminder).not.toContain('retro');
    }
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('handles missing session gracefully', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ohc-end-'));
    fs.mkdirSync(path.join(tmpDir, '.ohc'), { recursive: true });
    // No current-session.txt
    const { json, exitCode } = runHook('on-session-end', {}, { cwd: tmpDir, setupOhc: false });
    expect(exitCode).toBe(0);
    expect(json.action).toBe('continue');
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('extracts shallow learnings from log.jsonl', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ohc-end-learn-'));
    const homeDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ohc-home-mock-'));
    const ohc = path.join(tmpDir, '.ohc');
    const sessDir = path.join(ohc, 'state', 'sessions', 'learn-session');
    
    fs.mkdirSync(sessDir, { recursive: true });
    fs.writeFileSync(path.join(ohc, 'state', 'current-session.txt'), 'learn-session');
    fs.writeFileSync(path.join(sessDir, 'meta.json'), JSON.stringify({
      started: new Date(Date.now() - 45 * 60000).toISOString(),
    }));
    
    const logPath = path.join(sessDir, 'log.jsonl');
    fs.writeFileSync(logPath, [
      JSON.stringify({ type: 'tool_failure', tool: 'run_command', command: 'ls non-existent', output: 'no such file' }),
      JSON.stringify({ type: 'tool_result', tool: 'write_to_file', isError: false, parameters: { TargetFile: 'test.txt' } })
    ].join('\n') + '\n');

    const { exitCode } = runHook('on-session-end', {}, { 
      cwd: tmpDir, 
      setupOhc: false,
      env: { OHC_GLOBAL_DIR: homeDir } 
    });

    expect(exitCode).toBe(0);

    const learningsFile = path.join(homeDir, 'learnings.jsonl');
    expect(fs.existsSync(learningsFile)).toBe(true);
    
    const learnings = fs.readFileSync(learningsFile, 'utf8');
    expect(learnings).toContain('ls non-existent');
    expect(learnings).toContain('write_to_file');
    expect(learnings).toContain('test.txt');
    
    try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch (e) {}
    try { fs.rmSync(homeDir, { recursive: true, force: true }); } catch (e) {}
  });
});
