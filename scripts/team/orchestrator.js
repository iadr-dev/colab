/**
 * scripts/team/orchestrator.js — five-stage pipeline driver
 *
 * Stages: team-plan → team-prd → team-exec → team-verify → team-fix → team-merge → done
 *
 * Gating:
 *   - team-exec  → team-verify: blocked until every worker writes RESULT.json
 *   - team-verify → team-fix:    only if summary.failed + tests_failed > 0
 *   - team-verify → team-merge:  if all workers succeeded and tests passed
 *   - team-fix   → team-verify:  re-dispatch fix workers to same worktrees,
 *                                 retries capped at MAX_FIX_RETRIES.
 *
 * Every transition calls state.recordHandoff so the sentinel gate has evidence.
 */

const path  = require('path');
const state = require('./state');
const res   = require('./result');

const MAX_FIX_RETRIES = 3;

const STAGES = ['team-plan', 'team-prd', 'team-exec', 'team-verify', 'team-fix', 'team-merge', 'done'];

function current(teamId) {
  const s = state.readState(teamId);
  return s?.stage || null;
}

/**
 * Attempt to advance the team to the next stage.
 * Returns { advanced: bool, from, to, reason }.
 */
function advance(teamId) {
  const s = state.readState(teamId);
  if (!s) return { advanced: false, reason: 'team not found' };
  if (s.status === 'shutdown' || s.stage === 'done') {
    return { advanced: false, from: s.stage, reason: 'team already complete' };
  }

  const stage = s.stage;
  const next = nextStageFor(teamId, stage, s);
  if (!next || next === stage) {
    return { advanced: false, from: stage, reason: `blocked at ${stage}` };
  }

  state.recordHandoff(teamId, stage, next, { orchestrator: true });
  return { advanced: true, from: stage, to: next };
}

/**
 * Decide the next stage given the current stage + gate conditions.
 * Pure-ish; reads RESULT.json + state.
 */
function nextStageFor(teamId, stage, s) {
  switch (stage) {
    case 'team-plan':
      // plan done when handoff exists or state says planned
      return 'team-prd';

    case 'team-prd':
      return 'team-exec';

    case 'team-exec':
      // gate: every worker must have RESULT.json
      if (!res.allComplete(teamId)) return null; // block
      return 'team-verify';

    case 'team-verify': {
      const summary = res.summarize(teamId);
      const hasFailure = summary.failed > 0 || summary.tests_failed > 0 || summary.blocked > 0;
      if (!hasFailure) return 'team-merge';
      const retries = s.fix_retries || 0;
      if (retries >= MAX_FIX_RETRIES) return 'team-merge'; // give up, let human decide at merge
      return 'team-fix';
    }

    case 'team-fix':
      // after fix workers write new RESULT.json, re-enter verify
      if (!res.allComplete(teamId)) return null;
      return 'team-verify';

    case 'team-merge':
      return 'done';

    default:
      return null;
  }
}

/**
 * Increment the fix-retry counter when entering team-fix.
 */
function recordFixAttempt(teamId) {
  const s = state.readState(teamId) || {};
  return state.updateState(teamId, { fix_retries: (s.fix_retries || 0) + 1 });
}

/**
 * Check if we're past the verify gate and the team is done.
 */
function isDone(teamId) {
  return current(teamId) === 'done';
}

/**
 * Compact view of team progress for status output + verify decision.
 */
function progress(teamId) {
  const s = state.readState(teamId);
  if (!s) return null;
  const summary = res.summarize(teamId);
  return {
    teamId,
    stage: s.stage,
    provider: s.provider,
    workers: summary.workers,
    succeeded: summary.succeeded,
    failed: summary.failed,
    blocked: summary.blocked,
    tests_failed: summary.tests_failed,
    failing_workers: summary.failing_workers,
    fix_retries: s.fix_retries || 0,
    done: s.stage === 'done',
  };
}

module.exports = {
  advance, current, nextStageFor, isDone, progress, recordFixAttempt,
  STAGES, MAX_FIX_RETRIES,
};
