#!/usr/bin/env node
/**
 * on-pre-tool.js — Claude Code PreToolUse hook
 * Fires: before every tool call
 * Does:
 *   - Scope validation for Write/Edit tools
 *   - Persistent-skill reminder injection
 *   - Session tool-use logging
 *
 * NOTE: keyword detection has been moved to on-user-prompt.js
 *       (UserPromptSubmit fires 1x per turn; PreToolUse fires N times)
 */

const fs   = require('fs');
const path = require('path');
const readline = require('readline');
const { skillSkillMd } = require('./resolve-paths');

const CWD = process.cwd();
const OHC = path.join(CWD, '.ohc');

function read(p) { try { return fs.readFileSync(p, 'utf8'); } catch { return null; } }
function mkdir(d) { if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true }); }
function readJson(p, fallback) {
  try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch { return fallback; }
}
function readSkillReminder(skill, reason) {
  const { abs, rel } = skillSkillMd(CWD, skill);
  const content = read(abs);
  if (!content) return null;
  return `<system_reminder skill="${skill}">
${reason}
${content.split('\n').slice(0, 40).join('\n')}
(Full instructions: ${rel})
</system_reminder>`;
}
function activeSkillsPath() {
  return path.join(OHC, 'state', 'active-skills.json');
}
function readActiveSkills() {
  return readJson(activeSkillsPath(), { skills: {} });
}

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

  // Persistent-skill reminders (re-inject every tool call so the model doesn't forget)
  for (const skill of Object.keys(readActiveSkills().skills || {})) {
    const reminder = readSkillReminder(skill, `Persistent skill active: ${skill}`);
    if (reminder) reminders.push(reminder);
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
