#!/usr/bin/env node
/**
 * on-post-tool-failure.js — Claude Code PostToolUse hook (failure matcher)
 * Fires: after a Bash tool call exits with non-zero code
 * Does:
 *   - Inject auto-debug prompt so the agent doesn't just retry blindly
 *   - Log failure to session log (used by retro extract-patterns)
 *   - Track repeated failure patterns; append to PROJECT.md ## Known Gotchas
 */

const fs   = require('fs');
const path = require('path');
const readline = require('readline');
const memory = require('../scripts/memory');

const CWD = process.cwd();
const OHC = path.join(CWD, '.ohc');

function read(p) { try { return fs.readFileSync(p, 'utf8'); } catch { return null; } }

let raw = '';
const rl = readline.createInterface({ input: process.stdin });
rl.on('line', l => raw += l);
rl.on('close', () => {
  let event = {};
  try { event = JSON.parse(raw); } catch {}

  const toolName   = event.tool_name   || '';
  const toolInput  = event.tool_input  || {};
  const toolOutput = event.tool_output || '';
  const exitCode   = event.exit_code   ?? event.tool_response?.exit_code ?? 1;
  const sessionId  = read(path.join(OHC, 'state', 'current-session.txt'))?.trim();

  if (toolName !== 'Bash' || exitCode === 0) {
    process.stdout.write(JSON.stringify({ action: 'continue' }));
    return;
  }

  const cmd    = (toolInput.command || '').slice(0, 200);
  const output = (typeof toolOutput === 'string' ? toolOutput : JSON.stringify(toolOutput)).slice(0, 600);

  // Log failure
  if (sessionId) {
    const log = path.join(OHC, 'state', 'sessions', sessionId, 'log.jsonl');
    try {
      fs.appendFileSync(log, JSON.stringify({
        type: 'tool_failure', tool: toolName,
        command: cmd, exitCode,
        output: output.slice(0, 300),
        ts: Date.now()
      }) + '\n');
    } catch {}
  }

  // Track repeated failures — if this exact command base failed before this session,
  // append a gotcha entry to PROJECT.md so future sessions see the pattern
  if (sessionId) {
    const logContent = read(path.join(OHC, 'state', 'sessions', sessionId, 'log.jsonl')) || '';
    const prevFailures = logContent.split('\n').filter(Boolean)
      .map(l => { try { return JSON.parse(l); } catch { return null; } })
      .filter(e => e?.type === 'tool_failure' && e.command?.startsWith(cmd.slice(0, 40)));
    if (prevFailures.length >= 2) {
      // Same command has failed multiple times — worth persisting as a gotcha
      try {
        memory.appendToProjectGotchas(
          `Command \`${cmd.slice(0, 80)}\` failed ${prevFailures.length + 1} times (exit ${exitCode}). ` +
          `Check: ${output.slice(0, 150)}`
        );
      } catch {}
    }
  }

  const reminder = `<system_reminder tool_failure="bash" exit_code="${exitCode}">
Bash command failed (exit ${exitCode}).
Command: ${cmd}
Output tail:
${output.slice(-400)}

Before retrying:
1. Read the full error message above — what exactly failed?
2. Hypothesize root cause: configuration? missing dep? wrong path? permissions?
3. Fix the root cause. Do NOT retry the identical command without a change.
4. If this is a dependency issue, check package.json / pyproject.toml first.
</system_reminder>`;

  process.stdout.write(JSON.stringify({
    action: 'continue',
    system_reminder: reminder
  }));
});
