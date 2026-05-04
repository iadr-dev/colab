const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFileSync } = require('child_process');

function createTempEnv() {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ohc-test-'));
  const cwd = path.join(tmpDir, 'project');
  const home = path.join(tmpDir, 'home');
  fs.mkdirSync(cwd, { recursive: true });
  fs.mkdirSync(home, { recursive: true });
  
  return {
    tmpDir,
    cwd,
    home,
    cleanup: () => {
      try {
        fs.rmSync(tmpDir, { recursive: true, force: true });
      } catch (e) {
        // Ignore cleanup errors on Windows
      }
    },
    runHook: (hookPath, input = '', env = {}) => {
      try {
        const stdout = execFileSync(process.execPath, [hookPath], {
          cwd,
          env: { ...process.env, HOME: home, USERPROFILE: home, ...env },
          input,
          encoding: 'utf8'
        });
        return { stdout, error: null };
      } catch (err) {
        return { stdout: err.stdout, error: err };
      }
    }
  };
}

module.exports = { createTempEnv };
