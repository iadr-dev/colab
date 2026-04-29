/**
 * scripts/team/state.js — team state management
 * Reads/writes .ohc/state/team/<team-id>/ directory structure:
 *   events.jsonl  — append-only event log
 *   tasks.json    — current task list and status
 *   workers/      — per-worker state
 *   handoffs/     — stage handoff records (used by sentinel gate)
 */

const fs   = require('fs');
const path = require('path');

const CWD = process.cwd();
const OHC = path.join(CWD, '.ohc');

function mkdir(d) { if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true }); }
function read(p)  { try { return fs.readFileSync(p, 'utf8'); } catch { return null; } }

function teamDir(teamId) {
  return path.join(OHC, 'state', 'team', teamId);
}

function init(teamId, { provider, n, task }) {
  const dir = teamDir(teamId);
  mkdir(dir);
  mkdir(path.join(dir, 'workers'));
  mkdir(path.join(dir, 'handoffs'));

  const state = {
    teamId, provider, n, task,
    status: 'running',
    stage: 'team-plan',
    started_at: new Date().toISOString(),
  };
  fs.writeFileSync(path.join(dir, 'state.json'), JSON.stringify(state, null, 2));
  appendEvent(teamId, 'team_start', state);
  return state;
}

function readState(teamId) {
  const f = path.join(teamDir(teamId), 'state.json');
  try { return JSON.parse(read(f) || 'null'); } catch { return null; }
}

function updateState(teamId, updates) {
  const s = readState(teamId) || {};
  const next = { ...s, ...updates, updated_at: new Date().toISOString() };
  mkdir(teamDir(teamId));
  fs.writeFileSync(path.join(teamDir(teamId), 'state.json'), JSON.stringify(next, null, 2));
  return next;
}

function appendEvent(teamId, type, data = {}) {
  const dir = teamDir(teamId);
  mkdir(dir);
  fs.appendFileSync(
    path.join(dir, 'events.jsonl'),
    JSON.stringify({ type, ts: new Date().toISOString(), ...data }) + '\n'
  );
}

function recordWorkerStart(teamId, workerName, data = {}) {
  const wDir = path.join(teamDir(teamId), 'workers', workerName);
  mkdir(wDir);
  fs.writeFileSync(path.join(wDir, 'started.json'),
    JSON.stringify({ workerName, startedAt: new Date().toISOString(), ...data }, null, 2));
  appendEvent(teamId, 'worker_start', { workerName, ...data });
}

function recordWorkerComplete(teamId, workerName, data = {}) {
  const wDir = path.join(teamDir(teamId), 'workers', workerName);
  mkdir(wDir);
  const startedRaw = read(path.join(wDir, 'started.json'));
  const started = startedRaw ? JSON.parse(startedRaw) : {};
  fs.writeFileSync(path.join(wDir, 'completed.json'),
    JSON.stringify({ workerName, startedAt: started.startedAt, completedAt: new Date().toISOString(), ...data }, null, 2));
  appendEvent(teamId, 'worker_complete', { workerName, ...data });
}

/**
 * Record a stage handoff (e.g. team-verify → team-fix).
 * Used by sentinel gate to ensure verify ran before fix.
 */
function recordHandoff(teamId, fromStage, toStage, data = {}) {
  const hDir = path.join(teamDir(teamId), 'handoffs');
  mkdir(hDir);
  const ts = Date.now();
  fs.writeFileSync(path.join(hDir, `${fromStage}-to-${toStage}-${ts}.json`),
    JSON.stringify({ from: fromStage, to: toStage, ts: new Date(ts).toISOString(), ...data }, null, 2));
  appendEvent(teamId, 'stage_handoff', { from: fromStage, to: toStage });
  return updateState(teamId, { stage: toStage });
}

/**
 * Check if a handoff from `fromStage` to `toStage` exists.
 * Returns the handoff record or null.
 */
function hasHandoff(teamId, fromStage, toStage) {
  const hDir = path.join(teamDir(teamId), 'handoffs');
  if (!fs.existsSync(hDir)) return null;
  const files = fs.readdirSync(hDir).filter(f => f.startsWith(`${fromStage}-to-${toStage}`));
  if (!files.length) return null;
  try { return JSON.parse(read(path.join(hDir, files[files.length - 1]))); } catch { return null; }
}

function getWorkers(teamId) {
  const wDir = path.join(teamDir(teamId), 'workers');
  if (!fs.existsSync(wDir)) return [];
  return fs.readdirSync(wDir).map(name => {
    const startedRaw   = read(path.join(wDir, name, 'started.json'));
    const completedRaw = read(path.join(wDir, name, 'completed.json'));
    return {
      name,
      started:   startedRaw   ? JSON.parse(startedRaw)   : null,
      completed: completedRaw ? JSON.parse(completedRaw) : null,
    };
  });
}

/**
 * List all active teams.
 */
function listTeams() {
  const dir = path.join(OHC, 'state', 'team');
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter(d => fs.statSync(path.join(dir, d)).isDirectory())
    .map(id => ({ teamId: id, ...readState(id) }));
}

module.exports = {
  init, readState, updateState, appendEvent,
  recordWorkerStart, recordWorkerComplete,
  recordHandoff, hasHandoff, getWorkers, listTeams,
};
