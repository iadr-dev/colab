/**
 * scripts/ralph.js — ralph state management (~120 LOC)
 *
 * Manages .ohc/state/ralph-state.json and session PRD files.
 * The loop itself runs in Claude Code; this module only persists state.
 *
 * Used by:
 *   - on-stop.js (check if ralph is active → inject continuation)
 *   - commands/ralph.md (describes the protocol)
 *   - ohc CLI: ohc ralph status | activate | deactivate | advance | reset
 */

const fs   = require('fs');
const path = require('path');

const CWD = process.cwd();
const OHC = path.join(CWD, '.ohc');

const STATE_PATH = path.join(OHC, 'state', 'ralph-state.json');

function mkdir(d) { if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true }); }
function read(p)  { try { return fs.readFileSync(p, 'utf8'); } catch { return null; } }
function readState() {
  try { return JSON.parse(read(STATE_PATH) || 'null'); } catch { return null; }
}
function writeState(s) {
  mkdir(path.dirname(STATE_PATH));
  fs.writeFileSync(STATE_PATH, JSON.stringify(s, null, 2));
}

/**
 * Activate ralph for a given goal.
 * @param {string} goal - Human description of done-state
 * @param {string[]} stories - Array of story titles
 * @param {object} opts - { max_iterations, stop_on_blocked }
 */
function activate(goal, stories, opts = {}) {
  const sessionId = read(path.join(OHC, 'state', 'current-session.txt'))?.trim() || 'default';
  const prdDir  = path.join(OHC, 'state', 'sessions', sessionId);
  mkdir(prdDir);
  const prdPath = path.join(prdDir, 'prd.json');

  const prd = {
    goal,
    created_at: new Date().toISOString(),
    stories: stories.map((title, i) => ({
      id: i + 1, title,
      status: 'pending',
      success_criterion: `${title} passes all tests`,
      attempt_count: 0,
    }))
  };
  fs.writeFileSync(prdPath, JSON.stringify(prd, null, 2));

  writeState({
    active:          true,
    prd_path:        prdPath,
    current_story:   0,
    total_stories:   stories.length,
    attempt_count:   0,
    max_iterations:  opts.max_iterations  || 10,
    stop_on_blocked: opts.stop_on_blocked || 3,
    started_at:      new Date().toISOString(),
    session_id:      sessionId,
  });

  return { state: readState(), prd };
}

/**
 * Advance ralph to the next story (call after verifier passes).
 */
function advance() {
  const s = readState();
  if (!s) throw new Error('ralph not active');
  s.current_story  = Math.min(s.current_story + 1, s.total_stories);
  s.attempt_count  = 0;
  if (s.current_story >= s.total_stories) {
    s.active = false;
    s.completed_at = new Date().toISOString();
  }
  // Update PRD story status
  try {
    const prd = JSON.parse(read(s.prd_path) || '{}');
    if (prd.stories?.[s.current_story - 1]) {
      prd.stories[s.current_story - 1].status = 'done';
    }
    if (s.current_story < s.total_stories && prd.stories?.[s.current_story]) {
      prd.stories[s.current_story].status = 'in_progress';
    }
    fs.writeFileSync(s.prd_path, JSON.stringify(prd, null, 2));
  } catch {}
  writeState(s);
  return s;
}

/**
 * Record a failed attempt; check if we should pause.
 * @returns { blocked: boolean, attempt_count: number }
 */
function recordFailure() {
  const s = readState();
  if (!s) throw new Error('ralph not active');
  s.attempt_count++;
  // Update PRD story attempt count
  try {
    const prd = JSON.parse(read(s.prd_path) || '{}');
    if (prd.stories?.[s.current_story]) {
      prd.stories[s.current_story].attempt_count = s.attempt_count;
      if (s.attempt_count >= s.stop_on_blocked) {
        prd.stories[s.current_story].status = 'blocked';
      }
    }
    fs.writeFileSync(s.prd_path, JSON.stringify(prd, null, 2));
  } catch {}
  writeState(s);
  return { blocked: s.attempt_count >= s.stop_on_blocked, attempt_count: s.attempt_count };
}

/**
 * Deactivate ralph.
 */
function deactivate() {
  const s = readState();
  if (!s) return;
  s.active = false;
  s.deactivated_at = new Date().toISOString();
  writeState(s);
}

/**
 * Get ralph's current status string for injection into prompts.
 */
function statusSummary() {
  const s = readState();
  if (!s || !s.active) return null;
  const prd = (() => { try { return JSON.parse(read(s.prd_path) || '{}'); } catch { return {}; } })();
  const story = prd.stories?.[s.current_story];
  return [
    `Ralph is ACTIVE (story ${s.current_story + 1}/${s.total_stories}, attempt ${s.attempt_count + 1}/${s.stop_on_blocked}).`,
    story ? `Current story: "${story.title}"` : '',
    story?.success_criterion ? `Success criterion: ${story.success_criterion}` : '',
    `Goal: ${prd.goal || '?'}`,
  ].filter(Boolean).join('\n');
}

module.exports = { activate, advance, recordFailure, deactivate, readState, statusSummary };

// CLI: node scripts/ralph.js <command>
if (require.main === module) {
  const [,, cmd, ...args] = process.argv;
  switch (cmd) {
    case 'status': {
      const s = readState();
      console.log(s ? JSON.stringify(s, null, 2) : 'ralph not active');
      break;
    }
    case 'activate': {
      const goal = args[0] || 'complete the task';
      const stories = args.slice(1).length ? args.slice(1) : ['implement', 'verify'];
      const r = activate(goal, stories);
      console.log('Activated:', JSON.stringify(r.state, null, 2));
      break;
    }
    case 'advance': {
      const s = advance();
      console.log('Advanced:', JSON.stringify(s, null, 2));
      break;
    }
    case 'fail': {
      const r = recordFailure();
      console.log(r.blocked ? `BLOCKED after ${r.attempt_count} attempts` : `Attempt ${r.attempt_count}`);
      break;
    }
    case 'deactivate': {
      deactivate();
      console.log('Deactivated.');
      break;
    }
    default:
      console.log('Usage: node scripts/ralph.js status | activate <goal> [stories...] | advance | fail | deactivate');
  }
}
