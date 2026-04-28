#!/usr/bin/env node
/**
 * on-pre-tool.js — Claude Code pre-tool-use hook
 * Fires: before every tool call
 * Does:  keyword detection → inject skill content; scope validation for Write/Edit
 * Input (stdin): { tool_name, tool_input, session_id, message_history }
 * Output (stdout): { action: "continue", system_reminder?: "..." }
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const CWD = process.cwd();
const OHC = path.join(CWD, '.ohc');

function read(p) { try { return fs.readFileSync(p, 'utf8'); } catch { return null; } }

let keywordMap = {};
try { keywordMap = JSON.parse(read(path.join(CWD, 'hooks', 'keyword-map.json')) || '{}'); }
catch {}

let raw = '';
const rl = readline.createInterface({ input: process.stdin });
rl.on('line', l => raw += l);
rl.on('close', () => {
  let event = {};
  try { event = JSON.parse(raw); } catch {}

  const toolName  = event.tool_name || '';
  const toolInput = event.tool_input || {};
  const sessionId = read(path.join(OHC, 'state', 'current-session.txt'))?.trim();

  // Log event
  if (sessionId) {
    const log = path.join(OHC, 'state', 'sessions', sessionId, 'log.jsonl');
    try {
      fs.appendFileSync(log, JSON.stringify({
        type: 'tool_use', tool: toolName, input: toolInput, ts: Date.now()
      }) + '\n');
    } catch {}
  }

  const reminders = [];

  // Keyword detection from last user message
  const lastMsg = ((event.message_history || [])
    .filter(m => m.role === 'user').slice(-1)[0]?.content || '').toLowerCase();

  for (const [kw, cfg] of Object.entries(keywordMap)) {
    if (kw.startsWith('_') || typeof cfg !== 'object') continue;
    if (!lastMsg.includes(kw.toLowerCase())) continue;

    if (cfg.skill) {
      const skillPath = path.join(CWD, 'skills', cfg.skill, 'SKILL.md');
      const content = read(skillPath);
      if (content) {
        reminders.push(`<system_reminder skill="${cfg.skill}">
Keyword "${kw}" detected. Activating skill: ${cfg.skill}
${content.split('\n').slice(0, 40).join('\n')}
(Full instructions: skills/${cfg.skill}/SKILL.md)
</system_reminder>`);
      }
    }

    if (cfg.workflow) {
      reminders.push(`<system_reminder workflow="${cfg.workflow}">
Keyword "${kw}" detected. Run ${cfg.workflow} workflow.
${cfg.planGate ? 'Gate: pause at plan for human confirmation before BUILD.' : ''}
${cfg.persistence ? `Mode: persistence — keep going until tests pass (stop after ${cfg.stopOnBlocked || 3} blocked attempts).` : ''}
</system_reminder>`);
    }
  }

  // Scope validation for file-writing tools
  if (['Write', 'Edit', 'MultiEdit'].includes(toolName)) {
    const notepad = read(path.join(OHC, 'notepad.md')) || '';
    const match = notepad.match(/## Current Task\n([\s\S]*?)(?=\n##|$)/);
    const task = match?.[1]?.trim() || '';
    if (task && task !== '(none)') {
      reminders.push(`<system_reminder scope="active">
Active task: "${task.split('\n')[0]}"
Ensure this file edit is within scope. Out-of-scope changes → log to .ohc/notepad.md, don't apply.
</system_reminder>`);
    }
  }

  process.stdout.write(JSON.stringify(
    reminders.length > 0
      ? { action: 'continue', system_reminder: reminders.join('\n') }
      : { action: 'continue' }
  ));
});
