#!/usr/bin/env node
/**
 * on-subagent-stop.js — Claude Code SubagentStop hook
 * Fires: when a subagent (Task tool) finishes
 * Does:
 *   - Mark worker as complete in .ohc/state/team/<session-id>/workers/<name>/
 *   - Inject reminder for the subagent to flush learnings (parent picks it up)
 *   - Attempt to auto-flush any "what I learned" text from agent output
 */

const fs   = require('fs');
const path = require('path');
const readline = require('readline');
const memory = require('../scripts/memory');

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

  const workerDir = path.join(OHC, 'state', 'team', sessionId, 'workers', agentName);
  mkdir(workerDir);

  const startedRaw = read(path.join(workerDir, 'started.json'));
  const started    = startedRaw ? JSON.parse(startedRaw) : {};

  try {
    fs.writeFileSync(path.join(workerDir, 'completed.json'), JSON.stringify({
      agentName,
      startedAt:   started.startedAt || null,
      completedAt: new Date().toISOString(),
      sessionId
    }, null, 2));
  } catch {}

  // Auto-flush learning if the agent result contains a "what I learned" block
  const result = event.result || event.output || '';
  const learnMatch = typeof result === 'string' &&
    result.match(/what\s+(?:i|we|executor|verifier|debugger|planner)\s+learned[:\s]+([^\n]+(?:\n- [^\n]+)*)/i);
  if (learnMatch) {
    try {
      memory.appendLearning({
        source: agentName,
        task: started.task || '',
        sessionId,
        notes: learnMatch[0].slice(0, 500),
      });
    } catch {}
  }

  const reminder = `<system_reminder subagent_stop="${agentName}">
Subagent "${agentName}" has completed.
IMPORTANT: Append a brief summary to .ohc/notepad.md:
  ## What ${agentName} learned (${new Date().toISOString()})
  - what worked / what failed / what to watch for next time
This ensures team memory survives beyond this subagent's context.
</system_reminder>`;

  process.stdout.write(JSON.stringify({
    action: 'continue',
    system_reminder: reminder
  }));
});
