/**
 * tests/unit/scripts/team/tmux.test.js
 */
const { 
  isAvailable, isProviderCliAvailable, ensureSession, spawnPane, spawnWorkers, getPaneOutput,
  pollExitStatuses, allExited, sentinelPath
} = require('../../../../scripts/team/tmux');
const cp = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

describe('team/tmux.js', () => {
  let tmpDir;
  let execSyncSpy;
  let spawnSyncSpy;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ohc-tmux-'));
    vi.spyOn(process, 'cwd').mockReturnValue(tmpDir);
    
    execSyncSpy = vi.spyOn(cp, 'execSync').mockReturnValue(Buffer.from(''));
    spawnSyncSpy = vi.spyOn(cp, 'spawnSync').mockReturnValue({ status: 0, stdout: Buffer.from('') });
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
    vi.restoreAllMocks();
  });

  it('isAvailable returns true if tmux exists', () => {
    expect(isAvailable()).toBe(true);
    expect(execSyncSpy).toHaveBeenCalledWith('which tmux', { stdio: 'pipe' });
  });

  it('isAvailable returns false if tmux does not exist', () => {
    execSyncSpy.mockImplementation(() => { throw new Error('not found'); });
    expect(isAvailable()).toBe(false);
  });

  it('isProviderCliAvailable returns true if provider cli exists', () => {
    expect(isProviderCliAvailable('gemini')).toBe(true);
  });

  it('isProviderCliAvailable returns false if provider cli does not exist', () => {
    execSyncSpy.mockImplementation(() => { throw new Error('not found'); });
    expect(isProviderCliAvailable('gemini')).toBe(false);
  });

  it('ensureSession creates session if not exists', () => {
    spawnSyncSpy.mockReturnValueOnce({ status: 1 }); // has-session fails
    ensureSession('test-session');
    expect(spawnSyncSpy).toHaveBeenCalledWith('tmux', ['has-session', '-t', 'test-session'], { stdio: 'pipe' });
    expect(spawnSyncSpy).toHaveBeenCalledWith('tmux', ['new-session', '-d', '-s', 'test-session'], { stdio: 'pipe' });
  });

  it('ensureSession does not create session if exists', () => {
    spawnSyncSpy.mockReturnValueOnce({ status: 0 }); // has-session succeeds
    ensureSession('test-session');
    expect(spawnSyncSpy).toHaveBeenCalledTimes(1);
  });

  it('spawnPane calls tmux new-window', () => {
    spawnPane('session1', 'window1', 'echo hello');
    expect(spawnSyncSpy).toHaveBeenCalledWith('tmux', ['new-window', '-t', 'session1', '-n', 'window1', 'echo hello'], { stdio: 'pipe' });
  });

  it('getPaneOutput calls tmux capture-pane', () => {
    spawnSyncSpy.mockReturnValue({ stdout: Buffer.from('pane output\n') });
    const output = getPaneOutput('session1', 'window1');
    expect(output).toBe('pane output');
    expect(spawnSyncSpy).toHaveBeenCalledWith('tmux', ['capture-pane', '-t', 'session1:window1', '-p', '-S', '-50'], { stdio: 'pipe', encoding: 'utf8' });
  });

  it('pollExitStatuses returns exit statuses', () => {
    const s1 = sentinelPath('t1', 'w1');
    const s2 = sentinelPath('t1', 'w2');
    fs.mkdirSync(path.dirname(s1), { recursive: true });
    fs.writeFileSync(s1, '0\n');
    
    const statuses = pollExitStatuses('t1', ['w1', 'w2']);
    expect(statuses.workers[0].exited).toBe(true);
    expect(statuses.workers[0].rc).toBe(0);
    expect(statuses.workers[1].exited).toBe(false);
  });

  it('allExited returns true if all sentinels exist', () => {
    fs.mkdirSync(path.dirname(sentinelPath('t1', 'w1')), { recursive: true });
    fs.mkdirSync(path.dirname(sentinelPath('t1', 'w2')), { recursive: true });
    fs.writeFileSync(sentinelPath('t1', 'w1'), '0');
    fs.writeFileSync(sentinelPath('t1', 'w2'), '1');
    expect(allExited('t1', ['w1', 'w2'])).toBe(true);
  });

  it('allExited returns false if any sentinel missing', () => {
    fs.mkdirSync(path.dirname(sentinelPath('t1', 'w1')), { recursive: true });
    fs.writeFileSync(sentinelPath('t1', 'w1'), '0');
    expect(allExited('t1', ['w1', 'w2'])).toBe(false);
  });

  it('spawnWorkers spawns workers if tmux available', () => {
    const res = spawnWorkers('t1', 'gemini', [{ name: 'w1', worktree: '/path/w1', task: 'test "quotes"' }]);
    expect(res.success).toBe(true);
    expect(res.sessionName).toBe('ohc-t1');
    
    const calls = spawnSyncSpy.mock.calls;
    const newWindowCall = calls.find(c => c[1][0] === 'new-window');
    expect(newWindowCall).toBeDefined();
    expect(newWindowCall[1]).toContain('w1');
    expect(newWindowCall[1].join(' ')).toContain('test \\"quotes\\"');
    expect(newWindowCall[1].join(' ')).toContain('gemini');
  });

  it('spawnWorkers returns error if tmux not available', () => {
    execSyncSpy.mockImplementation(() => { throw new Error('not found'); });
    const res = spawnWorkers('t1', 'gemini', []);
    expect(res.success).toBe(false);
    expect(res.error).toContain('tmux not found');
  });
});
