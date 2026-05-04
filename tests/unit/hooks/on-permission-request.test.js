/**
 * tests/unit/hooks/on-permission-request.test.js
 * Unit tests for hooks/on-permission-request.js
 */

const { runHook } = require('./helpers');

describe('on-permission-request', () => {
  describe('safe commands ??auto-approve', () => {
    const safeCmds = [
      'git status',
      'git log --oneline -5',
      'git diff HEAD~1',
      'ls -la',
      'cat package.json',
      'echo hello',
      'pwd',
      'which node',
      'npm list',
      'grep -r "TODO" src/',
      'rg pattern',
      'find . -name "*.js"',
      'wc -l src/index.js',
      'head -20 README.md',
      'tail -10 log.txt',
    ];

    for (const cmd of safeCmds) {
      it(`approves: ${cmd}`, () => {
        const { json } = runHook('on-permission-request', { tool_input: { command: cmd } });
        expect(json.action).toBe('approve');
      });
    }
  });

  describe('dangerous commands ??block', () => {
    const blockedCmds = [
      { cmd: 'rm -rf /', reason: 'destructive' },
      { cmd: 'rm -rf ~', reason: 'home directory' },
      { cmd: 'git push origin --force main', reason: 'force push' },
      { cmd: 'git push -f origin master', reason: 'force push' },
      { cmd: 'sudo rm -rf /var', reason: 'sudo rm' },
      { cmd: 'DROP DATABASE production;', reason: 'DROP DATABASE' },
      { cmd: 'TRUNCATE TABLE users;', reason: 'TRUNCATE TABLE' },
      { cmd: 'chmod 777 /', reason: 'chmod 777 root' },
    ];

    for (const { cmd, reason } of blockedCmds) {
      it(`blocks: ${cmd} (${reason})`, () => {
        const { json } = runHook('on-permission-request', { tool_input: { command: cmd } });
        expect(json.action).toBe('block');
        expect(json.message).toBeDefined();
      });
    }
  });

  describe('unknown commands ??continue (ask user)', () => {
    const unknownCmds = ['npm install', 'npx vitest', 'docker build .'];

    for (const cmd of unknownCmds) {
      it(`continues: ${cmd}`, () => {
        const { json } = runHook('on-permission-request', { tool_input: { command: cmd } });
        expect(json.action).toBe('continue');
      });
    }
  });

  it('handles missing tool_input gracefully', () => {
    const { json } = runHook('on-permission-request', {});
    expect(json.action).toBe('continue');
  });

  it('handles empty command', () => {
    const { json } = runHook('on-permission-request', { tool_input: { command: '' } });
    expect(json.action).toBe('continue');
  });
});
