#!/usr/bin/env node
/**
 * on-stop.js — Claude Code stop hook
 * Fires: when agent finishes a response
 * Does:  save session summary, send notifications, suggest retro after 30min
 */

const fs   = require('fs');
const path = require('path');
const os   = require('os');
const https = require('https');
const readline = require('readline');

const CWD    = process.cwd();
const OHC    = path.join(CWD, '.ohc');
const CONFIG = path.join(os.homedir(), '.ohc', 'config.json');

function read(p) { try { return fs.readFileSync(p, 'utf8'); } catch { return null; } }
function cfg() { try { return JSON.parse(read(CONFIG) || '{}'); } catch { return {}; } }

let raw = '';
const rl = readline.createInterface({ input: process.stdin });
rl.on('line', l => raw += l);
rl.on('close', async () => {
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

  // Retro prompt
  const retroReminder = durationMin >= 30
    ? `\n\n<system_reminder retro_prompt="true">
Session ran ${durationMin} minutes. Run /retro to capture learnings and update memory files.
</system_reminder>`
    : '';

  // Notify
  const config = cfg();
  if (config.notifications?.provider && config.notifications.provider !== 'none') {
    try {
      await notify(config.notifications, `oh-my-colab (${durationMin}min): ${lastText.slice(0, 200)}`);
    } catch {}
  }

  process.stdout.write(JSON.stringify({
    action: 'continue',
    ...(retroReminder ? { system_reminder: retroReminder } : {})
  }));
});

async function notify({ provider, webhookUrl }, message) {
  const url  = new URL(webhookUrl || '');
  const body = JSON.stringify(provider === 'discord'
    ? { embeds: [{ title: '🧠 oh-my-colab', description: message, color: 0x7c3aed }] }
    : { text: message }
  );
  return new Promise(res => {
    const req = https.request({
      hostname: url.hostname, path: url.pathname + url.search, method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) }
    }, r => { r.resume(); res(); });
    req.on('error', res);
    req.write(body); req.end();
  });
}
