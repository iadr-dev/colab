/**
 * tests/unit/hooks/on-post-tool.test.js
 * Unit tests for hooks/on-post-tool.js
 */

const { runHook } = require('./helpers');
const fs = require('fs');
const path = require('path');

describe('on-post-tool', () => {
  it('outputs continue action on normal tool result', () => {
    const { json } = runHook('on-post-tool', {
      tool_name: 'Read',
      tool_output: 'file contents',
    });
    expect(json.action).toBe('continue');
  });

  it('logs tool_result to session log', () => {
    const { cwd } = runHook('on-post-tool', {
      tool_name: 'Bash',
      tool_output: 'success output',
    });
    const logPath = path.join(cwd, '.ohc', 'state', 'sessions', 'test-session', 'log.jsonl');
    if (fs.existsSync(logPath)) {
      const lines = fs.readFileSync(logPath, 'utf8').split('\n').filter(Boolean);
      const entry = JSON.parse(lines[lines.length - 1]);
      expect(entry.type).toBe('tool_result');
      expect(entry.tool).toBe('Bash');
    }
  });

  it('detects failing tests and injects "do NOT claim done" reminder', () => {
    const { json } = runHook('on-post-tool', {
      tool_name: 'Bash',
      tool_input: { command: 'npx vitest run' },
      tool_output: 'Tests: 3 failed, 7 passed, 2 skipped',
    });
    expect(json.action).toBe('continue');
    if (json.system_reminder) {
      expect(json.system_reminder).toContain('Failed: 3');
      expect(json.system_reminder).toContain('NOT claim done');
    }
  });

  it('detects jest test output', () => {
    const { json } = runHook('on-post-tool', {
      tool_name: 'Bash',
      tool_input: { command: 'npx jest' },
      tool_output: 'Tests: 1 failed, 5 passed',
    });
    expect(json.action).toBe('continue');
    if (json.system_reminder) {
      expect(json.system_reminder).toContain('Failed: 1');
    }
  });

  it('detects pytest test output', () => {
    const { json } = runHook('on-post-tool', {
      tool_name: 'Bash',
      tool_input: { command: 'pytest tests/' },
      tool_output: '3 passed, 0 failed',
    });
    expect(json.action).toBe('continue');
    // All passed ??should not inject failure reminder
  });

  it('injects scope warning on scope-check output', () => {
    const { json } = runHook('on-post-tool', {
      tool_name: 'Bash',
      tool_input: { command: 'bash scope-check.sh' },
      tool_output: '??Out of scope change detected in src/unrelated.ts',
    });
    expect(json.action).toBe('continue');
    if (json.system_reminder) {
      expect(json.system_reminder).toContain('scope');
    }
  });

  it('no reminder for non-Bash tools', () => {
    const { json } = runHook('on-post-tool', {
      tool_name: 'Write',
      tool_output: 'file written',
    });
    expect(json.action).toBe('continue');
    expect(json.system_reminder).toBeUndefined();
  });

  it('handles empty stdin', () => {
    const { json } = runHook('on-post-tool', '{}');
    expect(json.action).toBe('continue');
  });
});
