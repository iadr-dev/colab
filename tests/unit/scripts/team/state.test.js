/**
 * tests/unit/scripts/team/state.test.js
 */
const fs = require('fs');
const path = require('path');
const os = require('os');

describe('team/state.js', () => {
  let tmpDir;
  let stateModule;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ohc-state-'));
    vi.spyOn(process, 'cwd').mockReturnValue(tmpDir);
    vi.resetModules();
    stateModule = require('../../../../scripts/team/state');
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
    vi.restoreAllMocks();
  });

  it('init creates initial state', () => {
    const s = stateModule.init('t1', { provider: 'claude', n: 2, task: 'test' });
    expect(s.teamId).toBe('t1');
    expect(s.stage).toBe('team-plan');
    expect(stateModule.readState('t1').teamId).toBe('t1');
  });

  it('updateState updates existing state', () => {
    stateModule.init('t1', { provider: 'claude', n: 2, task: 'test' });
    const s = stateModule.updateState('t1', { status: 'done' });
    expect(s.status).toBe('done');
    expect(stateModule.readState('t1').status).toBe('done');
  });

  it('recordWorkerStart and getWorkers', () => {
    stateModule.init('t1', { provider: 'claude', n: 2, task: 'test' });
    stateModule.recordWorkerStart('t1', 'w1', { pid: 123 });
    const workers = stateModule.getWorkers('t1');
    expect(workers).toHaveLength(1);
    expect(workers[0].name).toBe('w1');
    expect(workers[0].started.pid).toBe(123);
    expect(workers[0].completed).toBeNull();
  });

  it('recordWorkerComplete', () => {
    stateModule.init('t1', { provider: 'claude', n: 2, task: 'test' });
    stateModule.recordWorkerStart('t1', 'w1', { pid: 123 });
    stateModule.recordWorkerComplete('t1', 'w1', { result: 'ok' });
    const workers = stateModule.getWorkers('t1');
    expect(workers[0].completed.result).toBe('ok');
    expect(workers[0].completed.startedAt).toBeDefined();
  });

  it('recordHandoff and hasHandoff', () => {
    stateModule.init('t1', { provider: 'claude', n: 2, task: 'test' });
    expect(stateModule.hasHandoff('t1', 'team-verify', 'team-fix')).toBeNull();
    stateModule.recordHandoff('t1', 'team-verify', 'team-fix', { notes: 'test' });
    const handoff = stateModule.hasHandoff('t1', 'team-verify', 'team-fix');
    expect(handoff.from).toBe('team-verify');
    expect(handoff.to).toBe('team-fix');
    expect(handoff.notes).toBe('test');
    expect(stateModule.readState('t1').stage).toBe('team-fix');
  });

  it('listTeams returns active teams', () => {
    stateModule.init('t1', { provider: 'claude', n: 2, task: 'test' });
    stateModule.init('t2', { provider: 'openai', n: 1, task: 'test2' });
    const teams = stateModule.listTeams();
    expect(teams).toHaveLength(2);
    expect(teams.map(t => t.teamId)).toEqual(expect.arrayContaining(['t1', 't2']));
  });
});
