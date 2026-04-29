#!/usr/bin/env node
/**
 * on-permission-request.js — Claude Code PermissionRequest hook (Bash matcher)
 * Fires: when Claude Code asks for permission to run a Bash command
 * Does:
 *   - Auto-approve safe read-only commands (git status, ls, cat, etc.)
 *   - Block dangerous commands (rm -rf /, git push --force to main, etc.)
 *   - Pass through everything else for normal permission handling
 *
 * Input (stdin): { tool_name, tool_input: { command }, session_id }
 * Output (stdout):
 *   { action: "approve" }   — auto-approve, skip user prompt
 *   { action: "block", message: "reason" } — block with explanation
 *   { action: "continue" }  — normal permission flow (ask user)
 */

const readline = require('readline');

const SAFE_PATTERNS = [
  /^git\s+(status|log|diff|show|branch|remote|fetch|stash list)/,
  /^ls(\s|$)/,
  /^cat\s/,
  /^echo\s/,
  /^pwd$/,
  /^which\s/,
  /^node\s+--version/,
  /^npm\s+(list|ls|outdated|audit)\b/,
  /^npx\s+--version/,
  /^(node|python|python3)\s+.*\.(js|py)\s*(<\s*\S+)?$/,
  /^grep\s/,
  /^rg\s/,
  /^find\s/,
  /^wc\s/,
  /^head\s/,
  /^tail\s/,
  /^diff\s/,
];

const BLOCKED_PATTERNS = [
  { re: /rm\s+-rf\s+\//, reason: 'rm -rf / is destructive and irreversible' },
  { re: /rm\s+-rf\s+~/, reason: 'rm -rf ~ would delete home directory' },
  { re: /git\s+push\s+.*--force.*\s+(main|master)/, reason: 'force push to main/master is forbidden' },
  { re: /git\s+push\s+[^-]*-f\s.*(main|master)/, reason: 'force push to main/master is forbidden' },
  { re: />\s*\/dev\/sda/, reason: 'direct write to block device is forbidden' },
  { re: /chmod\s+777\s+\//, reason: 'chmod 777 on root path is forbidden' },
  { re: /sudo\s+rm\s+-rf/, reason: 'sudo rm -rf is forbidden' },
  { re: /DROP\s+DATABASE/i, reason: 'DROP DATABASE requires manual approval' },
  { re: /truncate\s+table\s/i, reason: 'TRUNCATE TABLE requires manual approval' },
];

let raw = '';
const rl = readline.createInterface({ input: process.stdin });
rl.on('line', l => raw += l);
rl.on('close', () => {
  let event = {};
  try { event = JSON.parse(raw); } catch {}

  const cmd = (event.tool_input?.command || '').trim();

  // Check dangerous patterns first
  for (const { re, reason } of BLOCKED_PATTERNS) {
    if (re.test(cmd)) {
      process.stdout.write(JSON.stringify({
        action: 'block',
        message: `oh-my-colab safety block: ${reason}\nCommand: ${cmd.slice(0, 200)}`
      }));
      return;
    }
  }

  // Auto-approve safe read-only patterns
  for (const re of SAFE_PATTERNS) {
    if (re.test(cmd)) {
      process.stdout.write(JSON.stringify({ action: 'approve' }));
      return;
    }
  }

  // Everything else → normal permission flow (user decides)
  process.stdout.write(JSON.stringify({ action: 'continue' }));
});
