#!/usr/bin/env node
/**
 * on-stop.js — Claude Code stop hook
 * Fires: when agent finishes a response
 * Does:  save session summary, suggest retro after 30min
 */

const fs   = require('fs');
const path = require('path');
const readline = require('readline');

const CWD = process.cwd();
const OHC = path.join(CWD, '.ohc');

function read(p) { try { return fs.readFileSync(p, 'utf8'); } catch { return null; } }

let raw = '';
const rl = readline.createInterface({ input: process.stdin });
rl.on('line', l => raw += l);
rl.on('close', () => {
  let event = {};
  try { event = JSON.parse(raw); } catch {}

  const sessionId = read(path.join(OHC, 'state', 'current-session.txt'))?.trim();
  if (!sessionId) { process.stdout.write(JSON.stringify({ action: 'continue' })); return; }

  const sessionDir = path.join(OHC, 'state', 'sessions', sessionId);
  let meta = {};
  try { meta = JSON.parse(read(path.join(sessionDir, 'meta.json')) || '{}'); } catch {}

  const started     = meta.started ? new Date(meta.started) : new Date();
  const durationMin = Math.round((Date.now() - started.getTime()) / 60000);
  meta.ended        = new Date().toISOString();
  meta.durationMin  = durationMin;
  try { fs.writeFileSync(path.join(sessionDir, 'meta.json'), JSON.stringify(meta, null, 2)); } catch {}

  // Build summary
  const logContent = read(path.join(sessionDir, 'log.jsonl')) || '';
  const events     = logContent.split('\n').filter(Boolean).map(l => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);
  const toolCalls  = events.filter(e => e.type === 'tool_use');
  const fileEdits  = toolCalls.filter(e => ['Write','Edit','MultiEdit'].includes(e.tool));

  const history     = event.message_history || [];
  const lastContent = history.filter(m => m.role === 'assistant').slice(-1)[0]?.content || '';
  const lastText    = typeof lastContent === 'string' ? lastContent : '[no text]';

  const summary = `# Session Summary
Session: ${sessionId}
Duration: ${durationMin} minutes
Tool calls: ${toolCalls.length} (${fileEdits.length} file edits)

## Last Agent Message
${lastText.slice(0, 300)}${lastText.length > 300 ? '...' : ''}
`;
  try { fs.writeFileSync(path.join(sessionDir, 'summary.md'), summary); } catch {}

  // Retro prompt — only suggest once per session (guard with retro_done flag)
  const retroReminder = (durationMin >= 30 && !meta.retro_done)
    ? `\n\n<system_reminder retro_prompt="true">
Session has run ${durationMin} minutes. Run /ohc-retro to capture learnings and update memory files.
(This reminder will not repeat once /ohc-retro has run.)
</system_reminder>`
    : '';

  // Ralph continuation — if ralph is active, inject next-iteration prompt
  let ralphReminder = '';
  try {
    const ralph = require('../scripts/ralph');
    const summary = ralph.statusSummary();
    if (summary) {
      ralphReminder = `\n\n<system_reminder ralph_continuation="true">
${summary}
Ralph is still active. Continue iteration on the current story when the next session starts.
</system_reminder>`;
    }
  } catch {}

  process.stdout.write(JSON.stringify({
    action: 'continue',
    ...(retroReminder || ralphReminder ? { system_reminder: retroReminder + ralphReminder } : {})
  }));
});
