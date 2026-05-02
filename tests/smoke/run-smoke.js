#!/usr/bin/env node
/**
 * Run bash smoke when available (full incl. symlink worktrees).
 * On Windows, Node's fs often rejects MSYS /c/... paths Node gets from bash — use Node subset.
 */

const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.join(__dirname, '..', '..');
const bashScript = path.join(ROOT, 'tests', 'smoke', 'test-all.sh');
const nodeSubset = path.join(__dirname, 'run-node-smoke.js');

if (process.platform === 'win32') {
  console.warn('\n  Using Node smoke subset on Windows (symlink worktree test: WSL/Git Bash + npm run test:shell).\n');
  const sub = spawnSync(process.execPath, [nodeSubset], { cwd: ROOT, stdio: 'inherit' });
  process.exit(sub.status ?? 1);
}

const probe = spawnSync('bash', ['--version'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });

if (probe.status === 0 && probe.stdout) {
  const r = spawnSync('bash', [bashScript], { cwd: ROOT, stdio: 'inherit', env: process.env });
  process.exit(r.status ?? 1);
}

console.warn('\n  Note: bash not found — running Node smoke subset.');
const sub = spawnSync(process.execPath, [nodeSubset], { cwd: ROOT, stdio: 'inherit' });
process.exit(sub.status ?? 1);
