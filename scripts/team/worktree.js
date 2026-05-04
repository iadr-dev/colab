/**
 * scripts/team/worktree.js — git worktree management
 *
 * Canonical path: <repo>/.ohc/team/<teamId>/worktrees/<workerName>
 * This keeps all worktrees under .ohc/ so they're clearly owned by ohc.
 *
 * Dirty-check before removal: won't remove a worktree with uncommitted changes
 * unless --force is passed.
 */

const cp = require('child_process');
const fs   = require('fs');
const path = require('path');

const getCWD = () => process.cwd();
const getOHC = () => path.join(getCWD(), '.ohc');

function mkdir(d) { if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true }); }

/**
 * Get the canonical worktree path for a worker.
 */
function worktreePath(teamId, workerName) {
  return path.join(getOHC(), 'team', teamId, 'worktrees', workerName);
}

/**
 * Create a git worktree and branch for a worker.
 * @returns { worktree, branch, success, error }
 */
function create(teamId, workerName, baseBranch = 'HEAD') {
  const wt     = worktreePath(teamId, workerName);
  const branch = `ohc/${teamId}-${workerName}`;
  mkdir(path.dirname(wt));

  const r = cp.spawnSync('git', ['worktree', 'add', wt, '-b', branch, baseBranch], {
    cwd: getCWD(), encoding: 'utf8', stdio: 'pipe'
  });

  if (r.status !== 0) {
    return { worktree: wt, branch, success: false, error: (r.stderr || r.stdout || '').trim() };
  }

  // Make the team-wide research cache visible inside the worker worktree.
  // Each worker's `.ohc/research` points at the parent repo's cache so every
  // worker can `lookup()` without re-fetching.
  try {
    const parentResearch = path.join(getOHC(), 'research');
    const workerOhc      = path.join(wt, '.ohc');
    const workerResearch = path.join(workerOhc, 'research');
    if (fs.existsSync(parentResearch)) {
      mkdir(workerOhc);
      if (!fs.existsSync(workerResearch)) {
        fs.symlinkSync(parentResearch, workerResearch, 'dir');
      }
    }
  } catch { /* symlinks may fail on Windows without dev mode — non-fatal */ }

  return { worktree: wt, branch, success: true };
}

/**
 * Check if a worktree has uncommitted changes.
 * Returns true if dirty (has changes), false if clean.
 */
function isDirty(wtPath) {
  if (!fs.existsSync(wtPath)) return false;
  const r = cp.spawnSync('git', ['status', '--porcelain'], { cwd: wtPath, encoding: 'utf8', stdio: 'pipe' });
  return (r.stdout || '').trim().length > 0;
}

/**
 * Remove a worktree.
 * @param {boolean} force — remove even if dirty
 * @returns { success, error?, wasDirty }
 */
function remove(teamId, workerName, { force = false } = {}) {
  const wt = worktreePath(teamId, workerName);
  if (!fs.existsSync(wt)) return { success: true, wasDirty: false };

  const dirty = isDirty(wt);
  if (dirty && !force) {
    return {
      success: false,
      wasDirty: true,
      error: `Worktree ${wt} has uncommitted changes. Use --force to remove anyway, or commit/stash first.`
    };
  }

  const r = cp.spawnSync('git', ['worktree', 'remove', wt, ...(force ? ['--force'] : [])], {
    cwd: getCWD(), encoding: 'utf8', stdio: 'pipe'
  });

  if (r.status !== 0) {
    // Fall back to rm if git worktree remove fails (branch might be gone)
    cp.spawnSync('rm', ['-rf', wt], { cwd: getCWD() });
    cp.spawnSync('git', ['worktree', 'prune'], { cwd: getCWD() });
  }

  return { success: true, wasDirty: dirty };
}

/**
 * List all ohc-owned worktrees.
 */
function list() {
  const r = cp.spawnSync('git', ['worktree', 'list', '--porcelain'], { cwd: getCWD(), encoding: 'utf8', stdio: 'pipe' });
  const lines = (r.stdout || '').split('\n');
  const results = [];
  let cur = {};
  for (const line of lines) {
    if (!line.trim()) {
      if (cur.worktree) results.push(cur);
      cur = {};
    } else {
      const [k, ...v] = line.split(' ');
      cur[k] = v.join(' ');
    }
  }
  return results.filter(w => w.worktree?.includes('/.ohc/team/'));
}

/**
 * Merge all worker branches for a team back into the current branch.
 * Stops on first conflict; caller resolves manually, then re-runs.
 * @returns {{ merged: string[], conflicted: string[], skipped: string[] }}
 */
function mergeAll(teamId, workerBranches) {
  const merged = [], conflicted = [], skipped = [];
  for (const branch of workerBranches) {
    // Skip if branch doesn't exist (worker failed to create)
    const exists = cp.spawnSync('git', ['rev-parse', '--verify', branch], { cwd: getCWD(), stdio: 'pipe' });
    if (exists.status !== 0) { skipped.push(branch); continue; }

    const msg = `ohc: merge worker branch ${branch} (team ${teamId})`;
    const r = cp.spawnSync('git', ['merge', '--no-ff', '--no-edit', '-m', msg, branch], {
      cwd: getCWD(), encoding: 'utf8', stdio: 'pipe',
    });
    if (r.status === 0) {
      merged.push(branch);
    } else {
      conflicted.push(branch);
      break; // stop and let the user resolve
    }
  }
  return { merged, conflicted, skipped };
}

module.exports = { worktreePath, create, isDirty, remove, list, mergeAll };
