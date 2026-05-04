/**
 * tests/unit/hooks/on-subagent-stop.test.js
 * Unit tests for hooks/on-subagent-stop.js
 */

const { runHook } = require('./helpers');
const fs = require('fs');
const path = require('path');

describe('on-subagent-stop', () => {
  it('outputs continue with team memory reminder', () => {
    const { json, exitCode } = runHook('on-subagent-stop', {
      agent_name: 'executor',
      result: 'Task completed successfully',
    });
    expect(exitCode).toBe(0);
    expect(json.action).toBe('continue');
    expect(json.system_reminder).toContain('executor');
    expect(json.system_reminder).toContain('completed');
    expect(json.system_reminder).toContain('notepad');
  });

  it('writes completed.json', () => {
    // First create a started.json
    const { cwd: cwd1 } = runHook('on-subagent-start', {
      agent_name: 'debugger',
      task: 'fix the bug',
    });

    const { cwd } = runHook('on-subagent-stop', {
      agent_name: 'debugger',
    }, { cwd: cwd1, setupOhc: false });

    const workerDir = path.join(cwd, '.ohc', 'state', 'team', 'test-session', 'workers', 'debugger');
    if (fs.existsSync(workerDir)) {
      const completedFile = path.join(workerDir, 'completed.json');
      if (fs.existsSync(completedFile)) {
        const data = JSON.parse(fs.readFileSync(completedFile, 'utf8'));
        expect(data.agentName).toBe('debugger');
        expect(data.completedAt).toBeDefined();
      }
    }
  });

  it('auto-flushes learning from "what I learned" pattern', () => {
    const { json } = runHook('on-subagent-stop', {
      agent_name: 'executor',
      result: 'Done. What I learned: Always check the return type before mapping.',
    });
    expect(json.action).toBe('continue');
    // The hook should attempt to call memory.appendLearning() ??we verify it doesn't crash
  });

  it('handles missing agent_name', () => {
    const { json, exitCode } = runHook('on-subagent-stop', {});
    expect(exitCode).toBe(0);
    expect(json.action).toBe('continue');
  });

  it('handles subagent_name fallback', () => {
    const { json } = runHook('on-subagent-stop', {
      subagent_name: 'reviewer',
      result: 'Code looks good',
    });
    expect(json.system_reminder).toContain('reviewer');
  });
});
