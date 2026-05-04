/**
 * tests/unit/hooks/helpers.js — shared test utilities for hook tests
 *
 * Hooks read JSON from stdin, do filesystem work, and write JSON to stdout.
 * This helper spawns them as child processes in temp directories, matching
 * how Claude Code actually invokes them.
 */

const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const ROOT = path.join(__dirname, '..', '..', '..');

/**
 * Run a hook script as a child process.
 * @param {string} hookName - e.g. 'on-permission-request'
 * @param {object|string} stdin - JSON payload to send via stdin
 * @param {object} [opts]
 * @param {string} [opts.cwd] - override working directory (default: creates temp dir)
 * @param {object} [opts.env] - extra env vars
 * @param {boolean} [opts.setupOhc] - create .ohc/state/ structure (default: true)
 * @param {string} [opts.sessionId] - session id to pre-populate (default: 'test-session')
 * @returns {{ stdout: string, stderr: string, exitCode: number, json: object|null, cwd: string }}
 */
function runHook(hookName, stdin = {}, opts = {}) {
  const { env = {}, setupOhc = true, sessionId = 'test-session' } = opts;
  const cwd = opts.cwd || fs.mkdtempSync(path.join(os.tmpdir(), 'ohc-test-'));

  if (setupOhc) {
    const ohc = path.join(cwd, '.ohc');
    const stateDir = path.join(ohc, 'state', 'sessions', sessionId);
    fs.mkdirSync(stateDir, { recursive: true });
    fs.mkdirSync(path.join(ohc, 'plans'), { recursive: true });
    fs.mkdirSync(path.join(ohc, 'skills'), { recursive: true });
    fs.mkdirSync(path.join(ohc, 'research'), { recursive: true });
    fs.mkdirSync(path.join(ohc, 'logs'), { recursive: true });
    fs.writeFileSync(path.join(ohc, 'state', 'current-session.txt'), sessionId);
    fs.writeFileSync(path.join(stateDir, 'meta.json'), JSON.stringify({
      started: new Date(Date.now() - 5 * 60000).toISOString(),
      cwd,
    }));
  }

  const input = typeof stdin === 'string' ? stdin : JSON.stringify(stdin);
  const hookPath = path.join(ROOT, 'hooks', `${hookName}.js`);

  const result = spawnSync(process.execPath, [hookPath], {
    input,
    encoding: 'utf8',
    timeout: 8000,
    cwd,
    env: { ...process.env, ...env },
  });

  let json = null;
  try { json = JSON.parse(result.stdout); } catch {}

  return {
    stdout: result.stdout || '',
    stderr: result.stderr || '',
    exitCode: result.status ?? 1,
    json,
    cwd,
  };
}

/**
 * Create a temp dir that acts as CWD for script tests.
 * Returns { dir, cleanup }.
 */
function makeTempProject() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ohc-test-'));
  return {
    dir,
    cleanup() {
      try { fs.rmSync(dir, { recursive: true, force: true }); } catch {}
    },
  };
}

/**
 * Create a temp dir that acts as the global ~/.ohc/ for memory tests.
 */
function makeTempHome() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ohc-home-'));
  return {
    dir,
    cleanup() {
      try { fs.rmSync(dir, { recursive: true, force: true }); } catch {}
    },
  };
}

module.exports = { runHook, makeTempProject, makeTempHome, ROOT };
