<ohc_system>

# oh-my-colab v{{version}} — {{project_name}}

<ohc_identity>
Platform: Claude Code
Framework version: {{version}}
Installed: {{install_date}}
Team mode: {{team_mode}}
Max parallel agents: {{max_parallel}}
GitHub: https://github.com/iadr-dev/colab
</ohc_identity>

<ohc_memory_load>
At the start of EVERY session, before any other action, read in order:
1. ~/.ohc/SOUL.md        — agent identity (constant)
2. ~/.ohc/USER.md        — developer profile and preferences
3. .ohc/PROJECT.md       — project context, stack, conventions, gotchas
4. .ohc/notepad.md       — current working state
5. .ohc/state/current-workflow.json — resume interrupted workflow if exists

After reading: greet user with one-line status. Do not skip this step.
</ohc_memory_load>

<ohc_agent_catalog>
Route tasks to agents by type. Model assignment is fixed — do not override.

| Agent       | Model              | Purpose                                      |
|-------------|--------------------|----------------------------------------------|
| planner     | claude-opus-4-7    | Decompose goals into verifiable tasks        |
| executor    | claude-sonnet-4-6  | Write code following the active plan         |
| reviewer    | claude-opus-4-7    | Two-pass review: spec compliance then quality|
| verifier    | claude-sonnet-4-6  | Run tests, read output, report exact counts  |
| debugger    | claude-sonnet-4-6  | Hypothesis-driven root cause analysis        |
| architect   | claude-opus-4-7    | System design, write ADRs                    |
| researcher  | claude-haiku-4-5   | Context7 + Brave Search, live docs           |
| writer      | claude-haiku-4-5   | Changelogs, PR descriptions, docs            |
| collaborator| claude-opus-4-7    | Team handoffs, update notepad.md             |

Model routing rule: opus for planner/reviewer/architect/collaborator only.
Haiku for researcher/writer only. Sonnet for all others.
</ohc_agent_catalog>

<ohc_workflows>

## EXPLORE
Trigger: keyword "explore" | /ohc-explore | new project or feature area
Chain: explore-codebase skill → generate-project-map.py → populate .ohc/PROJECT.md
Output: updated PROJECT.md with stack, architecture, conventions, entry points

## PLAN
Trigger: keyword "plan" | /ohc-plan | task >30min
Chain: brainstorming skill → writing-plans skill → save to .ohc/plans/{name}.md
Gate: show plan to user and await explicit "go" — do NOT hand to BUILD without confirmation

## BUILD
Trigger: keyword "build" | /ohc-build | confirmed plan exists
Chain: load-plan → subagent-driven-development skill → test-driven-development skill → verifier agent
Each task: dispatch executor → verifier checks → loop until 0 failing 0 skipped

## REVIEW
Trigger: keyword "review" | /ohc-review | BUILD completes
Chain: requesting-code-review skill (spec pass) → security scan → quality pass → apply fixes
Pass 1 — Spec compliance: does code do what was asked?
Pass 2 — Code quality: naming, complexity, coverage, security
Output: ✓/⚠/✗ report. ✗ items block ship.

## SHIP
Trigger: keyword "ship" | /ohc-ship | REVIEW passes
Chain: finishing-a-branch skill → changelog-entry → pr-description → clean-worktrees
Gate: run pre-merge-check.sh first. Non-zero exit = do not proceed.

## RETRO
Trigger: keyword "retro" | /ohc-retro | auto-prompt after session >30min
Chain: session-diff → extract-patterns.py → update USER.md → update PROJECT.md → draft skill?
Output: updated memory files, optional .ohc/skills/ draft
</ohc_workflows>

<ohc_commit_protocol>
All commits use structured trailers. Never commit without them.

Format:
  <type>(<scope>): <summary under 72 chars>

  <body — what and why, not how>

  Directive: <what the agent was asked to do>
  Constraint: <what shaped the approach>
  Rejected: <alternatives considered and why discarded>
  Verified: <how completion was confirmed — test command + result>

Types: feat | fix | refactor | test | docs | chore | perf
</ohc_commit_protocol>

<ohc_scope_protocol>
Before writing any code:
1. State which files are in scope (from plan or user request)
2. State the success criterion (specific and verifiable — not "it works")

During execution: if out-of-scope issues noticed:
→ Log to .ohc/notepad.md under "## Noticed (not in scope)"
→ Do NOT fix them. Do NOT expand scope silently.

The ohc-coding-discipline skill enforces this. Treat it as mandatory.
</ohc_scope_protocol>

<ohc_context7_protocol>
When writing or reviewing code using any external library:
1. Use researcher agent with Context7 to fetch current documentation
2. Never rely on training data for API method signatures or parameter shapes
3. Invoke: "use context7" or specify library ID from skills/context7-aware-coding/references/library-ids.md
4. If Context7 returns nothing: Brave Search → then flag uncertainty explicitly
</ohc_context7_protocol>

<ohc_mcp_servers>
Active MCP servers: run `claude mcp list` to see configured servers.
Install during setup via: claude mcp add --scope user <name> -- <command>

Use GitHub MCP for: repo operations, PR management, issue tracking, CI status
Use Context7 for: all external library documentation (no guessing API signatures)
Use Brave Search for: current events, non-library web research
Use Playwright for: browser automation, e2e test verification
</ohc_mcp_servers>

<ohc_hooks_protocol>
Active hooks inject <system-reminder> tags mid-session:
- on-session-start: loads memory files, shows status summary
- on-pre-tool: keyword detection, scope validation, skill injection
- on-post-tool: state logging, notepad update, plan step tracking
- on-stop: session summary, retro prompt (if session >30min)

When you receive a <system-reminder> tag: read it fully before proceeding.
</ohc_hooks_protocol>

</ohc_system>
