#!/usr/bin/env node
/**
 * harness/extract-patterns.js — summarize session log for retro
 * Migration of: skills/retrospective/scripts/extract-patterns.py
 * No Python dependency required.
 *
 * Usage: node harness/extract-patterns.js [session-id]
 */

const fs   = require('fs');
const path = require('path');

const OHC         = path.join(process.cwd(), '.ohc');
const sessionsDir = path.join(OHC, 'state', 'sessions');
const targetId    = process.argv[2];

if (!fs.existsSync(sessionsDir)) {
  console.log('No sessions found. Run a workflow first.');
  process.exit(0);
}

const allSessions = fs.readdirSync(sessionsDir)
  .filter(d => fs.statSync(path.join(sessionsDir, d)).isDirectory())
  .sort()
  .reverse();

if (!allSessions.length) {
  console.log('No sessions found.');
  process.exit(0);
}

const sessionId = targetId || allSessions[0];
const sessionDir = path.join(sessionsDir, sessionId);
const logFile    = path.join(sessionDir, 'log.jsonl');
const metaFile   = path.join(sessionDir, 'meta.json');

if (!fs.existsSync(logFile)) {
  console.log(`No log in ${sessionId}. Session may be too new or has no tool calls.`);
  process.exit(0);
}

let meta = {};
try { meta = JSON.parse(fs.readFileSync(metaFile, 'utf8')); } catch {}

const events = fs.readFileSync(logFile, 'utf8')
  .split('\n').filter(Boolean)
  .map(l => { try { return JSON.parse(l); } catch { return null; } })
  .filter(Boolean);

const toolCalls = events.filter(e => e.type === 'tool_use');
const failures  = events.filter(e => e.type === 'tool_failure');
const byTool    = {};
for (const t of toolCalls) {
  const name = t.tool || 'unknown';
  byTool[name] = (byTool[name] || 0) + 1;
}

console.log(`# Session Analysis: ${sessionId}`);
if (meta.started)     console.log(`Started: ${meta.started}`);
if (meta.durationMin) console.log(`Duration: ${meta.durationMin} min`);
console.log(`Total events: ${events.length}`);
console.log('');

if (Object.keys(byTool).length) {
  console.log('## Tool Usage');
  const sorted = Object.entries(byTool).sort(([,a],[,b]) => b - a);
  for (const [tool, count] of sorted) {
    console.log(`  ${tool}: ${count}x`);
  }
  console.log('');
}

if (failures.length) {
  console.log(`## Failures (${failures.length} total)`);
  for (const f of failures.slice(0, 5)) {
    console.log(`  exit=${f.exitCode} $ ${(f.command || '').slice(0, 80)}`);
  }
  if (failures.length > 5) console.log(`  ... and ${failures.length - 5} more`);
  console.log('');
}

const bashCalls = toolCalls.filter(t => t.tool === 'Bash');
if (bashCalls.length) {
  console.log(`## Commands Run (${bashCalls.length} total)`);
  for (const b of bashCalls.slice(0, 5)) {
    const cmd = (b.input?.command || '').slice(0, 80);
    console.log(`  $ ${cmd}`);
  }
  if (bashCalls.length > 5) console.log(`  ... and ${bashCalls.length - 5} more`);
  console.log('');
}

console.log('## Retro Questions to Answer');
console.log('  1. Did the session follow the plan in .ohc/plans/?');
console.log('  2. What took longer than expected?');
console.log('  3. What was discovered that wasn\'t anticipated?');
console.log('  4. Is there a reusable pattern worth capturing as a skill?');
