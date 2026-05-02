#!/usr/bin/env node
/**
 * on-user-prompt.js — Claude Code UserPromptSubmit hook
 * Fires: once per user turn (before any tool calls)
 * Does:  keyword detection → inject skill/workflow/agent reminders
 * Input (stdin): { session_id, message, message_history }
 * Output (stdout): { action: "continue", system_reminder?: "..." }
 *
 * Moved from on-pre-tool.js (was firing 5-20x per turn — once per tool call)
 */

const fs   = require('fs');
const path = require('path');
const readline = require('readline');
const { keywordMapJson, skillSkillMd } = require('./resolve-paths');

const CWD = process.cwd();
const OHC = path.join(CWD, '.ohc');

function read(p) { try { return fs.readFileSync(p, 'utf8'); } catch { return null; } }
function mkdir(d) { if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true }); }
function readJson(p, fallback) {
  try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch { return fallback; }
}
function writeJson(p, data) {
  mkdir(path.dirname(p));
  fs.writeFileSync(p, JSON.stringify(data, null, 2));
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
function setActiveSkill(skill, isActive) {
  const state = readActiveSkills();
  state.skills = state.skills || {};
  if (isActive) state.skills[skill] = { activatedAt: Date.now() };
  else delete state.skills[skill];
  writeJson(activeSkillsPath(), state);
}

let keywordMap = {};
try { keywordMap = JSON.parse(read(keywordMapJson(CWD)) || '{}'); }
catch {}

let raw = '';
const rl = readline.createInterface({ input: process.stdin });
rl.on('line', l => raw += l);
rl.on('close', () => {
  let event = {};
  try { event = JSON.parse(raw); } catch {}

  // Prefer the current message field; fall back to last user message in history
  const currentMsg = (typeof event.message === 'string'
    ? event.message
    : (Array.isArray(event.message) ? event.message.map(b => b.text || '').join(' ') : '')
  ).toLowerCase();

  const lastHistoryMsg = ((event.message_history || [])
    .filter(m => m.role === 'user').slice(-1)[0]?.content || '').toLowerCase();

  const msgText = currentMsg || lastHistoryMsg;

  const reminders = [];
  const remindedSkills = new Set();
  const deactivatedSkills = new Set();

  for (const [kw, cfg] of Object.entries(keywordMap)) {
    if (kw.startsWith('_') || typeof cfg !== 'object') continue;
    if (!msgText.includes(kw.toLowerCase())) continue;

    if (cfg.skill) {
      if (deactivatedSkills.has(cfg.skill)) continue;
      if (cfg.mode === 'persistent') {
        if (cfg.action === 'deactivate') {
          setActiveSkill(cfg.skill, false);
          deactivatedSkills.add(cfg.skill);
          reminders.push(`<system_reminder skill="${cfg.skill}">
Keyword "${kw}" detected. Deactivating persistent skill: ${cfg.skill}
</system_reminder>`);
          continue;
        }
        if (cfg.action === 'activate') setActiveSkill(cfg.skill, true);
      }

      const reminder = readSkillReminder(
        cfg.skill,
        `Keyword "${kw}" detected. Activating skill: ${cfg.skill}`
      );
      if (reminder) reminders.push(reminder);
      remindedSkills.add(cfg.skill);
    }

    if (cfg.workflow) {
      reminders.push(`<system_reminder workflow="${cfg.workflow}">
Keyword "${kw}" detected. Run ${cfg.workflow} workflow.
${cfg.planGate ? 'Gate: pause at plan for human confirmation before BUILD.' : ''}
${(cfg.mode === 'persistence' || cfg.persistence) ? `Mode: persistence — keep going until tests pass (stop after ${cfg.stopOnBlocked || 3} blocked attempts).` : ''}
</system_reminder>`);
    }

    if (cfg.agent) {
      reminders.push(`<system_reminder agent="${cfg.agent}">
Keyword "${kw}" detected. Dispatch ${cfg.agent} agent via the Task tool.
</system_reminder>`);
    }
  }

  // Inject reminders for currently active persistent skills
  for (const skill of Object.keys(readActiveSkills().skills || {})) {
    if (remindedSkills.has(skill) || deactivatedSkills.has(skill)) continue;
    const reminder = readSkillReminder(skill, `Persistent skill active: ${skill}`);
    if (reminder) reminders.push(reminder);
  }

  process.stdout.write(JSON.stringify(
    reminders.length > 0
      ? { action: 'continue', system_reminder: reminders.join('\n') }
      : { action: 'continue' }
  ));
});
