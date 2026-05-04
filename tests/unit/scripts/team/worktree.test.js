/**
 * tests/unit/scripts/team/worktree.test.js
 */
const { 
  worktreePath, create, isDirty, remove, list, mergeAll
} = require('../../../../scripts/team/worktree');
const cp = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

describe('team/worktree.js', () => {
  let tmpDir;
  let spawnSyncSpy;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ohc-worktree-'));
    vi.spyOn(process, 'cwd').mockReturnValue(tmpDir);
    
    spawnSyncSpy = vi.spyOn(cp, 'spawnSync').mockReturnValue({ status: 0, stdout: '', stderr: '' });
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
    vi.restoreAllMocks();
  });

  it('worktreePath returns correct path', () => {
    const p = worktreePath('t1', 'w1');
    expect(p).toBe(path.join(tmpDir, '.ohc', 'team', 't1', 'worktrees', 'w1'));
  });

  it('create sets up worktree and branch', () => {
    const res = create('t1', 'w1');
    expect(res.success).toBe(true);
    expect(res.branch).toBe('ohc/t1-w1');
    expect(res.worktree).toBe(worktreePath('t1', 'w1'));
    
    expect(spawnSyncSpy).toHaveBeenCalledWith('git', [
      'worktree', 'add', worktreePath('t1', 'w1'), '-b', 'ohc/t1-w1', 'HEAD'
    ], expect.any(Object));
  });

  it('create handles git failure', () => {
    spawnSyncSpy.mockReturnValue({ status: 1, stderr: 'error' });
    const res = create('t1', 'w1');
    expect(res.success).toBe(false);
    expect(res.error).toBe('error');
  });

  it('isDirty returns true if git status has output', () => {
    const wt = path.join(tmpDir, 'wt');
    fs.mkdirSync(wt, { recursive: true });
    spawnSyncSpy.mockReturnValue({ status: 0, stdout: ' M file.txt\n' });
    expect(isDirty(wt)).toBe(true);
    expect(spawnSyncSpy).toHaveBeenCalledWith('git', ['status', '--porcelain'], expect.objectContaining({ cwd: wt }));
  });

  it('isDirty returns false if git status is empty', () => {
    const wt = path.join(tmpDir, 'wt');
    fs.mkdirSync(wt, { recursive: true });
    spawnSyncSpy.mockReturnValue({ status: 0, stdout: '' });
    expect(isDirty(wt)).toBe(false);
  });

  it('isDirty returns false if worktree does not exist', () => {
    expect(isDirty(path.join(tmpDir, 'nonexistent'))).toBe(false);
    expect(spawnSyncSpy).not.toHaveBeenCalled();
  });

  it('remove returns success if worktree does not exist', () => {
    const res = remove('t1', 'w1');
    expect(res.success).toBe(true);
    expect(res.wasDirty).toBe(false);
    expect(spawnSyncSpy).not.toHaveBeenCalled();
  });

  it('remove succeeds for clean worktree', () => {
    const wt = worktreePath('t1', 'w1');
    fs.mkdirSync(wt, { recursive: true });
    spawnSyncSpy.mockReturnValueOnce({ status: 0, stdout: '' }); // isDirty
    spawnSyncSpy.mockReturnValueOnce({ status: 0 }); // git worktree remove
    
    const res = remove('t1', 'w1');
    expect(res.success).toBe(true);
    expect(res.wasDirty).toBe(false);
    expect(spawnSyncSpy).toHaveBeenCalledWith('git', ['worktree', 'remove', wt], expect.any(Object));
  });

  it('remove fails for dirty worktree without force', () => {
    const wt = worktreePath('t1', 'w1');
    fs.mkdirSync(wt, { recursive: true });
    spawnSyncSpy.mockReturnValueOnce({ status: 0, stdout: ' M file' }); // isDirty
    
    const res = remove('t1', 'w1');
    expect(res.success).toBe(false);
    expect(res.wasDirty).toBe(true);
    expect(res.error).toContain('uncommitted changes');
  });

  it('remove succeeds for dirty worktree with force', () => {
    const wt = worktreePath('t1', 'w1');
    fs.mkdirSync(wt, { recursive: true });
    spawnSyncSpy.mockReturnValueOnce({ status: 0, stdout: ' M file' }); // isDirty
    spawnSyncSpy.mockReturnValueOnce({ status: 0 }); // git worktree remove --force
    
    const res = remove('t1', 'w1', { force: true });
    expect(res.success).toBe(true);
    expect(res.wasDirty).toBe(true);
    expect(spawnSyncSpy).toHaveBeenCalledWith('git', ['worktree', 'remove', wt, '--force'], expect.any(Object));
  });

  it('list parses git worktree list --porcelain', () => {
    spawnSyncSpy.mockReturnValue({
      status: 0,
      stdout: `worktree /path/to/.ohc/team/t1/worktrees/w1
branch refs/heads/ohc/t1-w1

worktree /path/to/other
branch refs/heads/other

`
    });
    
    const results = list();
    expect(results).toHaveLength(1);
    expect(results[0].worktree).toBe('/path/to/.ohc/team/t1/worktrees/w1');
    expect(results[0].branch).toBe('refs/heads/ohc/t1-w1');
  });

  it('mergeAll skips missing branches', () => {
    spawnSyncSpy.mockReturnValueOnce({ status: 1 }); // b1 does not exist
    spawnSyncSpy.mockReturnValueOnce({ status: 0 }); // b2 exists
    spawnSyncSpy.mockReturnValueOnce({ status: 0 }); // merge b2 succeeds
    
    const res = mergeAll('t1', ['b1', 'b2']);
    expect(res.skipped).toContain('b1');
    expect(res.merged).toContain('b2');
    expect(res.conflicted).toHaveLength(0);
  });

  it('mergeAll stops on conflict', () => {
    spawnSyncSpy.mockReturnValueOnce({ status: 0 }); // b1 exists
    spawnSyncSpy.mockReturnValueOnce({ status: 1 }); // merge b1 fails
    spawnSyncSpy.mockReturnValueOnce({ status: 0 }); // b2 exists (but won't be reached)
    
    const res = mergeAll('t1', ['b1', 'b2']);
    expect(res.merged).toHaveLength(0);
    expect(res.conflicted).toContain('b1');
    expect(res.skipped).toHaveLength(0);
    expect(spawnSyncSpy).toHaveBeenCalledTimes(2); // check b1, merge b1
  });
});
