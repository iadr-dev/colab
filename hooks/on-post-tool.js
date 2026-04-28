#!/usr/bin/env node
/**
 * on-post-tool.js — Claude Code post-tool-use hook
 * Fires: after every tool call
 * Does:  log result, parse test output, update plan step counter
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const CWD = process.cwd();
const OHC = path.join(CWD, '.ohc');

function read(p) { try { return fs.readFileSync(p, 'utf8'); } catch { return null; } }

let raw = '';
const rl = readline.createInterface({ input: process.stdin });
rl.on('line', l => raw += l);
rl.on('close', () => {
  let event = {};
  try { event = JSON.parse(raw); } catch {}

  const toolName   = event.tool_name || '';
  const toolOutput = event.tool_output || '';
  const sessionId  = read(path.join(OHC, 'state', 'current-session.txt'))?.trim();
  const reminders  = [];

  // Log result
  if (sessionId) {
    const log = path.join(OHC, 'state', 'sessions', sessionId, 'log.jsonl');
    try {
      fs.appendFileSync(log, JSON.stringify({
        type: 'tool_result', tool: toolName,
        output: typeof toolOutput === 'string' ? toolOutput.slice(0, 500) : toolOutput,
        ts: Date.now()
      }) + '\n');
    } catch {}
  }

  // Parse test output
  if (toolName === 'Bash') {
    const cmd = (event.tool_input?.command || '').toLowerCase();
    const isTest = ['vitest','jest','pytest','go test','npm test'].some(t => cmd.includes(t));

    if (isTest && typeof toolOutput === 'string') {
      const failed  = toolOutput.match(/(\d+) failed/)?.[1]  || '0';
      const skipped = toolOutput.match(/(\d+) skipped/)?.[1] || '0';
      const passed  = toolOutput.match(/(\d+) passed/)?.[1]  || '?';

      if (failed !== '0' || skipped !== '0') {
        reminders.push(`<system_reminder test_result="failing">
✓ Passed: ${passed}  ✗ Failed: ${failed}  ⏭ Skipped: ${skipped}
Do NOT claim done. Fix failing/skipped tests first.
</system_reminder>`);
      } else {
        // Update plan step counter
        try {
          const wfPath = path.join(OHC, 'state', 'current-workflow.json');
          const wf = JSON.parse(read(wfPath) || '{}');
          if (wf.step !== undefined) {
            wf.step = Math.min(wf.step + 1, wf.total || wf.step + 1);
            fs.writeFileSync(wfPath, JSON.stringify(wf, null, 2));
          }
        } catch {}
      }
    }

    // Scope check warning
    if (cmd.includes('scope-check') && toolOutput.includes('⚠')) {
      reminders.push(`<system_reminder scope_warning="true">
scope-check.sh detected potential out-of-scope changes.
Review output above. Log unrelated findings to .ohc/notepad.md under "## Noticed (not in scope)".
</system_reminder>`);
    }
  }

  process.stdout.write(JSON.stringify(
    reminders.length > 0
      ? { action: 'continue', system_reminder: reminders.join('\n') }
      : { action: 'continue' }
  ));
});
