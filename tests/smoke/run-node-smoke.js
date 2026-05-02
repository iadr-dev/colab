#!/usr/bin/env node
/**
 * Portable smoke subset when bash is unavailable (e.g. stock Windows CMD).
 * Skips symlink worktree test — full suite: npm run test:shell (bash).
 */

const fs = require('fs');
const path = require('path');
const { execSync, spawnSync } = require('child_process');

const ROOT = path.join(__dirname, '..', '..');

function run(desc, fn) {
  try {
    fn();
    console.log(`  ✓ ${desc}`);
  } catch (e) {
    console.error(`  ✗ ${desc}`);
    console.error(`    ${e.message || e}`);
    process.exitCode = 1;
  }
}

console.log('');
console.log('  oh-my-colab smoke (Node subset)');
console.log('  ─────────────────────────────────────');

for (const [name, rel] of [
  ['hooks.json', 'hooks/hooks.json'],
  ['keyword-map.json', 'hooks/keyword-map.json'],
  ['plugin-hooks.json', 'hooks/plugin-hooks.json'],
  ['package.json', 'package.json'],
  ['.claude-plugin/plugin.json', '.claude-plugin/plugin.json'],
  ['.claude-plugin/marketplace.json', '.claude-plugin/marketplace.json'],
  ['.cursor-plugin/manifest.json', '.cursor-plugin/manifest.json'],
]) {
  run(`${name} is valid JSON`, () => JSON.parse(fs.readFileSync(path.join(ROOT, rel), 'utf8')));
}

const hooksNeedCheck = ['on-session-start', 'on-pre-tool', 'on-post-tool', 'on-stop', 'on-user-prompt',
  'on-pre-compact', 'on-post-compact', 'on-subagent-start', 'on-subagent-stop',
  'on-post-tool-failure', 'on-session-end', 'on-permission-request'];

for (const h of hooksNeedCheck) {
  run(`hooks/${h}.js syntax ok`, () =>
    execSync(`${process.execPath} --check "${path.join(ROOT, 'hooks', `${h}.js`)}"`, { encoding: 'utf8' }));
}

run('agents have YAML frontmatter', () => {
  const dir = path.join(ROOT, 'agents');
  for (const f of fs.readdirSync(dir).filter(f => f.endsWith('.md'))) {
    const c = fs.readFileSync(path.join(dir, f), 'utf8');
    if (!c.startsWith('---')) throw new Error(`${f}`);
    if (!c.includes('name:') || !c.includes('description:')) throw new Error(`${f}`);
  }
});

run('skill lines check', () =>
  execSync(`${process.execPath} "${path.join(ROOT, 'tests/smoke/check-skill-lines.js')}"`, { stdio: 'inherit' }));

run('commands have frontmatter', () => {
  const dir = path.join(ROOT, 'commands');
  for (const f of fs.readdirSync(dir).filter(f => f.endsWith('.md'))) {
    const c = fs.readFileSync(path.join(dir, f), 'utf8');
    if (c.split(/\r?\n/, 1)[0] !== '---') throw new Error(`${f}`);
    if (!c.includes('description:')) throw new Error(`${f}`);
  }
});

run('cursor-sync removed from ohc CLI', () => {
  const c = fs.readFileSync(path.join(ROOT, 'scripts', 'ohc'), 'utf8');
  if (c.includes('cursor-sync')) throw new Error('cursor-sync referenced');
});

run('on-pre-compact stdin', () => {
  const r = spawnSync(process.execPath, [path.join(ROOT, 'hooks', 'on-pre-compact.js')], {
    input: '{}',
    encoding: 'utf8',
    timeout: 5000,
  });
  if (r.error) throw r.error;
  if (r.status !== 0) throw new Error(r.stderr || 'nonzero exit');
});

run('team orchestrator', () => {
  const tmp = fs.mkdtempSync(path.join(require('os').tmpdir(), 'ohc-team-'));
  const prev = process.cwd();
  try {
    process.chdir(tmp);
    const state = require(path.join(ROOT, 'scripts', 'team', 'state.js'));
    const result = require(path.join(ROOT, 'scripts', 'team', 'result.js'));
    const orch = require(path.join(ROOT, 'scripts', 'team', 'orchestrator.js'));
    const teamId = `test-${Date.now().toString(36)}`;
    state.init(teamId, { provider: 'executor', n: 2, task: 'smoke' });
    state.recordWorkerStart(teamId, 'w1', { task: 'a' });
    state.recordWorkerStart(teamId, 'w2', { task: 'b' });
    state.recordHandoff(teamId, 'team-plan', 'team-prd', {});
    state.recordHandoff(teamId, 'team-prd', 'team-exec', {});
    let r = orch.advance(teamId);
    if (r.advanced) throw new Error('gate without RESULT.json');
    result.write(teamId, 'w1', { status: 'success', tests: { passed: 2, failed: 0, skipped: 0 } });
    r = orch.advance(teamId);
    if (r.advanced) throw new Error('gate 1of2 RESULT');
    result.write(teamId, 'w2', { status: 'failed', tests: { passed: 0, failed: 3, skipped: 0 } });
    r = orch.advance(teamId);
    if (!r.advanced || r.to !== 'team-verify') throw new Error('exec→verify');
    r = orch.advance(teamId);
    if (!r.advanced || r.to !== 'team-fix') throw new Error('verify→fix');
    orch.recordFixAttempt(teamId);
    for (let i = 0; i < orch.MAX_FIX_RETRIES; i++) {
      result.write(teamId, 'w2', { status: 'failed', tests: { passed: 0, failed: 1, skipped: 0 } });
      const a = orch.advance(teamId);
      if (!a.advanced || a.to !== 'team-verify') throw new Error('fix→verify');
      const b = orch.advance(teamId);
      if (!b.advanced) throw new Error('verify stuck');
      if (b.to === 'team-fix') orch.recordFixAttempt(teamId);
      else if (b.to === 'team-merge') break;
      else throw new Error(`unexpected ${b.to}`);
    }
    const st = state.readState(teamId);
    if (st.stage !== 'team-merge') throw new Error(`merge stage wanted, got ${st.stage}`);
    const done = orch.advance(teamId);
    if (!done.advanced || done.to !== 'done') throw new Error('merge→done');
  } finally {
    process.chdir(prev);
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

run('team result contract', () => {
  const tmp = fs.mkdtempSync(path.join(require('os').tmpdir(), 'ohc-team-'));
  const prev = process.cwd();
  process.chdir(tmp);
  try {
    const result = require(path.join(ROOT, 'scripts', 'team', 'result.js'));
    const teamId = 't1';
    result.write(teamId, 'worker-a', {
      status: 'success',
      tests: { passed: 5, failed: 0, skipped: 1 },
      files_changed: ['src/x.ts'],
      notes: 'ok',
    });
    const back = result.read(teamId, 'worker-a');
    if (!back || back.tests.passed !== 5) throw new Error('round-trip');
    if (!result.allComplete(teamId)) throw new Error('allComplete');
    const sum = result.summarize(teamId);
    if (sum.succeeded !== 1 || sum.workers !== 1) throw new Error('summarize');
  } finally {
    process.chdir(prev);
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

run('fix dispatch reuses worker worktrees', () => {
  const native = require(path.join(ROOT, 'scripts', 'team', 'native.js'));
  const failing = [
    { name: 'w1', worktree: '/tmp/wt1', branch: 'ohc/t-w1',
      prior_result: { status: 'failed', tests: { passed: 0, failed: 2, skipped: 0 }, notes: 'broke' } },
    { name: 'w2', worktree: '/tmp/wt2', branch: 'ohc/t-w2', prior_result: null },
  ];
  const { taskSpecs } = native.buildFixTaskSpecs('tid', 'executor', failing, 2);
  if (taskSpecs.length !== 2 || taskSpecs[0].worktree !== '/tmp/wt1') throw new Error('spec shape');
  const instruction = native.formatFixDispatchInstruction(taskSpecs, 'tid', 2);
  if (!instruction.includes('team_fix_dispatch')) throw new Error('header');
  if (!instruction.includes('attempt="2"')) throw new Error('attempt attr');
});

run('research cache round-trip', () => {
  const tmp = fs.mkdtempSync(path.join(require('os').tmpdir(), 'ohc-research-'));
  const prev = process.cwd();
  process.chdir(tmp);
  try {
    const rmod = require(path.join(ROOT, 'scripts/research.js'));
    const fp = rmod.save({
      library: 'next.js',
      topic: 'app-router-metadata',
      payload: '### Usage\nexport const metadata = {...}',
      source: 'context7',
      version: '15.0.0',
    });
    if (!fs.existsSync(fp)) throw new Error('save');
    const hit = rmod.lookup('next.js', 'app-router-metadata');
    if (!hit.hit || !hit.fresh || !hit.body.includes('export const metadata')) throw new Error('lookup');
    if (rmod.list().length !== 1) throw new Error('list');
    if (!rmod.markVerified('next.js', 'app-router-metadata', 'abc123')) throw new Error('verify');
    const idx = rmod.indexForSessionStart();
    if (!idx.includes('next.js')) throw new Error('session index');
    if (rmod.prune({ olderThanDays: 0, expiredOnly: false }).removed.length !== 1) throw new Error('prune');
  } finally {
    process.chdir(prev);
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

console.log('');
console.log('  Skipped symlink worktree test (bash-only). npm run test:shell for full suite.');
console.log('');

if (process.exitCode) process.exit(1);
