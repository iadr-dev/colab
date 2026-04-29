/**
 * scripts/team/index.js — team router and CLI handler
 *
 * Parses `ohc team N:provider "task"` and dispatches to the correct backend:
 *   - codex / gemini → tmux.js (real CLI panes)
 *   - claude / executor → native.js (Task() spec emission for Claude Code teams)
 *
 * Also handles:
 *   ohc team status [team-id]
 *   ohc team shutdown [team-id] [--force]
 */

const { execSync } = require('child_process');
const path = require('path');
const fs   = require('fs');

const state        = require('./state');
const worktree     = require('./worktree');
const tmux         = require('./tmux');
const native       = require('./native');
const result       = require('./result');
const orchestrator = require('./orchestrator');

const VALID_PROVIDERS = ['claude', 'executor', 'codex', 'gemini'];
const MAX_WORKERS = 8;

module.exports = function team(args) {
  const [sub, ...rest] = args;

  if (sub === 'status')   return cmdStatus(rest[0]);
  if (sub === 'shutdown') return cmdShutdown(rest[0], rest.includes('--force'));
  if (sub === 'list')     return cmdList();
  if (sub === 'advance')  return cmdAdvance(rest[0]);
  if (sub === 'merge')    return cmdMerge(rest[0]);
  if (sub === 'poll')     return cmdPoll(rest[0]);

  // Default: ohc team N:provider "task"
  return cmdDispatch([sub, ...rest]);
};

function cmdDispatch(args) {
  const [spec, ...rest] = args;
  const task = rest.join(' ');

  if (!spec || !task) {
    console.error([
      '',
      '  Usage: ohc team N:provider "task"',
      '',
      '  Examples:',
      '    ohc team 1:executor "fix all TypeScript errors"',
      '    ohc team 2:codex "review auth module for security issues"',
      '    ohc team 1:gemini "redesign the onboarding flow"',
      '',
      '  Commands:',
      '    ohc team status [team-id]             Show team + worker progress',
      '    ohc team advance <team-id>            Drive the five-stage pipeline one step',
      '    ohc team poll <team-id>               Poll tmux workers for exit status',
      '    ohc team merge <team-id>              Merge worker branches back',
      '    ohc team shutdown <team-id> [--force] Remove worktrees',
      '    ohc team list                         List all active teams',
      '',
    ].join('\n'));
    process.exit(1);
  }

  const [nStr, provider] = spec.split(':');
  const n = parseInt(nStr);

  if (isNaN(n) || n < 1 || n > MAX_WORKERS) {
    console.error(`  N must be 1–${MAX_WORKERS}.`);
    process.exit(1);
  }
  if (!VALID_PROVIDERS.includes(provider)) {
    console.error(`  Unknown provider: ${provider}. Use: ${VALID_PROVIDERS.join(', ')}`);
    process.exit(1);
  }

  const teamId  = `${Date.now().toString(36)}-${provider}`;
  const teamSt  = state.init(teamId, { provider, n, task });

  console.log(`\n  🧠 oh-my-colab team: ${n} ${provider} worker(s)`);
  console.log(`  Task: "${task}"`);
  console.log(`  Team ID: ${teamId}`);
  console.log('  ─────────────────────────────────────');

  // Create worktrees
  const workers = [];
  for (let i = 1; i <= n; i++) {
    const wName = `${provider}-${i}`;
    const wt = worktree.create(teamId, wName);
    if (wt.success) {
      state.recordWorkerStart(teamId, wName, { worktree: wt.worktree, branch: wt.branch, task });
      workers.push({ name: wName, worktree: wt.worktree, branch: wt.branch, task: `${task} (worker ${i}/${n})` });
      console.log(`  ✓ Worktree ${i}: ${wt.worktree}`);
    } else {
      console.error(`  ✗ Worktree ${i}: ${wt.error}`);
    }
  }

  if (!workers.length) {
    console.error('\n  No workers created. Check git status and try again.');
    process.exit(1);
  }

  console.log('');

  if (['codex', 'gemini'].includes(provider)) {
    // tmux CLI workers
    const r = tmux.spawnWorkers(teamId, provider, workers);
    if (!r.success) {
      console.error(`  ✗ tmux error: ${r.error}`);
      process.exit(1);
    }
    console.log(`  tmux session: ${r.sessionName}`);
    console.log(`  Attach: tmux attach -t ${r.sessionName}`);
  } else {
    // Claude Code native teams — emit Task() specs for Claude to dispatch
    const { taskSpecs } = native.buildTaskSpecs(teamId, provider, workers);
    const instruction   = native.formatDispatchInstruction(taskSpecs);
    console.log(`  Claude Code team mode enabled.`);
    console.log(`  ${workers.length} Task() spec(s) ready for dispatch.`);
    console.log('');
    // Print the dispatch instruction — Claude Code picks this up as system context
    console.log(instruction);
  }

  console.log('');
  console.log(`  State: .ohc/state/team/${teamId}/state.json`);
  console.log(`  Next:  ohc team advance ${teamId}   (once workers write RESULT.json)`);
  console.log(`         ohc team poll ${teamId}      (for tmux providers)`);
  console.log(`         ohc team status ${teamId}`);
  console.log(`         ohc team shutdown ${teamId}`);
  console.log('');

  // Plan + prd are implicit at dispatch time (the user provided the task).
  // Record both handoffs so the orchestrator starts at team-exec.
  state.recordHandoff(teamId, 'team-plan', 'team-prd',  { auto: true, reason: 'dispatch' });
  state.recordHandoff(teamId, 'team-prd',  'team-exec', { auto: true, reason: 'dispatch' });
}

function cmdStatus(teamId) {
  if (!teamId) {
    const teams = state.listTeams();
    if (!teams.length) { console.log('\n  No active teams.\n'); return; }
    console.log('\n  Active teams:');
    for (const t of teams) {
      console.log(`  ${t.teamId}  stage=${t.stage || '?'}  status=${t.status || '?'}  provider=${t.provider || '?'}  n=${t.n || '?'}`);
    }
    console.log('');
    return;
  }

  const s = state.readState(teamId);
  if (!s) { console.error(`  Team not found: ${teamId}`); return; }

  const progress = orchestrator.progress(teamId);

  console.log(`\n  Team: ${teamId}`);
  console.log(`  Provider: ${s.provider}  N: ${s.n}  Stage: ${s.stage}`);
  console.log(`  Task: ${s.task}`);
  console.log(`  Status: ${s.status}`);
  if (progress) {
    console.log(`  Workers: ${progress.succeeded}/${progress.workers} succeeded` +
                (progress.failed    ? `  ${progress.failed} failed`       : '') +
                (progress.blocked   ? `  ${progress.blocked} blocked`      : '') +
                (progress.tests_failed ? `  ${progress.tests_failed} tests failed` : ''));
    if (progress.fix_retries) {
      console.log(`  Fix retries: ${progress.fix_retries}/${orchestrator.MAX_FIX_RETRIES}`);
    }
  }
  console.log('');

  const workers = state.getWorkers(teamId);
  if (workers.length) {
    console.log('  Workers:');
    for (const w of workers) {
      const r     = result.read(teamId, w.name);
      const glyph = r ? (r.status === 'success' ? '✓' : r.status === 'blocked' ? '⏸' : '✗')
                      : (w.completed ? '…' : '…');
      const wt    = worktree.worktreePath(teamId, w.name);
      const dirty = worktree.isDirty(wt) ? ' (dirty)' : '';
      const tests = r?.tests ? `  tests: ${r.tests.passed || 0}p/${r.tests.failed || 0}f/${r.tests.skipped || 0}s` : '';
      console.log(`    ${glyph} ${w.name}${dirty}${tests}`);
    }
  }
  console.log('');
}

function cmdShutdown(teamId, force) {
  if (!teamId) { console.error('  Usage: ohc team shutdown <team-id> [--force]'); return; }

  const s = state.readState(teamId);
  if (!s) { console.error(`  Team not found: ${teamId}`); return; }

  console.log(`\n  Shutting down team: ${teamId}`);
  const workers = state.getWorkers(teamId);

  for (const w of workers) {
    const r = worktree.remove(teamId, w.name, { force });
    if (!r.success) {
      console.error(`  ✗ ${w.name}: ${r.error}`);
      if (!force) {
        console.error('  Tip: commit or stash changes, then re-run. Or use --force to discard.');
        return;
      }
    } else {
      const note = r.wasDirty ? ' (had uncommitted changes — discarded)' : '';
      console.log(`  ✓ Removed worktree: ${w.name}${note}`);
    }
  }

  state.updateState(teamId, { status: 'shutdown', shutdown_at: new Date().toISOString() });
  console.log(`  Team ${teamId} shut down.\n`);
}

function cmdList() {
  cmdStatus(null);
}

/**
 * ohc team advance <id> — drive the pipeline one step (or one attempted step).
 */
function cmdAdvance(teamId) {
  if (!teamId) { console.error('  Usage: ohc team advance <team-id>'); process.exit(1); }
  const s = state.readState(teamId);
  if (!s) { console.error(`  Team not found: ${teamId}`); process.exit(1); }

  const before = s.stage;
  const r = orchestrator.advance(teamId);

  if (!r.advanced) {
    const summary = result.summarize(teamId);
    console.log(`\n  Team ${teamId} stays at ${before}.`);
    console.log(`  Reason: ${r.reason}`);
    if (before === 'team-exec' && summary.workers > 0) {
      const missing = summary.workers - (summary.succeeded + summary.failed + summary.blocked);
      if (missing > 0) console.log(`  Waiting on RESULT.json from ${missing}/${summary.workers} worker(s).`);
    }
    console.log('');
    return;
  }

  console.log(`\n  Team ${teamId}: ${r.from} → ${r.to}`);
  if (r.to === 'team-fix') {
    const next = orchestrator.recordFixAttempt(teamId);
    const attempt = next.fix_retries;
    const summary = result.summarize(teamId);
    console.log(`  Fix attempt ${attempt} / ${orchestrator.MAX_FIX_RETRIES}`);
    console.log(`  Failing workers: ${summary.failing_workers.join(', ') || '(none)'}`);
    console.log(`  tests_failed: ${summary.tests_failed}`);

    // Auto-emit fix Task() specs for Claude-native providers.
    // tmux providers must be re-run manually — we print the spec for reference.
    const provider = state.readState(teamId).provider;
    const failing = summary.failing_workers.map(name => {
      const w  = state.getWorkers(teamId).find(x => x.name === name);
      const wt = worktree.worktreePath(teamId, name);
      return {
        name,
        worktree: wt,
        branch: w?.started?.branch || null,
        prior_result: result.read(teamId, name),
      };
    });

    const { taskSpecs } = native.buildFixTaskSpecs(teamId, provider, failing, attempt);
    const instruction   = native.formatFixDispatchInstruction(taskSpecs, teamId, attempt);
    console.log(`  ${taskSpecs.length} fix Task() spec(s) ready for dispatch.`);
    console.log('');
    console.log(instruction);
  } else if (r.to === 'team-merge') {
    console.log(`  Next: ohc team merge ${teamId}`);
  } else if (r.to === 'done') {
    console.log(`  Team complete.`);
  }
  console.log('');
}

/**
 * ohc team poll <id> — check tmux sentinels for codex/gemini workers.
 */
function cmdPoll(teamId) {
  if (!teamId) { console.error('  Usage: ohc team poll <team-id>'); process.exit(1); }
  const s = state.readState(teamId);
  if (!s) { console.error(`  Team not found: ${teamId}`); process.exit(1); }
  if (!['codex', 'gemini'].includes(s.provider)) {
    console.log(`\n  Team ${teamId} uses provider "${s.provider}" — tmux poll does not apply.`);
    console.log(`  Use \`ohc team status ${teamId}\` to see RESULT.json progress.\n`);
    return;
  }
  const workers = state.getWorkers(teamId).map(w => w.name);
  const poll = tmux.pollExitStatuses(teamId, workers);
  console.log(`\n  Team ${teamId} (tmux ${s.provider}):`);
  for (const w of poll.workers) {
    if (!w.exited) console.log(`    … ${w.name}  (running)`);
    else console.log(`    ${w.rc === 0 ? '✓' : '✗'} ${w.name}  (rc=${w.rc})`);
  }
  const done = poll.workers.every(w => w.exited);
  console.log(done ? '\n  All tmux workers exited.\n' : '');
}

/**
 * ohc team merge <id> — merge worker branches back into the current branch.
 */
function cmdMerge(teamId) {
  if (!teamId) { console.error('  Usage: ohc team merge <team-id>'); process.exit(1); }
  const s = state.readState(teamId);
  if (!s) { console.error(`  Team not found: ${teamId}`); process.exit(1); }
  if (s.stage !== 'team-merge' && s.stage !== 'done') {
    console.log(`\n  Team ${teamId} is at stage ${s.stage}. Advance to team-merge first:`);
    console.log(`    ohc team advance ${teamId}\n`);
    return;
  }

  const workers = state.getWorkers(teamId);
  const branches = workers.map(w => w.started?.branch).filter(Boolean);

  console.log(`\n  Merging ${branches.length} worker branch(es) for team ${teamId}...`);
  const r = worktree.mergeAll(teamId, branches);

  for (const b of r.merged)     console.log(`  ✓ merged:     ${b}`);
  for (const b of r.skipped)    console.log(`  – skipped:    ${b} (branch missing)`);
  for (const b of r.conflicted) console.log(`  ✗ conflicted: ${b}`);

  if (r.conflicted.length) {
    console.log('\n  Resolve conflicts, then re-run `ohc team merge ' + teamId + '`.\n');
    return;
  }

  state.updateState(teamId, { stage: 'done', status: 'merged', merged_at: new Date().toISOString() });
  console.log(`\n  Team ${teamId} merged. Run \`ohc team shutdown ${teamId}\` to clean up worktrees.\n`);
}
