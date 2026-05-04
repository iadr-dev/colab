/**
 * scripts/team/result.js — worker RESULT.json contract
 *
 * Every worker writes exactly one RESULT.json at completion:
 *   .ohc/state/team/<teamId>/workers/<workerName>/RESULT.json
 *
 * Schema:
 * {
 *   status: "success" | "blocked" | "failed",
 *   tests: { passed: number, failed: number, skipped: number } | null,
 *   files_changed: string[],
 *   artifacts: string[],          // paths to generated docs/plans
 *   notes: string,                // short freeform summary
 *   completedAt: ISO string
 * }
 *
 * Orchestrator refuses to advance `team-exec → team-verify` until every worker
 * has a RESULT.json. Verify stage inspects the `tests` + `status` fields to
 * decide whether to dispatch a fix loop.
 */

const fs   = require('fs');
const path = require('path');

function getOHC() {
  return path.join(process.cwd(), '.ohc');
}

function mkdir(d) { if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true }); }

function resultPath(teamId, workerName) {
  return path.join(getOHC(), 'state', 'team', teamId, 'workers', workerName, 'RESULT.json');
}

/**
 * Write a worker result. Normalises missing fields.
 */
function write(teamId, workerName, data) {
  const dir = path.dirname(resultPath(teamId, workerName));
  mkdir(dir);
  const payload = {
    status: data.status || 'success',
    tests: data.tests || null,
    files_changed: data.files_changed || [],
    artifacts: data.artifacts || [],
    notes: data.notes || '',
    completedAt: data.completedAt || new Date().toISOString(),
  };
  fs.writeFileSync(resultPath(teamId, workerName), JSON.stringify(payload, null, 2));
  return payload;
}

/**
 * Read a worker result. Returns null if missing.
 */
function read(teamId, workerName) {
  const p = resultPath(teamId, workerName);
  if (!fs.existsSync(p)) return null;
  try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch { return null; }
}

/**
 * Read all worker results for a team. Missing ones are returned as null.
 */
function readAll(teamId) {
  const workersDir = path.join(getOHC(), 'state', 'team', teamId, 'workers');
  if (!fs.existsSync(workersDir)) return [];
  return fs.readdirSync(workersDir).map(name => ({
    name,
    result: read(teamId, name),
  }));
}

/**
 * Gate check: do all workers have RESULT.json?
 */
function allComplete(teamId) {
  const rs = readAll(teamId);
  if (!rs.length) return false;
  return rs.every(r => r.result !== null);
}

/**
 * Summary for verify stage: count failures across workers.
 * @returns { workers: number, succeeded: number, failed: number, tests_failed: number, failing_workers: string[] }
 */
function summarize(teamId) {
  const rs = readAll(teamId);
  const summary = {
    workers: rs.length,
    succeeded: 0,
    failed: 0,
    blocked: 0,
    tests_failed: 0,
    failing_workers: [],
  };
  for (const { name, result } of rs) {
    if (!result) { summary.failed++; summary.failing_workers.push(name); continue; }
    if (result.status === 'success') summary.succeeded++;
    else if (result.status === 'blocked') { summary.blocked++; summary.failing_workers.push(name); }
    else { summary.failed++; summary.failing_workers.push(name); }
    const tf = result.tests?.failed || 0;
    if (tf > 0 && !summary.failing_workers.includes(name)) summary.failing_workers.push(name);
    summary.tests_failed += tf;
  }
  return summary;
}

module.exports = { resultPath, write, read, readAll, allComplete, summarize };
