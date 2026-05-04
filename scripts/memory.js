/**
 * scripts/memory.js — oh-my-colab memory layer
 *
 * Single module for all persistent memory writes. Used by hooks:
 *   - on-pre-compact.js  → snapshotNotepad()
 *   - on-session-end.js  → appendLearning() + appendSelfEval()
 *   - on-subagent-stop.js → appendLearning()
 *   - on-post-tool-failure.js → appendToProjectGotchas()
 *
 * All functions are synchronous (fs.writeFileSync) for use in
 * PreCompact hook's ~500ms budget. No network, no MCP.
 */

const fs   = require('fs');
const path = require('path');
const os   = require('os');

const getCWD    = () => process.cwd();
const getOHC    = () => path.join(getCWD(), '.ohc');
const getGLOBAL = () => process.env.OHC_GLOBAL_DIR || path.join(os.homedir(), '.ohc');

function mkdir(d) { if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true }); }
function read(p) { try { return fs.readFileSync(p, 'utf8'); } catch { return null; } }

/**
 * Snapshot current notepad.md and active-skills to a precompact file.
 * Called from on-pre-compact.js with sessionId and timestamp.
 */
function snapshotNotepad(sessionId, ts = Date.now()) {
  if (!sessionId) return;
  const snapDir = path.join(getOHC(), 'state', 'sessions', sessionId);
  mkdir(snapDir);

  const notepad      = read(path.join(getOHC(), 'notepad.md')) || '(empty)';
  const activeSkills = read(path.join(getOHC(), 'state', 'active-skills.json')) || '{}';

  const snapshot = `# PreCompact Snapshot
session: ${sessionId}
timestamp: ${new Date(ts).toISOString()}

## Notepad
${notepad}

## Active Skills
\`\`\`json
${activeSkills}
\`\`\`
`;
  fs.writeFileSync(path.join(snapDir, `precompact-${ts}.md`), snapshot);
}

/**
 * Append a learning entry to ~/.ohc/learnings.jsonl (cross-project, append-only).
 * @param {object} entry - { task, what_worked, what_failed, source, sessionId }
 */
function appendLearning(entry) {
  mkdir(getGLOBAL());
  const file = path.join(getGLOBAL(), 'learnings.jsonl');
  const line = JSON.stringify({
    ts: new Date().toISOString(),
    project: path.basename(getCWD()),
    ...entry
  });
  fs.appendFileSync(file, line + '\n');
}

/**
 * Append a self-eval entry to ~/.ohc/self-eval.jsonl.
 * @param {object} entry - { sessionId, durationMin, plan_hit_rate, tests_failed_count, retro_done }
 */
function appendSelfEval(entry) {
  mkdir(getGLOBAL());
  const file = path.join(getGLOBAL(), 'self-eval.jsonl');
  const line = JSON.stringify({
    ts: new Date().toISOString(),
    project: path.basename(getCWD()),
    ...entry
  });
  fs.appendFileSync(file, line + '\n');
}

/**
 * Read the most recent N learning entries from ~/.ohc/learnings.jsonl.
 * Returns an array of parsed objects (newest last).
 */
function readRecentLearnings(n = 5) {
  const file = path.join(getGLOBAL(), 'learnings.jsonl');
  if (!fs.existsSync(file)) return [];
  const lines = fs.readFileSync(file, 'utf8')
    .split('\n')
    .filter(Boolean)
    .slice(-n);
  return lines.map(l => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);
}

/**
 * Append a gotcha entry to .ohc/PROJECT.md under ## Known Gotchas.
 * Called when a Bash command fails twice on similar commands.
 */
function appendToProjectGotchas(gotcha) {
  const projectFile = path.join(getOHC(), 'PROJECT.md');
  if (!fs.existsSync(projectFile)) return;

  const content  = fs.readFileSync(projectFile, 'utf8');
  const entry    = `\n- **${new Date().toISOString().split('T')[0]}**: ${gotcha}`;
  const marker   = '## Known Gotchas';
  const idx      = content.indexOf(marker);

  if (idx !== -1) {
    // Insert after the ## Known Gotchas heading
    const insertAt = idx + marker.length;
    const updated  = content.slice(0, insertAt) + entry + content.slice(insertAt);
    fs.writeFileSync(projectFile, updated);
  } else {
    // Append section if it doesn't exist
    fs.appendFileSync(projectFile, `\n\n## Known Gotchas\n${entry}\n`);
  }
}

module.exports = {
  snapshotNotepad,
  appendLearning,
  appendSelfEval,
  readRecentLearnings,
  appendToProjectGotchas,
};
