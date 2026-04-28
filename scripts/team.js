/**
 * team.js — spawn N parallel agent workers
 * Usage: ohc team N:provider "task"
 */
const { execSync } = require('child_process');
const fs   = require('fs');
const path = require('path');

const VALID_PROVIDERS = ['claude', 'executor', 'codex', 'gemini', 'cursor'];
const MAX = 8;

module.exports = function team(args) {
  const [spec, ...rest] = args;
  const task = rest.join(' ');

  if (!spec || !task) {
    console.error('Usage: ohc team N:provider "task"\nExample: ohc team 3:codex "review auth module"');
    process.exit(1);
  }

  const [nStr, provider] = spec.split(':');
  const n = parseInt(nStr);

  if (isNaN(n) || n < 1 || n > MAX) { console.error(`N must be 1–${MAX}.`); process.exit(1); }
  if (!VALID_PROVIDERS.includes(provider)) {
    console.error(`Unknown provider: ${provider}. Use: ${VALID_PROVIDERS.join(', ')}`);
    process.exit(1);
  }

  console.log(`\n🧠 ohc: spawning ${n} ${provider} workers\n   Task: "${task}"\n`);

  const id = Date.now().toString(36);
  const worktrees = [];

  for (let i = 1; i <= n; i++) {
    const branch = `ohc/${id}-worker-${i}`;
    const wt     = `.git/worktrees/ohc-${id}-${i}`;
    try {
      execSync(`git worktree add ${wt} -b ${branch}`, { stdio: 'pipe' });
      worktrees.push({ index: i, branch, worktree: wt });
      console.log(`  ✓ Worktree ${i}: ${wt}`);
    } catch (e) {
      console.error(`  ✗ Worktree ${i} failed: ${e.message.slice(0,80)}`);
    }
  }

  // Save dispatch state
  const stateDir = path.join('.ohc', 'state');
  if (!fs.existsSync(stateDir)) fs.mkdirSync(stateDir, { recursive: true });
  fs.writeFileSync(
    path.join(stateDir, `parallel-${id}.json`),
    JSON.stringify({ id, provider, n, task, worktrees, started: new Date().toISOString(), status: 'running' }, null, 2)
  );

  if (!['claude', 'executor'].includes(provider)) {
    // tmux workers for codex/gemini
    const hasT = (() => { try { execSync('which tmux', {stdio:'pipe'}); return true; } catch { return false; } })();
    if (!hasT) {
      console.error('\n⚠ tmux required for codex/gemini workers. Install: brew install tmux');
      process.exit(1);
    }
    const session = `ohc-${id}`;
    try { execSync(`tmux new-session -d -s ${session}`, {stdio:'pipe'}); } catch {}
    for (const wt of worktrees) {
      const provCmd = provider === 'codex'
        ? `cd ${wt.worktree} && codex "${task} (worker ${wt.index}/${n})"`
        : `cd ${wt.worktree} && gemini "${task} (worker ${wt.index}/${n})"`;
      execSync(`tmux new-window -t ${session} -n "w${wt.index}" "${provCmd}"`, {stdio:'pipe'});
    }
    console.log(`\n  tmux session: ${session}`);
    console.log(`  Attach: tmux attach -t ${session}`);
  } else {
    console.log('\n  Claude Code team mode:');
    console.log(`  In Claude Code: /team ${n}:executor "${task}"`);
  }

  console.log(`\n  State: .ohc/state/parallel-${id}.json`);
  console.log('  Cleanup: git worktree list | grep ohc/ | awk \'{print $1}\' | xargs -I{} git worktree remove {}');
};
