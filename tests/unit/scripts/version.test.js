/**
 * tests/unit/scripts/version.test.js
 */
const fs = require('fs');
const path = require('path');

const VersionManager = require('../../../scripts/version');
const child_process = require('child_process');

describe('version.js', () => {
  let vm;
  let readSpy, writeSpy, existsSpy, execSpy, logSpy, errSpy;

  beforeEach(() => {
    readSpy = vi.spyOn(fs, 'readFileSync').mockImplementation((p) => {
      if (p.includes('package.json')) return JSON.stringify({ version: '1.0.0' });
      if (p.includes('plugin.json') || p.includes('manifest.json')) return JSON.stringify({ version: '1.0.0' });
      if (p.includes('index.js')) return `const config = { version: '1.0.0' };`;
      if (p.includes('CHANGELOG.md')) return `## [Unreleased]\r\n\r\n---\r\n\r\n## [1.0.0] — 2022-01-01`;
      return '';
    });
    writeSpy = vi.spyOn(fs, 'writeFileSync').mockImplementation(() => {});
    existsSpy = vi.spyOn(fs, 'existsSync').mockReturnValue(true);
    execSpy = vi.spyOn(child_process, 'execSync').mockImplementation(() => Buffer.from(''));
    logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    vm = new VersionManager();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('gets current version', () => {
    expect(vm.currentVersion).toBe('1.0.0');
  });

  it('throws on invalid version format', () => {
    expect(() => vm.setVersion('invalid')).toThrow('Invalid version format');
  });

  it('sets version correctly', () => {
    vm.setVersion('1.0.1');
    expect(vm.currentVersion).toBe('1.0.1');
    expect(writeSpy).toHaveBeenCalled();
  });

  it('bumps version correctly (patch)', () => {
    const newVer = vm.bump('patch');
    expect(newVer).toBe('1.0.1');
  });

  it('bumps version correctly (minor)', () => {
    const newVer = vm.bump('minor');
    expect(newVer).toBe('1.1.0');
  });

  it('bumps version correctly (major)', () => {
    const newVer = vm.bump('major');
    expect(newVer).toBe('2.0.0');
  });

  it('checks consistent version', () => {
    const res = vm.check();
    expect(res).toBe(true);
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('All versions are consistent!'));
  });

  it('checks inconsistent version', () => {
    readSpy.mockImplementation((p) => {
      if (p.includes('package.json')) return JSON.stringify({ version: '1.0.0' });
      if (p.includes('plugin.json')) return JSON.stringify({ version: '0.9.0' }); // Drift
      if (p.includes('index.js')) return `const config = { version: '1.0.0' };`;
      return '';
    });
    // recreate VM to fetch initial currentVersion
    vm = new VersionManager();
    const res = vm.check();
    expect(res).toBe(false);
    expect(logSpy).toHaveBeenCalledWith(expect.stringMatching(/Found \d+ inconsistencies/));
  });

  it('fixes versions', () => {
    vm.fix();
    expect(writeSpy).toHaveBeenCalled();
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('Synchronizing all versions'));
  });

  it('tags release', () => {
    vm.tagRelease('1.0.0');
    expect(execSpy).toHaveBeenCalledWith(expect.stringContaining('git tag -a v1.0.0'), expect.any(Object));
  });

  it('updates changelog', () => {
    vm.updateChangelog('1.0.1');
    expect(writeSpy).toHaveBeenCalledWith(expect.stringContaining('CHANGELOG.md'), expect.stringContaining('## [1.0.1]'), 'utf8');
  });
});
