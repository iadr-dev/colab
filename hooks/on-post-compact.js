#!/usr/bin/env node
/**
 * on-post-compact.js — Claude Code PostCompact hook
 * Fires: after context window compaction completes
 * Does:
 *   - Re-inject SOUL, PROJECT, notepad, active-skills after compaction
 *     so the model regains context that was summarized away
 */

const fs   = require('fs');
const path = require('path');
const os   = require('os');

const CWD    = process.cwd();
const OHC    = path.join(CWD, '.ohc');
const GLOBAL = path.join(os.homedir(), '.ohc');

function read(p) { try { return fs.readFileSync(p, 'utf8'); } catch { return null; } }
function readJson(p, fallback) {
  try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch { return fallback; }
}

const soul    = read(path.join(GLOBAL, 'SOUL.md'));
const project = read(path.join(OHC, 'PROJECT.md'));
const notepad = read(path.join(OHC, 'notepad.md'));

const activeSkillsState = readJson(path.join(OHC, 'state', 'active-skills.json'), { skills: {} });
const activeSkillNames  = Object.keys(activeSkillsState.skills || {});

const parts = ['<ohc_post_compact_reinjection>'];
parts.push('Context was compacted. Re-injecting key state:');

if (soul)    parts.push(`\n<ohc_soul>\n${soul}\n</ohc_soul>`);
if (project) parts.push(`\n<ohc_project>\n${project}\n</ohc_project>`);
if (notepad) parts.push(`\n<ohc_session_state>\n${notepad}\n</ohc_session_state>`);

if (activeSkillNames.length > 0) {
  parts.push(`\n<ohc_active_skills>
Persistent skills still active after compaction: ${activeSkillNames.join(', ')}
These skills remain in effect for this session.
</ohc_active_skills>`);
}

parts.push('</ohc_post_compact_reinjection>');

process.stdout.write(JSON.stringify({
  type: 'system_reminder',
  content: parts.join('\n')
}));
