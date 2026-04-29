/**
 * scripts/team/native.js — Claude Code native team worker dispatcher
 *
 * For claude/executor providers: emits a list of Task() specs
 * that the parent Claude Code agent can execute via the Task tool.
 *
 * This replaces the old "print a hint" approach with actual
 * structured Task() dispatch instructions.
 */

/**
 * Build Task() spec list for N claude/executor workers.
 * The parent agent receives these and dispatches them via Task tool.
 *
 * @param {string} teamId
 * @param {string} provider — 'claude' | 'executor'
 * @param {Array}  workers  — [{ name, worktree, task }]
 * @returns { taskSpecs: Array<{subagent_type, description, prompt, ...}> }
 */
function buildTaskSpecs(teamId, provider, workers) {
  const subagent_type = provider === 'executor' ? 'executor' : 'generalPurpose';

  const taskSpecs = workers.map(({ name, worktree, task }, i) => ({
    subagent_type,
    description: `${provider} worker ${i + 1}: ${task.slice(0, 60)}`,
    prompt: [
      `You are worker ${name} (${i + 1}/${workers.length}) in team ${teamId}.`,
      `Working directory: ${worktree}`,
      `Task: ${task}`,
      '',
      'Contract — every worker MUST do all of the following before exit:',
      '1. cd into the working directory before any file operations.',
      '2. Follow the plan in .ohc/plans/ if one exists.',
      `3. Write per-worker notes to .ohc/state/team/${teamId}/workers/${name}/notes.md`,
      `   (NOT .ohc/notepad.md — that shared file causes write races).`,
      `   Format:`,
      `     ## ${name} — {ISO timestamp}`,
      `     - what you built / tests you ran / issues you found / handoff notes`,
      `4. Write .ohc/state/team/${teamId}/workers/${name}/RESULT.json with shape:`,
      `     {`,
      `       "status": "success" | "blocked" | "failed",`,
      `       "tests":  {"passed": N, "failed": N, "skipped": N} | null,`,
      `       "files_changed": ["src/foo.ts", ...],`,
      `       "artifacts": [".ohc/plans/x.md", ...],`,
      `       "notes":   "one-line summary",`,
      `       "completedAt": "{ISO timestamp}"`,
      `     }`,
      `   The orchestrator refuses to advance to team-verify without this file.`,
      `5. Research cache is shared — lookup via \`node -e "require('./scripts/research').lookup(...)"\`.`,
      `   Do not re-fetch docs that another worker already cached this session.`,
      `6. Exit cleanly — do not wait for other workers. The orchestrator joins results.`,
    ].join('\n'),
    worktree,
    teamId,
    workerName: name,
  }));

  return { taskSpecs };
}

/**
 * Format Task() spec list as a human-readable prompt injection.
 * Returns a system_reminder string that tells Claude to dispatch these tasks.
 */
function formatDispatchInstruction(taskSpecs) {
  if (!taskSpecs.length) return '';
  const specJson = JSON.stringify(taskSpecs, null, 2);
  return `<system_reminder team_dispatch="true">
Dispatch the following ${taskSpecs.length} Task() specs in parallel using the Task tool.
Each spec is one independent worker. Do NOT run them sequentially.

${specJson}

After all workers complete:
1. Confirm every worker wrote RESULT.json under .ohc/state/team/<id>/workers/<name>/
2. Run \`ohc team advance <teamId>\` to move team-exec → team-verify.
   (The orchestrator refuses to advance if any worker is missing RESULT.json.)
3. If verify shows failures, \`ohc team advance\` again auto-enters team-fix.
4. When stage reaches team-merge, run \`ohc team merge <teamId>\` to merge branches.
</system_reminder>`;
}

/**
 * Build fix-pass Task() specs for workers that failed verify.
 *
 * Reuses the SAME worktree + branch as the original worker, so the fix
 * continues that worker's work rather than starting over. Prompt includes
 * the RESULT.json summary so the fix worker knows exactly what to repair.
 *
 * @param {string} teamId
 * @param {string} provider
 * @param {Array}  failingWorkers - [{ name, worktree, branch, prior_result }]
 * @param {number} attempt        - fix attempt number (1..MAX_FIX_RETRIES)
 * @returns { taskSpecs }
 */
function buildFixTaskSpecs(teamId, provider, failingWorkers, attempt = 1) {
  const subagent_type = provider === 'executor' ? 'executor' : 'generalPurpose';

  const taskSpecs = failingWorkers.map(({ name, worktree, branch, prior_result }, i) => {
    const priorSummary = prior_result
      ? JSON.stringify({
          status: prior_result.status,
          tests: prior_result.tests,
          notes: prior_result.notes,
          files_changed: prior_result.files_changed,
        }, null, 2)
      : '(no prior RESULT.json — worker did not complete)';

    return {
      subagent_type,
      description: `fix-${attempt} ${name}: repair failing work`,
      prompt: [
        `You are fix worker ${name} (attempt ${attempt}/3) in team ${teamId}.`,
        `Working directory: ${worktree}   (continue the SAME branch: ${branch || '?'})`,
        '',
        'Your predecessor in this worktree failed verification. Prior result:',
        '```json',
        priorSummary,
        '```',
        '',
        'Fix contract — you MUST:',
        '1. cd into the working directory — do NOT start over in a clean tree.',
        '2. Read the prior notes: .ohc/state/team/' + teamId + '/workers/' + name + '/notes.md',
        '3. Diagnose why tests failed or status was blocked/failed. Fix root cause,',
        '   not symptoms. If the same failure repeats from the previous attempt,',
        '   escalate by marking status="blocked" with a clear reason in notes.',
        '4. Re-run the relevant tests and capture real counts.',
        '5. Append a FIX section to notes.md (do not overwrite):',
        `     ## ${name} — fix attempt ${attempt} — {ISO timestamp}`,
        '     - what was broken / how you fixed it / what tests now pass',
        `6. OVERWRITE RESULT.json at .ohc/state/team/${teamId}/workers/${name}/RESULT.json`,
        '   with the new status + fresh test counts. Orchestrator re-enters verify',
        '   based on this file.',
        '7. Exit cleanly — do not wait for other fix workers.',
      ].join('\n'),
      worktree,
      teamId,
      workerName: name,
      isFixPass: true,
      attempt,
    };
  });

  return { taskSpecs };
}

/**
 * Format a fix-dispatch injection that tells the parent to dispatch these
 * fix workers in parallel, then call `ohc team advance` again.
 */
function formatFixDispatchInstruction(taskSpecs, teamId, attempt) {
  if (!taskSpecs.length) return '';
  const specJson = JSON.stringify(taskSpecs, null, 2);
  return `<system_reminder team_fix_dispatch="true" attempt="${attempt}">
Team ${teamId}: verify failed. Dispatching ${taskSpecs.length} fix worker(s) in parallel (attempt ${attempt}/3).
Each fix worker continues the SAME worktree/branch as its predecessor.

${specJson}

After all fix workers exit:
1. Confirm every fix worker OVERWROTE its RESULT.json with fresh status + test counts.
2. Run \`ohc team advance ${teamId}\` — orchestrator will re-enter team-verify.
3. If verify still shows failures, advance again to dispatch the next fix attempt.
4. After 3 failed attempts, orchestrator gives up and advances to team-merge
   so a human can intervene.
</system_reminder>`;
}

module.exports = {
  buildTaskSpecs, formatDispatchInstruction,
  buildFixTaskSpecs, formatFixDispatchInstruction,
};
