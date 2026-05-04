/**
 * tests/unit/hooks/on-subagent-start.test.js
 * Unit tests for hooks/on-subagent-start.js
 */

const { runHook } = require('./helpers');
const fs = require('fs');
const path = require('path');

describe('on-subagent-start', () => {
  it('outputs continue action', () => {
    const { json, exitCode } = runHook('on-subagent-start', {
      agent_name: 'executor',
      task: 'implement feature X',
    });
    expect(exitCode).toBe(0);
    expect(json.action).toBe('continue');
  });

  it('creates worker directory and started.json', () => {
    const { cwd } = runHook('on-subagent-start', {
      agent_name: 'verifier',
      task: 'run tests',
    });
    const workerDir = path.join(cwd, '.ohc', 'state', 'team', 'test-session', 'workers', 'verifier');
    if (fs.existsSync(workerDir)) {
      const startedFile = path.join(workerDir, 'started.json');
      expect(fs.existsSync(startedFile)).toBe(true);
      const data = JSON.parse(fs.readFileSync(startedFile, 'utf8'));
      expect(data.agentName).toBe('verifier');
      expect(data.task).toContain('run tests');
      expect(data.startedAt).toBeDefined();
    }
  });

  it('handles missing agent_name', () => {
    const { json, exitCode } = runHook('on-subagent-start', { task: 'some task' });
    expect(exitCode).toBe(0);
    expect(json.action).toBe('continue');
  });

  it('truncates long task text', () => {
    const longTask = 'x'.repeat(1000);
    const { cwd } = runHook('on-subagent-start', {
      agent_name: 'worker',
      task: longTask,
    });
    const workerDir = path.join(cwd, '.ohc', 'state', 'team', 'test-session', 'workers', 'worker');
    if (fs.existsSync(workerDir)) {
      const data = JSON.parse(fs.readFileSync(path.join(workerDir, 'started.json'), 'utf8'));
      expect(data.task.length).toBeLessThanOrEqual(500);
    }
  });

  it('uses subagent_name as fallback', () => {
    const { cwd } = runHook('on-subagent-start', {
      subagent_name: 'planner',
      task: 'create plan',
    });
    const workerDir = path.join(cwd, '.ohc', 'state', 'team', 'test-session', 'workers', 'planner');
    if (fs.existsSync(workerDir)) {
      expect(fs.existsSync(path.join(workerDir, 'started.json'))).toBe(true);
    }
  });
});
