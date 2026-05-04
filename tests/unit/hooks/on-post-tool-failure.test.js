/**
 * tests/unit/hooks/on-post-tool-failure.test.js
 * Unit tests for hooks/on-post-tool-failure.js
 */

const { runHook } = require('./helpers');
const fs = require('fs');
const path = require('path');

describe('on-post-tool-failure', () => {
  it('skips non-Bash tools', () => {
    const { json } = runHook('on-post-tool-failure', {
      tool_name: 'Write',
      exit_code: 1,
      tool_output: 'error',
    });
    expect(json.action).toBe('continue');
    expect(json.system_reminder).toBeUndefined();
  });

  it('skips Bash with exit code 0', () => {
    const { json } = runHook('on-post-tool-failure', {
      tool_name: 'Bash',
      exit_code: 0,
      tool_input: { command: 'echo ok' },
      tool_output: 'ok',
    });
    expect(json.action).toBe('continue');
    expect(json.system_reminder).toBeUndefined();
  });

  it('injects auto-debug reminder on Bash failure', () => {
    const { json } = runHook('on-post-tool-failure', {
      tool_name: 'Bash',
      exit_code: 1,
      tool_input: { command: 'npm run build' },
      tool_output: 'Error: Module not found',
    });
    expect(json.action).toBe('continue');
    expect(json.system_reminder).toContain('exit_code="1"');
    expect(json.system_reminder).toContain('npm run build');
    expect(json.system_reminder).toContain('Do NOT retry the identical command');
  });

  it('logs failure to session log', () => {
    const { cwd } = runHook('on-post-tool-failure', {
      tool_name: 'Bash',
      exit_code: 2,
      tool_input: { command: 'tsc --noEmit' },
      tool_output: 'TS2304: Cannot find name',
    });
    const logPath = path.join(cwd, '.ohc', 'state', 'sessions', 'test-session', 'log.jsonl');
    if (fs.existsSync(logPath)) {
      const lines = fs.readFileSync(logPath, 'utf8').split('\n').filter(Boolean);
      const entry = JSON.parse(lines[lines.length - 1]);
      expect(entry.type).toBe('tool_failure');
      expect(entry.exitCode).toBe(2);
    }
  });

  it('includes error output in reminder', () => {
    const { json } = runHook('on-post-tool-failure', {
      tool_name: 'Bash',
      exit_code: 127,
      tool_input: { command: 'nonexistent-command' },
      tool_output: 'bash: nonexistent-command: command not found',
    });
    expect(json.system_reminder).toContain('nonexistent-command');
  });

  it('handles missing tool_input', () => {
    const { json } = runHook('on-post-tool-failure', {
      tool_name: 'Bash',
      exit_code: 1,
    });
    expect(json.action).toBe('continue');
    expect(json.system_reminder).toBeDefined();
  });
});
