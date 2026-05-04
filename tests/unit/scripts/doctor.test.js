/**
 * tests/unit/scripts/doctor.test.js
 */
const { spawnSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');

const ROOT = path.join(__dirname, '..', '..', '..');
const DOCTOR = path.join(ROOT, 'scripts', 'doctor.js');

describe('doctor.js', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ohc-doctor-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('reports missing .ohc', () => {
    const res = spawnSync(process.execPath, [DOCTOR], {
      cwd: tmpDir,
      encoding: 'utf8',
      env: { ...process.env }
    });
    expect(res.stdout).toContain('.ohc missing');
  });

  it('reports valid .ohc and passes successfully (mostly) when env vars are present', () => {
    fs.mkdirSync(path.join(tmpDir, '.ohc', 'state'), { recursive: true });
    fs.writeFileSync(path.join(tmpDir, '.ohc', 'notepad.md'), 'test');
    
    // Simulate user config
    fs.mkdirSync(path.join(tmpDir, '.ohc-home'), { recursive: true });
    
    // We mock homedir by running a modified env? os.homedir() might not respect HOME on Windows 
    // but the script just uses os.homedir(). It might complain about missing Cursor rules, etc.
    
    const res = spawnSync(process.execPath, [DOCTOR], {
      cwd: tmpDir,
      encoding: 'utf8',
      env: { 
        ...process.env,
        GITHUB_PERSONAL_ACCESS_TOKEN: '123',
        BRAVE_API_KEY: '123',
        CONTEXT7_API_KEY: '123',
        FIRECRAWL_API_KEY: '123'
      }
    });

    expect(res.stdout).toContain('.ohc present');
    expect(res.stdout).toContain('.ohc/state writable');
    // Exit code might still be 1 if package.json checks fail, but wait, the script checks if CWD package.json is colab.
    // In our temp dir, there is no package.json, so the version drift check won't happen.
    // Exit code should be 0.
    expect(res.status).toBe(0);
  });
});
