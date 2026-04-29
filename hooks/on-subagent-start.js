#!/usr/bin/env node
/**
 * on-subagent-start.js — Claude Code SubagentStart hook
 * Fires: when a subagent (Task tool) begins
 * Does:
 *   - Record worker start time and metadata in .ohc/state/team/<session-id>/workers/<name>/
 *   - Increment active worker count for team status reporting
 */

const fs   = require('fs');
const path = require('path');
const readline = require('readline');

const CWD = process.cwd();
const OHC = path.join(CWD, '.ohc');

function mkdir(d) { if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true }); }
function read(p)  { try { return fs.readFileSync(p, 'utf8'); } catch { return null; } }

let raw = '';
const rl = readline.createInterface({ input: process.stdin });
rl.on('line', l => raw += l);
rl.on('close', () => {
  let event = {};
  try { event = JSON.parse(raw); } catch {}

  const sessionId = read(path.join(OHC, 'state', 'current-session.txt'))?.trim() || 'unknown';
  const agentName = event.agent_name || event.subagent_name || 'unnamed';
  const task      = event.task || event.prompt || '';

  const workerDir = path.join(OHC, 'state', 'team', sessionId, 'workers', agentName);
  mkdir(workerDir);

  try {
    fs.writeFileSync(path.join(workerDir, 'started.json'), JSON.stringify({
      agentName,
      task: task.slice(0, 500),
      startedAt: new Date().toISOString(),
      sessionId
    }, null, 2));
  } catch {}

  process.stdout.write(JSON.stringify({ action: 'continue' }));
});
