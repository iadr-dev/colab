#!/usr/bin/env node
/**
 * on-session-start.js — Claude Code session start hook
 * Fires: when a new Claude Code session begins
 * Loads: SOUL.md, USER.md, PROJECT.md, notepad.md into context
 * Output: JSON { type: "system_reminder", content: "..." }
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

const CWD = process.cwd();
const OHC = path.join(CWD, '.ohc');
const GLOBAL = path.join(os.homedir(), '.ohc');
const SESSION_ID = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

function read(p) { try { return fs.readFileSync(p, 'utf8'); } catch { return null; } }
function mkdir(d) { if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true }); }

// Init session dirs
mkdir(path.join(OHC, 'state', 'sessions', SESSION_ID));
mkdir(path.join(OHC, 'plans'));
mkdir(path.join(OHC, 'skills'));
mkdir(path.join(OHC, 'research'));
mkdir(path.join(OHC, 'logs'));

fs.writeFileSync(
  path.join(OHC, 'state', 'sessions', SESSION_ID, 'meta.json'),
  JSON.stringify({ started: new Date().toISOString(), cwd: CWD }, null, 2)
);
fs.writeFileSync(path.join(OHC, 'state', 'current-session.txt'), SESSION_ID);

// Load memory files
const soul     = read(path.join(GLOBAL, 'SOUL.md'));
const user     = read(path.join(GLOBAL, 'USER.md'));
const project  = read(path.join(OHC, 'PROJECT.md'));
const notepad  = read(path.join(OHC, 'notepad.md'));
const workflow = read(path.join(OHC, 'state', 'current-workflow.json'));

// Load recent learnings from cross-session JSONL
let recentLearnings = null;
try {
  const memory = require('../scripts/memory');
  const learnings = memory.readRecentLearnings(5);
  if (learnings.length > 0) {
    recentLearnings = learnings.map((l, i) =>
      `${i + 1}. [${l.ts?.slice(0, 10) || '?'}] ${l.notes || l.what_worked || JSON.stringify(l)}`
    ).join('\n');
  }
} catch {}

// Load research cache index (anti-goldfish for external docs)
let researchIndex = null;
try {
  const research = require('../scripts/research');
  researchIndex = research.indexForSessionStart(20) || null;
} catch {}

const parts = [];
if (soul)    parts.push(`<ohc_soul>\n${soul}\n</ohc_soul>`);
if (user)    parts.push(`<ohc_user>\n${user}\n</ohc_user>`);
if (project) parts.push(`<ohc_project>\n${project}\n</ohc_project>`);
if (notepad) parts.push(`<ohc_session_state>\n${notepad}\n</ohc_session_state>`);

if (recentLearnings) {
  parts.push(`<ohc_recent_learnings>
Last 5 cross-session learnings (anti-goldfish-brain):
${recentLearnings}
</ohc_recent_learnings>`);
}

if (researchIndex) {
  parts.push(`<ohc_research_index>
${researchIndex}
</ohc_research_index>`);
}

if (workflow) {
  try {
    const wf = JSON.parse(workflow);
    parts.push(`<ohc_workflow_resume>
Workflow "${wf.name}" was in progress (step ${wf.step}/${wf.total}).
Resume from: ${wf.currentTask || 'last checkpoint'}
Plan: ${wf.planPath || '.ohc/plans/'}
</ohc_workflow_resume>`);
  } catch {}
}

if (parts.length === 0) {
  parts.push(`<ohc_first_run>
No ohc state found. Run /ohc-setup or \`ohc setup\` to initialize oh-my-colab.
</ohc_first_run>`);
}

process.stdout.write(JSON.stringify({
  type: 'system_reminder',
  content: parts.join('\n\n')
}));
