/**
 * tests/unit/scripts/team/result.test.js
 */
const fs = require('fs');
const path = require('path');
const os = require('os');

describe('team/result.js', () => {
  let tmpDir;
  let resultModule;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ohc-result-'));
    vi.spyOn(process, 'cwd').mockReturnValue(tmpDir);
    vi.resetModules();
    resultModule = require('../../../../scripts/team/result');
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
    vi.restoreAllMocks();
  });

  it('resultPath returns correct path', () => {
    const p = resultModule.resultPath('t1', 'w1');
    expect(p).toBe(path.join(tmpDir, '.ohc', 'state', 'team', 't1', 'workers', 'w1', 'RESULT.json'));
  });

  it('write and read result', () => {
    const data = { status: 'success', notes: 'test notes' };
    const written = resultModule.write('t1', 'w1', data);
    expect(written.status).toBe('success');
    expect(written.notes).toBe('test notes');
    expect(written.files_changed).toEqual([]);
    
    const read = resultModule.read('t1', 'w1');
    expect(read).toEqual(written);
  });

  it('read returns null if no result', () => {
    expect(resultModule.read('t1', 'w2')).toBeNull();
  });

  it('readAll returns all worker results', () => {
    fs.mkdirSync(path.join(tmpDir, '.ohc', 'state', 'team', 't1', 'workers', 'w1'), { recursive: true });
    fs.mkdirSync(path.join(tmpDir, '.ohc', 'state', 'team', 't1', 'workers', 'w2'), { recursive: true });

    resultModule.write('t1', 'w1', { status: 'success' });
    
    console.log('readdirSync:', fs.readdirSync(path.join(tmpDir, '.ohc', 'state', 'team', 't1', 'workers')));
    const all = resultModule.readAll('t1');
    expect(all).toHaveLength(2);
    const w1 = all.find(w => w.name === 'w1');
    const w2 = all.find(w => w.name === 'w2');
    expect(w1.result.status).toBe('success');
    expect(w2.result).toBeNull();
  });

  it('allComplete returns true only if all workers have result', () => {
    fs.mkdirSync(path.join(tmpDir, '.ohc', 'state', 'team', 't1', 'workers', 'w1'), { recursive: true });
    fs.mkdirSync(path.join(tmpDir, '.ohc', 'state', 'team', 't1', 'workers', 'w2'), { recursive: true });

    expect(resultModule.allComplete('t1')).toBe(false);
    
    resultModule.write('t1', 'w1', { status: 'success' });
    expect(resultModule.allComplete('t1')).toBe(false);

    resultModule.write('t1', 'w2', { status: 'success' });
    expect(resultModule.allComplete('t1')).toBe(true);
  });

  it('summarize computes correctly', () => {
    fs.mkdirSync(path.join(tmpDir, '.ohc', 'state', 'team', 't1', 'workers', 'w1'), { recursive: true });
    fs.mkdirSync(path.join(tmpDir, '.ohc', 'state', 'team', 't1', 'workers', 'w2'), { recursive: true });
    fs.mkdirSync(path.join(tmpDir, '.ohc', 'state', 'team', 't1', 'workers', 'w3'), { recursive: true });
    fs.mkdirSync(path.join(tmpDir, '.ohc', 'state', 'team', 't1', 'workers', 'w4'), { recursive: true });

    resultModule.write('t1', 'w1', { status: 'success' });
    resultModule.write('t1', 'w2', { status: 'failed' });
    resultModule.write('t1', 'w3', { status: 'blocked' });
    // w4 has no result (so it's counted as failed)

    const sum = resultModule.summarize('t1');
    expect(sum.workers).toBe(4);
    expect(sum.succeeded).toBe(1);
    expect(sum.failed).toBe(2); // w2 and w4
    expect(sum.blocked).toBe(1); // w3
    expect(sum.failing_workers).toContain('w2');
    expect(sum.failing_workers).toContain('w3');
    expect(sum.failing_workers).toContain('w4');
  });

  it('summarize handles test failures', () => {
    fs.mkdirSync(path.join(tmpDir, '.ohc', 'state', 'team', 't1', 'workers', 'w1'), { recursive: true });
    resultModule.write('t1', 'w1', { status: 'success', tests: { passed: 0, failed: 2, skipped: 0 } });

    const sum = resultModule.summarize('t1');
    expect(sum.succeeded).toBe(1);
    expect(sum.tests_failed).toBe(2);
    expect(sum.failing_workers).toContain('w1');
  });
});
