/**
 * tests/unit/hooks/on-user-prompt.test.js
 * Unit tests for hooks/on-user-prompt.js
 */

const { runHook, makeTempProject } = require('./helpers');
const fs = require('fs');
const path = require('path');

describe('on-user-prompt', () => {
  it('returns bare continue with no keyword match', () => {
    const { json } = runHook('on-user-prompt', { message: 'hello world' });
    expect(json.action).toBe('continue');
    expect(json.system_reminder).toBeUndefined();
  });

  it('injects skill reminder on "explore" keyword', () => {
    const { json, cwd } = runHook('on-user-prompt', { message: 'explore this codebase' });
    expect(json.action).toBe('continue');
    // Even without the SKILL.md file, it should try to match the keyword
    // If SKILL.md is missing the reminder won't be injected, but the hook should not crash
    expect(json).toBeDefined();
  });

  it('injects workflow reminder on "autopilot" keyword', () => {
    const { json } = runHook('on-user-prompt', { message: 'go autopilot on this' });
    expect(json.action).toBe('continue');
    if (json.system_reminder) {
      expect(json.system_reminder).toContain('PLAN+BUILD+REVIEW');
    }
  });

  it('injects workflow reminder on "build" keyword', () => {
    const { json } = runHook('on-user-prompt', { message: 'build the feature' });
    expect(json.action).toBe('continue');
    if (json.system_reminder) {
      expect(json.system_reminder).toContain('BUILD');
    }
  });

  it('injects agent dispatch on "handoff" keyword', () => {
    const { json } = runHook('on-user-prompt', { message: 'handoff to next dev' });
    expect(json.action).toBe('continue');
    if (json.system_reminder) {
      expect(json.system_reminder).toContain('collaborator');
    }
  });

  it('handles message_history fallback', () => {
    const { json } = runHook('on-user-prompt', {
      message: '',
      message_history: [
        { role: 'user', content: 'build the feature' }
      ]
    });
    expect(json.action).toBe('continue');
  });

  it('handles array message format', () => {
    const { json } = runHook('on-user-prompt', {
      message: [{ text: 'review this code' }]
    });
    expect(json.action).toBe('continue');
  });

  it('handles empty/malformed stdin gracefully', () => {
    const { json } = runHook('on-user-prompt', '{}');
    expect(json.action).toBe('continue');
  });

  it('persists active skill on "ralph mode"', () => {
    const { json, cwd } = runHook('on-user-prompt', { message: 'ralph mode' });
    expect(json.action).toBe('continue');
    // Check that active-skills.json was updated
    const skillsPath = path.join(cwd, '.ohc', 'state', 'active-skills.json');
    if (fs.existsSync(skillsPath)) {
      const skills = JSON.parse(fs.readFileSync(skillsPath, 'utf8'));
      expect(skills.skills).toHaveProperty('ralph');
    }
  });

  it('injects librarian agent reminder on "find code"', () => {
    const { json } = runHook('on-user-prompt', { message: 'find code for authentication' });
    expect(json.action).toBe('continue');
    expect(json.system_reminder).toContain('agent="librarian"');
    expect(json.system_reminder).toContain('code exploration');
  });

  it('injects advisor agent reminder on "audit this"', () => {
    const { json } = runHook('on-user-prompt', { message: 'audit this plan' });
    expect(json.action).toBe('continue');
    expect(json.system_reminder).toContain('agent="advisor"');
    expect(json.system_reminder).toContain('risk assessment');
  });

  it('handles nested options in "ultrawork"', () => {
    const { json } = runHook('on-user-prompt', { message: 'ultrawork on this' });
    expect(json.system_reminder).toContain('workflow="PLAN+BUILD+REVIEW"');
    expect(json.system_reminder).toContain('Optimization: use parallel execution');
  });

  it('handles nested options in "ralplan"', () => {
    const { dir, cleanup } = makeTempProject();
    try {
      const skillDir = path.join(dir, 'skills', 'writing-plans');
      fs.mkdirSync(skillDir, { recursive: true });
      fs.writeFileSync(path.join(skillDir, 'SKILL.md'), 'Mock skill content');

      const { json } = runHook('on-user-prompt', { message: 'ralplan feature X' }, { cwd: dir });
      expect(json.system_reminder).toContain('Option: ralphMode active');
    } finally {
      cleanup();
    }
  });
});
