/**
 * scripts/team/tmux.js — tmux pane manager for codex/gemini workers
 *
 * Spawns real tmux CLI worker panes — one pane per worker.
 * Session naming: ohc-<teamId>
 * Window naming:  <workerName>-N
 *
 * Each worker command is wrapped with an exit-code sentinel so the orchestrator
 * can detect completion without polling tmux pane state:
 *   cd <wt> && <cli> "<task>"; rc=$?; echo $rc > <sentinel>; [ $rc -eq 0 ] && <ok> || <fail>
 *
 * Sentinel file: .ohc/state/team/<teamId>/workers/<name>/tmux-exit
 */

const cp = require('child_process');
const fs   = require('fs');
const path = require('path');

function getOHC() {
  return path.join(process.cwd(), '.ohc');
}

function sentinelPath(teamId, workerName) {
  return path.join(getOHC(), 'state', 'team', teamId, 'workers', workerName, 'tmux-exit');
}

/**
 * Check if tmux is available.
 */
function isAvailable() {
  try { cp.execSync('which tmux', { stdio: 'pipe' }); return true; } catch { return false; }
}

/**
 * Check if the given provider CLI (codex or gemini) is available in PATH.
 */
function isProviderCliAvailable(cli) {
  try {
    const cmd = process.platform === 'win32' ? `where ${cli}` : `which ${cli}`;
    cp.execSync(cmd, { stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

/**
 * Ensure a tmux session exists. Creates if not present.
 */
function ensureSession(sessionName) {
  const r = cp.spawnSync('tmux', ['has-session', '-t', sessionName], { stdio: 'pipe' });
  if (r.status !== 0) {
    cp.spawnSync('tmux', ['new-session', '-d', '-s', sessionName], { stdio: 'pipe' });
  }
}

/**
 * Spawn a worker pane in tmux.
 * @param {string} sessionName - tmux session name
 * @param {string} windowName  - tmux window name
 * @param {string} cmd         - shell command to run
 */
function spawnPane(sessionName, windowName, cmd) {
  return cp.spawnSync('tmux', ['new-window', '-t', sessionName, '-n', windowName, cmd], { stdio: 'pipe' });
}

/**
 * Spawn N codex/gemini workers in tmux.
 * @param {string} teamId
 * @param {string} provider — 'codex' | 'gemini'
 * @param {Array}  workers  — [{ name, worktree, task }]
 * @returns { sessionName, success, error? }
 */
function spawnWorkers(teamId, provider, workers) {
  if (!isAvailable()) {
    return { success: false, error: 'tmux not found. Install: brew install tmux (macOS) or apt install tmux (Linux)' };
  }

  const sessionName = `ohc-${teamId}`;
  ensureSession(sessionName);

  const cli = provider === 'codex' ? 'codex' : 'gemini';

  for (const { name, worktree, task } of workers) {
    const sentinel = sentinelPath(teamId, name);
    const sentinelDir = path.dirname(sentinel);
    // Escape task for shell — simplistic but safe for typical prompts
    const safeTask = String(task).replace(/"/g, '\\"');
    const cmd = [
      `mkdir -p "${sentinelDir}"`,
      `cd "${worktree}"`,
      `${cli} "${safeTask}"`,
      `rc=$?`,
      `echo $rc > "${sentinel}"`,
      // Keep the pane around briefly so the user can inspect output before tmux reaps it
      `echo "[ohc] worker ${name} exited rc=$rc — pane will close in 10s"`,
      `sleep 10`,
    ].join('; ');
    spawnPane(sessionName, name, cmd);
  }

  return { sessionName, success: true };
}

/**
 * Poll sentinel files for all workers. Returns { teamId, workers: [{name, exited, rc}] }.
 * Does not block — caller decides when to re-poll.
 */
function pollExitStatuses(teamId, workerNames) {
  const results = workerNames.map(name => {
    const fp = sentinelPath(teamId, name);
    if (!fs.existsSync(fp)) return { name, exited: false, rc: null };
    const rc = parseInt((fs.readFileSync(fp, 'utf8') || '').trim(), 10);
    return { name, exited: true, rc: Number.isFinite(rc) ? rc : null };
  });
  return { teamId, workers: results };
}

/**
 * True when every worker has written its sentinel file.
 */
function allExited(teamId, workerNames) {
  return pollExitStatuses(teamId, workerNames).workers.every(w => w.exited);
}

/**
 * Get pane output from a tmux window.
 */
function getPaneOutput(sessionName, windowName, lines = 50) {
  const r = cp.spawnSync('tmux', ['capture-pane', '-t', `${sessionName}:${windowName}`, '-p', '-S', `-${lines}`], {
    stdio: 'pipe', encoding: 'utf8'
  });
  const out = r.stdout ? r.stdout.toString() : '';
  return out.trim();
}

module.exports = {
  isAvailable, isProviderCliAvailable, ensureSession, spawnPane, spawnWorkers, getPaneOutput,
  pollExitStatuses, allExited, sentinelPath,
};
