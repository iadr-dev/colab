#!/usr/bin/env bash
# tests/smoke/test-all.sh — oh-my-colab smoke test suite
# Exits 0 if all pass, 1 if any fail

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
PASS=0; FAIL=0

run() {
  local desc="$1"; shift
  if "$@" &>/dev/null; then
    echo "  ✓ $desc"
    PASS=$((PASS+1))
  else
    echo "  ✗ $desc"
    FAIL=$((FAIL+1))
  fi
}

run_node() {
  local desc="$1"; local script="$2"
  if node -e "$script" &>/dev/null; then
    echo "  ✓ $desc"
    PASS=$((PASS+1))
  else
    echo "  ✗ $desc"
    FAIL=$((FAIL+1))
  fi
}

echo ""
echo "  🧪 oh-my-colab smoke tests"
echo "  ─────────────────────────────────────"
echo ""

# JSON validity
run "hooks/hooks.json is valid JSON"     node -e "JSON.parse(require('fs').readFileSync('$ROOT/hooks/hooks.json','utf8'))"
run "hooks/keyword-map.json is valid"    node -e "JSON.parse(require('fs').readFileSync('$ROOT/hooks/keyword-map.json','utf8'))"
run "plugin.json is valid"               node -e "JSON.parse(require('fs').readFileSync('$ROOT/.claude-plugin/plugin.json','utf8'))"
run "package.json is valid"              node -e "JSON.parse(require('fs').readFileSync('$ROOT/package.json','utf8'))"

# Hooks parse without crashing (Node syntax check)
for h in on-session-start on-pre-tool on-post-tool on-stop on-user-prompt \
          on-pre-compact on-post-compact on-subagent-start on-subagent-stop \
          on-post-tool-failure on-session-end on-permission-request; do
  run "hooks/$h.js syntax ok" node --check "$ROOT/hooks/$h.js"
done

# Agents have YAML frontmatter
run "agents have YAML frontmatter" node -e "
  const fs = require('fs'), path = require('path');
  const dir = '$ROOT/agents';
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.md'));
  for (const f of files) {
    const c = fs.readFileSync(path.join(dir, f), 'utf8');
    if (!c.startsWith('---')) throw new Error(f + ' missing YAML frontmatter');
    if (!c.includes('name:')) throw new Error(f + ' missing name: field');
    if (!c.includes('description:')) throw new Error(f + ' missing description: field');
  }
"

# Skills exist and are under 200 lines
run "skill lines check" node "$ROOT/tests/smoke/check-skill-lines.js"

# Commands have frontmatter
run "commands have frontmatter" node -e "
  const fs = require('fs'), path = require('path');
  const dir = '$ROOT/commands';
  for (const f of fs.readdirSync(dir).filter(f => f.endsWith('.md'))) {
    const c = fs.readFileSync(path.join(dir, f), 'utf8');
    const firstLine = c.split(/\r?\n/, 1)[0];
    if (firstLine !== '---') throw new Error(f + ' missing frontmatter (first line should be ---)');
  }
"

# scripts/ohc does not reference cursor-sync
run "cursor-sync removed from ohc CLI" node -e "
  const c = require('fs').readFileSync('$ROOT/scripts/ohc', 'utf8');
  if (c.includes('cursor-sync')) throw new Error('cursor-sync still referenced in scripts/ohc');
"

# PreCompact hook works with synthetic input
run "on-pre-compact.js runs without crash" node -e "
  const { execSync } = require('child_process');
  execSync('echo \"{}\" | node $ROOT/hooks/on-pre-compact.js', { timeout: 3000 });
"

# Team orchestrator: state machine + RESULT.json gate + retry cap
run "team orchestrator gating + retry cap" node -e "
  const fs = require('fs'), path = require('path'), os = require('os');
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'ohc-team-'));
  process.chdir(tmp);
  const state  = require('$ROOT/scripts/team/state.js');
  const result = require('$ROOT/scripts/team/result.js');
  const orch   = require('$ROOT/scripts/team/orchestrator.js');
  const teamId = 'test-' + Date.now().toString(36);
  state.init(teamId, { provider: 'executor', n: 2, task: 'smoke' });
  state.recordWorkerStart(teamId, 'w1', { task: 'a' });
  state.recordWorkerStart(teamId, 'w2', { task: 'b' });
  state.recordHandoff(teamId, 'team-plan', 'team-prd', {});
  state.recordHandoff(teamId, 'team-prd', 'team-exec', {});
  // Gate: exec → verify blocked without RESULT.json for both workers
  let r = orch.advance(teamId);
  if (r.advanced) throw new Error('gate failed: advanced without RESULT.json');
  // Only one RESULT → still blocked
  result.write(teamId, 'w1', { status: 'success', tests: { passed: 2, failed: 0, skipped: 0 } });
  r = orch.advance(teamId);
  if (r.advanced) throw new Error('gate failed: advanced with 1/2 RESULT.json');
  // Both workers done, one with failures → should go to team-fix via team-verify
  result.write(teamId, 'w2', { status: 'failed', tests: { passed: 0, failed: 3, skipped: 0 } });
  r = orch.advance(teamId);
  if (!r.advanced || r.to !== 'team-verify') throw new Error('expected exec→verify, got ' + JSON.stringify(r));
  r = orch.advance(teamId);
  if (!r.advanced || r.to !== 'team-fix') throw new Error('expected verify→fix, got ' + JSON.stringify(r));
  orch.recordFixAttempt(teamId);
  // Simulate fix workers rewriting RESULT.json (still failing to test retry cap)
  for (let i = 0; i < orch.MAX_FIX_RETRIES; i++) {
    result.write(teamId, 'w2', { status: 'failed', tests: { passed: 0, failed: 1, skipped: 0 } });
    const a = orch.advance(teamId); // fix → verify
    if (!a.advanced || a.to !== 'team-verify') throw new Error('fix→verify retry failed');
    const b = orch.advance(teamId); // verify → fix or merge (cap)
    if (!b.advanced) throw new Error('verify did not advance');
    if (b.to === 'team-fix') orch.recordFixAttempt(teamId);
    else if (b.to === 'team-merge') break;
    else throw new Error('unexpected target ' + b.to);
  }
  const s = state.readState(teamId);
  if (s.stage !== 'team-merge') throw new Error('expected stage team-merge after retry cap, got ' + s.stage);
  const done = orch.advance(teamId); // merge → done
  if (!done.advanced || done.to !== 'done') throw new Error('expected merge→done');
  const sum = result.summarize(teamId);
  if (sum.workers !== 2) throw new Error('summarize: expected 2 workers');
  if (!sum.failing_workers.includes('w2')) throw new Error('summarize: w2 should be in failing_workers');
  fs.rmSync(tmp, {recursive: true, force: true});
"

# Team status output includes RESULT.json info
run "team result contract write/read" node -e "
  const fs = require('fs'), path = require('path'), os = require('os');
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'ohc-team-'));
  process.chdir(tmp);
  const result = require('$ROOT/scripts/team/result.js');
  const teamId = 't1';
  const payload = result.write(teamId, 'worker-a', {
    status: 'success',
    tests: { passed: 5, failed: 0, skipped: 1 },
    files_changed: ['src/x.ts'],
    notes: 'ok',
  });
  if (payload.status !== 'success') throw new Error('write: wrong status');
  const back = result.read(teamId, 'worker-a');
  if (!back || back.tests.passed !== 5) throw new Error('read: round-trip failed');
  if (!result.allComplete(teamId)) throw new Error('allComplete: expected true');
  const s = result.summarize(teamId);
  if (s.succeeded !== 1 || s.workers !== 1) throw new Error('summarize: wrong counts');
  fs.rmSync(tmp, {recursive: true, force: true});
"

# Worktree create symlinks .ohc/research/ into the worker worktree
run "worktree symlinks shared research cache" bash -c "
  set -e
  TMP=\$(mktemp -d)
  cd \"\$TMP\"
  git init -q
  git config user.email t@t.t && git config user.name t
  echo seed > file.txt && git add file.txt && git commit -q -m seed
  # Seed a research entry in parent repo
  node -e 'const r=require(\"$ROOT/scripts/research.js\"); r.save({library:\"react\", topic:\"hooks-intro\", payload:\"# hi\", source:\"context7\"})'
  # Create a worker worktree via the module
  node -e '
    const wt = require(\"$ROOT/scripts/team/worktree.js\");
    const r = wt.create(\"team-x\", \"w1\");
    if (!r.success) { console.error(\"create failed:\", r.error); process.exit(1); }
    console.log(r.worktree);
  ' > /tmp/ohc-wt-path.txt
  WT_PATH=\$(cat /tmp/ohc-wt-path.txt)
  test -e \"\$WT_PATH/.ohc/research\" || { echo \"symlink missing\"; exit 1; }
  # Resolve symlink target and confirm cached file is visible from worker side
  test -f \"\$WT_PATH/.ohc/research/react--hooks-intro.md\" || { echo \"cached file not visible in worker\"; exit 1; }
  rm -rf \"\$TMP\" /tmp/ohc-wt-path.txt
"

# Fix dispatch specs target the same worktrees + branches
run "fix dispatch reuses worker worktrees" node -e "
  const native = require('$ROOT/scripts/team/native.js');
  const failing = [
    { name: 'w1', worktree: '/tmp/wt1', branch: 'ohc/t-w1', prior_result: { status: 'failed', tests: { passed: 0, failed: 2, skipped: 0 }, notes: 'broke' } },
    { name: 'w2', worktree: '/tmp/wt2', branch: 'ohc/t-w2', prior_result: null },
  ];
  const { taskSpecs } = native.buildFixTaskSpecs('tid', 'executor', failing, 2);
  if (taskSpecs.length !== 2) throw new Error('expected 2 fix specs');
  if (taskSpecs[0].worktree !== '/tmp/wt1') throw new Error('fix spec not reusing worktree');
  if (!taskSpecs[0].prompt.includes('attempt 2/3')) throw new Error('attempt number missing from prompt');
  if (!taskSpecs[0].prompt.includes('ohc/t-w1')) throw new Error('branch missing from prompt');
  if (!taskSpecs[1].prompt.includes('no prior RESULT.json')) throw new Error('null prior_result not handled');
  const instruction = native.formatFixDispatchInstruction(taskSpecs, 'tid', 2);
  if (!instruction.includes('team_fix_dispatch')) throw new Error('instruction header missing');
  if (!instruction.includes('attempt=\"2\"')) throw new Error('attempt attribute missing');
"

# Research cache round-trip (save → lookup → list → search → verify → prune)
run "research cache round-trip" node -e "
  const fs = require('fs'), path = require('path'), os = require('os');
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'ohc-research-'));
  process.chdir(tmp);
  const r = require('$ROOT/scripts/research.js');
  const fp = r.save({library:'next.js', topic:'app-router-metadata', payload:'### Usage\nexport const metadata = {...}', source:'context7', version:'15.0.0'});
  if (!fs.existsSync(fp)) throw new Error('save: file not written');
  const hit = r.lookup('next.js', 'app-router-metadata');
  if (!hit.hit || !hit.fresh) throw new Error('lookup: expected fresh hit');
  if (!hit.body.includes('export const metadata')) throw new Error('lookup: body missing');
  if (hit.meta.version !== '15.0.0') throw new Error('lookup: version mismatch');
  const list = r.list();
  if (list.length !== 1) throw new Error('list: expected 1 entry, got ' + list.length);
  const hits = r.search('metadata');
  if (hits.length !== 1) throw new Error('search: expected 1 hit');
  if (!r.markVerified('next.js', 'app-router-metadata', 'abc123')) throw new Error('markVerified failed');
  const after = r.lookup('next.js', 'app-router-metadata');
  if (!after.meta.verified_working || after.meta.verified_commit !== 'abc123') throw new Error('verify: metadata not updated');
  const idx = r.indexForSessionStart();
  if (!idx.includes('next.js')) throw new Error('index: missing library');
  const pruned = r.prune({olderThanDays: 0, expiredOnly: false}).removed.length;
  if (pruned !== 1) throw new Error('prune: expected 1 removal');
  if (r.list().length !== 0) throw new Error('prune: cache not empty after full prune');
  fs.rmSync(tmp, {recursive: true, force: true});
"

echo ""
echo "  ─────────────────────────────────────"
echo "  Passed: $PASS  Failed: $FAIL"
echo ""

[ "$FAIL" -eq 0 ] || exit 1
