/**
 * tests/unit/scripts/research-cli.test.js
 */
const fs = require('fs');
const path = require('path');
const os = require('os');
const researchCli = require('../../../scripts/research-cli');
const research = require('../../../scripts/research');


describe('research-cli.js', () => {
  let tmpDir;
  let logSpy, errSpy, exitSpy;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ohc-res-cli-'));
    vi.spyOn(process, 'cwd').mockReturnValue(tmpDir);
    logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    exitSpy = vi.spyOn(process, 'exit').mockImplementation((code) => { throw new Error(`EXIT: ${code}`); });
    // Point research DIR to tmpDir
    Object.defineProperty(research, 'DIR', { get: () => path.join(tmpDir, '.ohc', 'research') });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('prints help when called with no args or help', () => {
    researchCli([]);
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('ohc research — cross-session research cache'));

    researchCli(['help']);
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('ohc research — cross-session research cache'));
  });

  it('handles list with empty cache', () => {
    researchCli(['list']);
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('No cached research'));
  });

  it('handles list with cache entries', () => {
    vi.spyOn(research, 'list').mockReturnValue([
      { library: 'react', topic: 'hooks', age_days: 1, source: 'web', stale: false, verified_working: true }
    ]);
    researchCli(['list']);
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('Cached research'));
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('[fresh 1d] react / hooks ✓  (web)'));
  });

  it('handles show and exits on missing args', () => {
    expect(() => researchCli(['show'])).toThrow('EXIT: 1');
    expect(errSpy).toHaveBeenCalledWith(expect.stringContaining('Usage: ohc research show'));
  });

  it('handles show for non-existent entry', () => {
    vi.spyOn(research, 'lookup').mockReturnValue({ hit: false });
    expect(() => researchCli(['show', 'lib', 'topic'])).toThrow('EXIT: 1');
    expect(errSpy).toHaveBeenCalledWith(expect.stringContaining('No cached entry'));
  });

  it('handles show for existing entry', () => {
    vi.spyOn(research, 'lookup').mockReturnValue({
      hit: true,
      fresh: true,
      age_days: 2,
      path: '/tmp/test.md',
      body: 'test body',
      meta: { library: 'lib', topic: 'topic', source: 'web', fetched: '2022-01-01' }
    });
    researchCli(['show', 'lib', 'topic']);
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('lib / topic'));
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('test body'));
  });

  it('handles search with missing query', () => {
    expect(() => researchCli(['search'])).toThrow('EXIT: 1');
  });

  it('handles search with no matches', () => {
    vi.spyOn(research, 'search').mockReturnValue([]);
    researchCli(['search', 'query']);
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('No matches'));
  });

  it('handles search with matches', () => {
    vi.spyOn(research, 'search').mockReturnValue([{ library: 'lib', topic: 'topic', snippet: 'snip' }]);
    researchCli(['search', 'query']);
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('match(es)'));
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('lib / topic'));
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('snip'));
  });

  it('handles prune', () => {
    vi.spyOn(research, 'prune').mockReturnValue({ removed: ['test.md'] });
    researchCli(['prune']);
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('Pruned 1'));
  });

  it('handles prune --older-than', () => {
    const pruneSpy = vi.spyOn(research, 'prune').mockReturnValue({ removed: ['test.md'] });
    researchCli(['prune', '--older-than', '5']);
    expect(pruneSpy).toHaveBeenCalledWith({ olderThanDays: 5, expiredOnly: false });
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('Pruned 1'));
  });

  it('handles clear when dir missing', () => {
    researchCli(['clear']);
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('Nothing to clear'));
  });

  it('handles clear when dir exists', () => {
    const resDir = path.join(tmpDir, '.ohc', 'research');
    fs.mkdirSync(resDir, { recursive: true });
    fs.writeFileSync(path.join(resDir, 'test.md'), 'test');
    fs.writeFileSync(path.join(resDir, 'test.json'), 'test'); // Should ignore non-md
    
    researchCli(['clear']);
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('Cleared 1 entries'));
    expect(fs.existsSync(path.join(resDir, 'test.md'))).toBe(false);
    expect(fs.existsSync(path.join(resDir, 'test.json'))).toBe(true);
  });

  it('handles verify on missing args', () => {
    expect(() => researchCli(['verify'])).toThrow('EXIT: 1');
  });

  it('handles verify with non-existent entry', () => {
    vi.spyOn(research, 'markVerified').mockReturnValue(false);
    expect(() => researchCli(['verify', 'lib', 'topic'])).toThrow('EXIT: 1');
  });

  it('handles verify on existing entry', () => {
    vi.spyOn(research, 'markVerified').mockReturnValue(true);
    researchCli(['verify', 'lib', 'topic', 'commit123']);
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('Marked lib / topic as verified-working (commit commit123)'));
  });

  it('handles unknown subcommand', () => {
    expect(() => researchCli(['unknown'])).toThrow('EXIT: 1');
    expect(errSpy).toHaveBeenCalledWith(expect.stringContaining('Unknown subcommand: unknown'));
  });
});
