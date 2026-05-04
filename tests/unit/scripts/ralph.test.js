/**
 * tests/unit/scripts/ralph.test.js
 * Unit tests for scripts/ralph.js
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

let tmpDir, prevCwd;

function freshRequire() {
  const modPath = require.resolve('../../../scripts/ralph');
  delete require.cache[modPath];
  return require(modPath);
}

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ohc-ralph-'));
  prevCwd = process.cwd();
  process.chdir(tmpDir);
  // Create .ohc state structure
  fs.mkdirSync(path.join(tmpDir, '.ohc', 'state', 'sessions', 'default'), { recursive: true });
  fs.writeFileSync(path.join(tmpDir, '.ohc', 'state', 'current-session.txt'), 'default');
});

afterEach(() => {
  process.chdir(prevCwd);
  try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch {}
});

describe('readState', () => {
  it('returns null when no state file', () => {
    const ralph = freshRequire();
    expect(ralph.readState()).toBeNull();
  });
});

describe('activate', () => {
  it('creates state + PRD files', () => {
    const ralph = freshRequire();
    const { state, prd } = ralph.activate('Ship feature X', ['build UI', 'add tests', 'deploy']);
    expect(state.active).toBe(true);
    expect(state.total_stories).toBe(3);
    expect(state.current_story).toBe(0);
    expect(state.attempt_count).toBe(0);
    expect(prd.goal).toBe('Ship feature X');
    expect(prd.stories).toHaveLength(3);
    expect(prd.stories[0].status).toBe('pending');
  });

  it('respects custom options', () => {
    const ralph = freshRequire();
    const { state } = ralph.activate('goal', ['s1'], { max_iterations: 20, stop_on_blocked: 5 });
    expect(state.max_iterations).toBe(20);
    expect(state.stop_on_blocked).toBe(5);
  });
});

describe('advance', () => {
  it('increments story index and resets attempt count', () => {
    const ralph = freshRequire();
    ralph.activate('goal', ['s1', 's2', 's3']);
    const s = ralph.advance();
    expect(s.current_story).toBe(1);
    expect(s.attempt_count).toBe(0);
  });

  it('completes when all stories done', () => {
    const ralph = freshRequire();
    ralph.activate('goal', ['s1']);
    const s = ralph.advance();
    expect(s.active).toBe(false);
    expect(s.completed_at).toBeDefined();
  });

  it('throws when not active', () => {
    const ralph = freshRequire();
    expect(() => ralph.advance()).toThrow('ralph not active');
  });
});

describe('recordFailure', () => {
  it('increments attempt count', () => {
    const ralph = freshRequire();
    ralph.activate('goal', ['s1'], { stop_on_blocked: 3 });
    const r1 = ralph.recordFailure();
    expect(r1.attempt_count).toBe(1);
    expect(r1.blocked).toBe(false);
  });

  it('returns blocked after threshold', () => {
    const ralph = freshRequire();
    ralph.activate('goal', ['s1'], { stop_on_blocked: 2 });
    ralph.recordFailure();
    const r2 = ralph.recordFailure();
    expect(r2.blocked).toBe(true);
    expect(r2.attempt_count).toBe(2);
  });

  it('throws when not active', () => {
    const ralph = freshRequire();
    expect(() => ralph.recordFailure()).toThrow('ralph not active');
  });
});

describe('deactivate', () => {
  it('sets active to false', () => {
    const ralph = freshRequire();
    ralph.activate('goal', ['s1']);
    ralph.deactivate();
    const s = ralph.readState();
    expect(s.active).toBe(false);
    expect(s.deactivated_at).toBeDefined();
  });

  it('does nothing when not active', () => {
    const ralph = freshRequire();
    // Should not throw
    ralph.deactivate();
  });
});

describe('statusSummary', () => {
  it('returns null when not active', () => {
    const ralph = freshRequire();
    expect(ralph.statusSummary()).toBeNull();
  });

  it('returns formatted status when active', () => {
    const ralph = freshRequire();
    ralph.activate('Ship feature', ['build', 'test']);
    const summary = ralph.statusSummary();
    expect(summary).toContain('Ralph is ACTIVE');
    expect(summary).toContain('story 1/2');
    expect(summary).toContain('build');
    expect(summary).toContain('Ship feature');
  });
});
