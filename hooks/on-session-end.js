#!/usr/bin/env node
/**
 * on-session-end.js — Claude Code SessionEnd hook
 * Fires: when a Claude Code session is ending
 * Does:
 *   - Flush session summary to disk
 *   - Call memory.appendSelfEval() for per-session metrics
 *   - Inject retro suggestion if session was long and retro hasn't run
 */

const fs   = require('fs');
const path = require('path');
const readline = require('readline');
const memory = require('../scripts/memory');

const { getOHC } = require('./resolve-paths');

function extractShallowLearnings(sessionDir, sessionId, memory) {
  const logPath = path.join(sessionDir, 'log.jsonl');
  if (!fs.existsSync(logPath)) return 0;
  
  const logContent = fs.readFileSync(logPath, 'utf8');
  const lines = logContent.split('\n').filter(Boolean);
  const entries = lines
    .map(l => { try { return JSON.parse(l); } catch { return null; } })
    .filter(Boolean);
    
  const failures = entries.filter(e => e.type === 'tool_failure');
  // Note: Adjust tool_call success detection based on actual log format if needed
  const successes = entries.filter(e => e.type === 'tool_result' && !e.isError);
  
  let count = 0;
  const seen = new Set();

  // Process failures
  for (const f of failures) {
    const key = `fail:${(f.command || f.tool || '').slice(0, 50)}`;
    if (!seen.has(key)) {
      seen.add(key);
      memory.appendLearning({
        source: 'session-end-auto',
        task: 'session-debug',
        sessionId,
        what_failed: `Tool/Command \`${f.command || f.tool}\` failed.`,
        notes: (f.output || f.message || '').slice(0, 200)
      });
      count++;
    }
  }

  // Process high-value successes
  const highValueTools = ['write_to_file', 'replace_file_content', 'multi_replace_file_content', 'run_command'];
  for (const s of successes) {
    if (!highValueTools.includes(s.tool)) continue;
    const key = `success:${s.tool}:${(s.parameters?.TargetFile || s.command || '').slice(0, 50)}`;
    if (!seen.has(key)) {
      seen.add(key);
      memory.appendLearning({
        source: 'session-end-auto',
        task: 'milestone-completion',
        sessionId,
        what_worked: `Successful use of \`${s.tool}\` on ${s.parameters?.TargetFile || s.command || 'target'}.`,
        notes: 'Automated extraction of successful tool milestone.'
      });
      count++;
    }
  }
  
  return count;
}

function read(p) { try { return fs.readFileSync(p, 'utf8'); } catch { return null; } }
function mkdir(d) { if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true }); }

let raw = '';
const rl = readline.createInterface({ input: process.stdin });
rl.on('line', l => raw += l);
rl.on('close', () => {
  let event = {};
  try { event = JSON.parse(raw); } catch {}

  const ohc = getOHC(process.cwd());
  const sessionId = read(path.join(ohc, 'state', 'current-session.txt'))?.trim();
  if (!sessionId) {
    process.stdout.write(JSON.stringify({ action: 'continue' }));
    return;
  }

  const sessionDir = path.join(ohc, 'state', 'sessions', sessionId);
  mkdir(sessionDir);

  let meta = {};
  try { meta = JSON.parse(read(path.join(sessionDir, 'meta.json')) || '{}'); } catch {}

  const started     = meta.started ? new Date(meta.started) : new Date();
  const durationMin = Math.round((Date.now() - started.getTime()) / 60000);

  meta.ended       = new Date().toISOString();
  meta.durationMin = durationMin;
  meta.endReason   = event.stop_reason || 'session_end';
  try {
    fs.writeFileSync(path.join(sessionDir, 'meta.json'), JSON.stringify(meta, null, 2));
  } catch {}

  // Count tool failures from session log
  const logContent = read(path.join(sessionDir, 'log.jsonl')) || '';
  const failedTools = logContent.split('\n').filter(Boolean)
    .map(l => { try { return JSON.parse(l); } catch { return null; } })
    .filter(e => e?.type === 'tool_failure').length;

  // Persist self-eval metrics to ~/.ohc/self-eval.jsonl
  try {
    memory.appendSelfEval({
      sessionId,
      durationMin,
      tool_failures: failedTools,
      retro_done: meta.retro_done || false,
    });
  } catch {}

  // Auto-prune stale research cache entries (past TTL)
  try {
    const research = require('../scripts/research');
    research.prune({ expiredOnly: true });
  } catch {}

  // Write session-end marker
  try {
    fs.writeFileSync(path.join(sessionDir, 'session-end.json'), JSON.stringify({
      sessionId,
      endedAt: meta.ended,
      durationMin,
      retroDone: meta.retro_done || false,
      toolFailures: failedTools,
    }, null, 2));
  } catch {}

  // Auto-extract shallow learnings if session was long
  if (durationMin >= 30) {
    try {
      extractShallowLearnings(sessionDir, sessionId, memory);
    } catch {}
  }

  const parts = [];
  if (durationMin >= 30 && !meta.retro_done) {
    const { spawn } = require('child_process');
    const tmux = require('../scripts/team/tmux');
    
    let cli = null;
    if (tmux.isProviderCliAvailable('gemini')) cli = 'gemini';
    else if (tmux.isProviderCliAvailable('codex')) cli = 'codex';
    
    if (cli && !process.env.OHC_NO_BACKGROUND_RETRO) {
      try {
        const child = spawn(cli, ['retro'], {
          detached: true,
          stdio: 'ignore',
          shell: process.platform === 'win32'
        });
        child.unref();
        
        meta.retro_done = true;
        try {
          fs.writeFileSync(path.join(sessionDir, 'meta.json'), JSON.stringify(meta, null, 2));
        } catch {}
      } catch (err) {}
    } else {
      parts.push(`<system_reminder session_end="true">
Session ended after ${durationMin} minutes.
Learnings have NOT been captured yet.
Run /ohc-retro to distill what worked, what failed, and update memory files before the context is lost.
</system_reminder>`);
    }
  }

  process.stdout.write(JSON.stringify(
    parts.length > 0
      ? { action: 'continue', system_reminder: parts.join('\n') }
      : { action: 'continue' }
  ));
});
