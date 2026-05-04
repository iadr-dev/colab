/**
 * tests/unit/scripts/memory.test.js
 * Unit tests for scripts/memory.js
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

let tmpDir, prevCwd, prevHome;

function freshRequire() {
  // Clear require cache so module picks up new CWD / HOME
  const memPath = require.resolve('../../../scripts/memory');
  delete require.cache[memPath];
  return require(memPath);
}

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ohc-mem-'));
  prevCwd = process.cwd();
  prevHome = os.homedir;
  process.chdir(tmpDir);
  // Mock os.homedir to isolate from real ~/.ohc
  os.homedir = () => tmpDir;
  // Create .ohc structure
  fs.mkdirSync(path.join(tmpDir, '.ohc', 'state', 'sessions', 'sess1'), { recursive: true });
  fs.writeFileSync(path.join(tmpDir, '.ohc', 'state', 'current-session.txt'), 'sess1');
});

afterEach(() => {
  process.chdir(prevCwd);
  os.homedir = prevHome;
  try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch {}
});

describe('snapshotNotepad', () => {
  it('creates precompact snapshot file', () => {
    fs.writeFileSync(path.join(tmpDir, '.ohc', 'notepad.md'), '# My Notes\n- item 1');
    fs.writeFileSync(path.join(tmpDir, '.ohc', 'state', 'active-skills.json'), '{"skills":{"tdd":{}}}');
    const memory = freshRequire();
    const ts = 1700000000000;
    memory.snapshotNotepad('sess1', ts);
    const snap = path.join(tmpDir, '.ohc', 'state', 'sessions', 'sess1', `precompact-${ts}.md`);
    expect(fs.existsSync(snap)).toBe(true);
    const content = fs.readFileSync(snap, 'utf8');
    expect(content).toContain('# PreCompact Snapshot');
    expect(content).toContain('# My Notes');
    expect(content).toContain('"tdd"');
  });

  it('handles empty sessionId gracefully', () => {
    const memory = freshRequire();
    // Should not throw
    memory.snapshotNotepad(null);
    memory.snapshotNotepad('');
  });

  it('handles missing notepad gracefully', () => {
    const memory = freshRequire();
    memory.snapshotNotepad('sess1', Date.now());
    // Should write (empty) as notepad content
    const files = fs.readdirSync(path.join(tmpDir, '.ohc', 'state', 'sessions', 'sess1'));
    expect(files.some(f => f.startsWith('precompact-'))).toBe(true);
  });
});

describe('appendLearning', () => {
  it('appends JSONL line to learnings.jsonl', () => {
    const memory = freshRequire();
    memory.appendLearning({ task: 'fix bug', what_worked: 'read logs', sessionId: 's1' });
    const file = path.join(tmpDir, '.ohc', 'learnings.jsonl');
    expect(fs.existsSync(file)).toBe(true);
    const line = JSON.parse(fs.readFileSync(file, 'utf8').trim());
    expect(line.task).toBe('fix bug');
    expect(line.what_worked).toBe('read logs');
    expect(line.ts).toBeDefined();
    expect(line.project).toBeDefined();
  });

  it('appends multiple entries', () => {
    const memory = freshRequire();
    memory.appendLearning({ task: 'a' });
    memory.appendLearning({ task: 'b' });
    const lines = fs.readFileSync(path.join(tmpDir, '.ohc', 'learnings.jsonl'), 'utf8')
      .split('\n').filter(Boolean);
    expect(lines).toHaveLength(2);
  });
});

describe('appendSelfEval', () => {
  it('appends to self-eval.jsonl', () => {
    const memory = freshRequire();
    memory.appendSelfEval({ sessionId: 's1', durationMin: 45, retro_done: true });
    const file = path.join(tmpDir, '.ohc', 'self-eval.jsonl');
    expect(fs.existsSync(file)).toBe(true);
    const line = JSON.parse(fs.readFileSync(file, 'utf8').trim());
    expect(line.sessionId).toBe('s1');
    expect(line.durationMin).toBe(45);
    expect(line.retro_done).toBe(true);
  });
});

describe('readRecentLearnings', () => {
  it('returns empty array when file missing', () => {
    const memory = freshRequire();
    expect(memory.readRecentLearnings()).toEqual([]);
  });

  it('returns last N entries', () => {
    const memory = freshRequire();
    for (let i = 0; i < 10; i++) {
      memory.appendLearning({ task: `task-${i}` });
    }
    const recent = memory.readRecentLearnings(3);
    expect(recent).toHaveLength(3);
    expect(recent[0].task).toBe('task-7');
    expect(recent[2].task).toBe('task-9');
  });

  it('handles malformed JSON lines gracefully', () => {
    const file = path.join(tmpDir, '.ohc', 'learnings.jsonl');
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, '{"task":"ok"}\nnot-json\n{"task":"also-ok"}\n');
    const memory = freshRequire();
    const result = memory.readRecentLearnings(5);
    expect(result).toHaveLength(2);
  });
});

describe('appendToProjectGotchas', () => {
  it('inserts under existing ## Known Gotchas heading', () => {
    const projectFile = path.join(tmpDir, '.ohc', 'PROJECT.md');
    fs.writeFileSync(projectFile, '# Project\n\n## Known Gotchas\n- old gotcha\n\n## Other\n');
    const memory = freshRequire();
    memory.appendToProjectGotchas('npm install fails on Windows');
    const content = fs.readFileSync(projectFile, 'utf8');
    expect(content).toContain('npm install fails on Windows');
    expect(content).toContain('- old gotcha');
  });

  it('creates section if missing', () => {
    const projectFile = path.join(tmpDir, '.ohc', 'PROJECT.md');
    fs.writeFileSync(projectFile, '# Project\n\nSome content.\n');
    const memory = freshRequire();
    memory.appendToProjectGotchas('new gotcha');
    const content = fs.readFileSync(projectFile, 'utf8');
    expect(content).toContain('## Known Gotchas');
    expect(content).toContain('new gotcha');
  });

  it('does nothing if PROJECT.md does not exist', () => {
    const memory = freshRequire();
    // Should not throw
    memory.appendToProjectGotchas('something');
  });
});
