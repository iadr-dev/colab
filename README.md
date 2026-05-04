# 🧠 oh-my-colab

> **Methodology + orchestration + persistent memory. Every platform.**

Your AI coding agent has the intelligence of a senior engineer. What it lacks is _discipline_, _memory_, and a _team_. oh-my-colab gives it all three.

```
🧠 ohc │ workflow: BUILD │ agent: executor/sonnet │ task: implement auth refresh
📊 plan: 4/7 steps │ notepad: 2 open items
🔀 branch: feat/oauth │ agents: 3 running │ worktrees: 3 │ MCP: context7 github brave-search
```

---

## Why oh-my-colab?

| Problem                                               | Solution                                                                |
| ----------------------------------------------------- | ----------------------------------------------------------------------- |
| Goldfish brain — forgets everything between sessions  | 4-layer memory: SOUL + USER + PROJECT + notepad                         |
| Re-fetches the same library docs every session        | Cross-session research cache (`.ohc/research/`) — lookup before fetch   |
| Jumps to code without planning                        | Enforced PLAN gate for tasks >30 minutes                                |
| "Done" without running tests                          | Verifier agent reads actual output — 0 failing, 0 skipped               |
| Only works with one platform                          | 5 platforms: Claude Code, Cursor, Antigravity, Codex, Gemini            |
| Parallel agents can't coordinate or verify each other | `/ohc-team` five-stage pipeline with `RESULT.json` gate + auto fix loop |
| No learning loop                                      | RETRO extracts skills from every session                                |

---

## Install

### Everything else (Claude, Cursor, Antigravity, Codex CLI, Gemini CLI, plus Claude Code via npm)

```bash
npm install -g @iadr-dev/colab
ohc setup
```

`ohc setup` detects which platforms you want to support and writes the right config for each: `.claude/` (Claude Code; Cursor may reuse it for compatibility), `.cursor/`, project `.agents/` (Antigravity rules/skills/workflows; Codex also loads skills from `.agents/skills/`), project `GEMINI.md` plus user `~/.gemini/settings.json` (Gemini CLI MCP), user `~/.gemini/antigravity/mcp_config.json` when Antigravity is enabled, and user `~/.codex/` (Codex prompts + `config.toml` MCP tables). Optional: seed **`CONTEXT.md`** / **`CONTEXT-MAP.md`** from `templates/` into the repo root as a bounded domain glossary.

### Claude Code plugin (marketplace / git)

Bundled manifests live under **[`.claude-plugin/`](.claude-plugin/)** (metadata only). Ships **`skills/`**, **`agents/`**, plugin hooks (**[`hooks/plugin-hooks.json`](hooks/plugin-hooks.json)** with **`${CLAUDE_PLUGIN_ROOT}`** per [plugins reference](https://docs.claude.com/en/docs/claude-code/plugins-reference)), and Claude slash definitions as **`commands/ohc-*.md`** (Workflows section lists them). **`ohc setup`** copies the verbose **[`hooks/hooks.json`](hooks/hooks.json)** into `.claude/hooks/` when you onboard a project workspace (and mirrors commands into `.claude/commands/`).

Develop from this repo for claude code:

```bash
/plugin marketplace add ./.claude-plugin/marketplace.json
/plugin install oh-my-colab --scope project
```

Or from local directory installed once:
Use **`npm i -g @iadr-dev/colab && ohc setup`** when you want the full multi-platform scaffold (recommended together with or after the Claude plugin).

---

## How it works

Every session starts by reading **global + project memory** — always, in this order:

```
~/.ohc/SOUL.md     → who the agent is (constant)
~/.ohc/USER.md     → who you are (your preferences, stack, style)
.ohc/PROJECT.md    → what this project is (stack, conventions, gotchas)
.ohc/notepad.md    → what's in progress right now (human-editable)
```

Paths are created by **`ohc setup`** (`PROJECT.md` / `notepad.md` under `.ohc/` in the repo; `SOUL.md` / `USER.md` under `~/.ohc/` by default).

**You can edit `.ohc/notepad.md` directly between sessions.** Write for your future self or teammate. The agent picks up exactly where you left off.

### 12-hook event system

oh-my-colab intercepts **12 Claude Code lifecycle events** (`SessionStart`, `UserPromptSubmit`, `PreToolUse`, `PostToolUse`, `PostToolUseFailure`, `SubagentStart`, `SubagentStop`, `PreCompact`, `PostCompact`, `Stop`, `SessionEnd`, `PermissionRequest`). Each hook runs a Node.js handler under **`hooks/`** that can inject `<system_reminder>` context, persist state, and enforce workflows. Plugin installs use **`hooks/plugin-hooks.json`** (with `${CLAUDE_PLUGIN_ROOT}` paths); `ohc setup` copies **`hooks/hooks.json`** (verbose format) into `.claude/`.

---

## Workflows — keyword-triggered

Core six:

| Keyword        | Workflow    | What happens                                                                                                                       |
| -------------- | ----------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `"explore"`    | **EXPLORE** | Reads codebase, populates `.ohc/PROJECT.md`                                                                                        |
| `"deepsearch"` | **EXPLORE** | Targeted deep search — grep patterns, trace data flows, map dependencies for a specific concept (deep mode of explore)             |
| `"plan this"`  | **PLAN**    | Interview → approaches → task list → confirms before building (`"design this"` routes here too — see **`hooks/keyword-map.json`**) |
| `"build"`      | **BUILD**   | Loads plan → subagents → TDD → verifier (`"implement"` synonyms in keyword map)                                                    |
| `"review"`     | **REVIEW**  | Spec compliance + code quality report                                                                                              |
| `"ship it"`    | **SHIP**    | Pre-merge check → changelog → PR → clean                                                                                           |
| `"retro"`      | **RETRO**   | Session diff → patterns → update memory files                                                                                      |

Meta-workflows:

| Keyword        | Workflow      | What happens                                                                                                  |
| -------------- | ------------- | ------------------------------------------------------------------------------------------------------------- |
| `"autopilot"`  | **AUTOPILOT** | PLAN + BUILD + REVIEW chained, pauses at plan for OK (`"full auto"` skips that gate)                          |
| `"ultrawork"`  | **ULTRAWORK** | PLAN + BUILD + REVIEW chained in parallel mode for maximum throughput                                         |
| `"ralph"`      | **RALPH**     | BUILD with persistence until tests pass (or max iters); **`/ohc-ralph`** maps in **`hooks/keyword-map.json`** |
| `"ralplan"`    | **PLAN**      | PLAN with persistence and iterative refinement                                                                |
| `"ultrathink"` | **THINK**     | Extended brainstorming with deep reasoning and rigorous clarification rubrics                                 |
| `"stopomc"`    | **STOP**      | Deactivates all persistent modes (bulk mode off, `"stop all"` also works)                                     |

Keyword routing is authoritative; edits go in **`hooks/keyword-map.json`** (picked up by **`hooks/on-user-prompt.js`**).

### Claude Code plugin — slash commands

Plugin Markdown lives under **`commands/ohc-*.md`** (shown in Claude Code as **`/ohc-…`**):

`/ohc-setup` · `/ohc-explore` · `/ohc-plan` · `/ohc-build` · `/ohc-review` · `/ohc-ship` · `/ohc-retro` · `/ohc-autopilot` · `/ohc-team` · `/ohc-research` · `/ohc-skill` · `/ohc-caveman` · `/ohc-ralph` · `/ohc-document-intake`

Each workflow row above aligns with keywords; these slashes are explicit equivalents (plus **`/ohc-setup`** onboarding and **`/ohc-document-intake`** for external specs).

---

## Eleven agents

Definitions live in **`agents/*.md`** (eleven files). Routed on Claude Code with the models below:

| Agent        | Model  | Role                                         |
| ------------ | ------ | -------------------------------------------- |
| planner      | opus   | Requirements, design, task decomposition     |
| executor     | sonnet | Code writing, plan implementation            |
| reviewer     | opus   | Code review, spec compliance, security       |
| verifier     | sonnet | Test execution — reads actual output         |
| debugger     | sonnet | Hypothesis-driven root cause                 |
| architect    | opus   | System design, ADRs                          |
| researcher   | haiku  | Context7 docs, Brave Search                  |
| writer       | haiku  | Changelogs, PR descriptions                  |
| collaborator | opus   | Team handoffs, notepad updates               |
| librarian    | opus   | Context efficiency, large file summarization |
| advisor      | opus   | Proactive risk assessment, gap analysis      |

The `Model` column is the Claude Code subagent model routing and applies only on Claude Code. On other platforms the agent `.md` files are rule/role references — the host platform decides which model runs. **`hooks/keyword-map.json`** also maps **"handoff"** / **"picking up"** phrases to the **collaborator** agent.

---

## Parallel team support — five-stage pipeline

```bash
# Claude Code — native team mode (Task() dispatch)
/ohc-team 3:executor "implement the 3 tasks in .ohc/plans/auth-feature.md"

# CLI — tmux workers
ohc team 2:codex "security review of src/auth"
ohc team 4:gemini "redesign dashboard components"
ohc team 3:claude "write tests for utils/ modules"
```

Every team runs an internal pipeline, gated by evidence:

```
team-plan → team-prd → team-exec → team-verify → team-fix ⤺ → team-merge → done
```

- Each worker gets its own git worktree under `.ohc/team/<id>/worktrees/<name>/` on an `ohc/<id>-<name>` branch. The shared research cache (`.ohc/research/`) is symlinked into every worktree so workers never re-fetch docs another worker already cached.
- Every worker must write `RESULT.json` (`status`, `tests`, `files_changed`, `artifacts`, `notes`) plus per-worker `notes.md`. The orchestrator **refuses** to advance past `team-exec` until every worker has written `RESULT.json` — no "pretend it's done".
- If `team-verify` finds failures, `ohc team advance` auto-dispatches fix workers back into the **same** worktrees. Capped at 3 fix attempts; then it hands off to a human at `team-merge`.
- `ohc team merge <id>` runs `git merge --no-ff` per worker branch, stopping on conflict so you can resolve manually.
- Dirty worktrees block `ohc team shutdown` without `--force`. Nothing gets discarded silently.

State lives under `.ohc/state/team/<id>/` and is inspectable via `ohc team status <id>`.

### Team CLI

```bash
ohc team N:provider "task"            # Spawn team (starts at team-exec)
ohc team status <id>                  # Stage, RESULT.json counts, failing workers
ohc team advance <id>                 # Drive pipeline one step (auto-dispatches fix workers)
ohc team poll <id>                    # Check tmux worker exit sentinels (codex/gemini)
ohc team merge <id>                   # Merge worker branches back; stops on first conflict
ohc team shutdown <id> [--force]      # Remove worktrees
ohc team list                         # List all active teams
```

---

## Skills — enforced, not suggested

"Trigger" is how the skill gets loaded: keyword phrases are matched by `hooks/on-user-prompt.js` against `hooks/keyword-map.json`; "referenced" skills are loaded by another skill or workflow.

| Skill                           | Trigger                                                                                                     | Enforces                                                                                    |
| ------------------------------- | ----------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| **ohc-coding-discipline**       | **`CLAUDE.md` / Cursor rules norms** + keywords **`"discipline"`**, **`"scope check"`**                     | Minimal scope, surgical changes, explicit assumptions, verifiable success criteria          |
| **explore-codebase**            | `"explore"`, `"explore codebase"`, `"understand"`, `"deepsearch"`, `"deep search"`                          | Reading order, `.ohc/PROJECT.md` population; **deep mode**: targeted pattern/flow search    |
| **brainstorming**               | referenced by writing-plans                                                                                 | Socratic questioning; `references/product-brief-template.md` for greenfield framing         |
| **writing-plans**               | `"plan this"`; substring **`plan `**; **`write a plan`**                                                    | ≤2h tasks, confirmation gate before BUILD                                                   |
| **autopilot**                   | `"autopilot"`, `"auto pilot"`, `"full auto"`; **`/ohc-autopilot`**                                          | PLAN → BUILD → REVIEW chain (**`full auto`** skips plan gate in keyword map)                |
| **document-intake**             | `"from my docs"`, `"existing spec"`, `"external spec"`, **`"document intake"`**, **`/ohc-document-intake`** | Respect third-party PRD/RFC layouts; emit `.ohc/doc-sources.md` + traced `.ohc/plans/`      |
| **test-driven-development**     | `"tdd"`, `"test first"`                                                                                     | RED-GREEN-REFACTOR, 0 failing 0 skipped                                                     |
| **subagent-driven-development** | referenced by BUILD workflow                                                                                | Git worktrees, dispatch protocol                                                            |
| **systematic-debugging**        | `"debug"`, `"broken"`, `"not working"`, **`"why is"`**                                                      | Hypothesis before fix                                                                       |
| **requesting-code-review**      | `"review"`, `"code review"`, **`"check this"`**                                                             | Two-pass: spec then quality                                                                 |
| **finishing-a-branch**          | `"ship"`, `"ship it"`, **`"finish branch"`**                                                                | Pre-merge check, changelog, PR, cleanup + optional **`references/production-checklist.md`** |
| **retrospective**               | `"retro"`, `"retrospective"`                                                                                | Session diff, pattern extraction, memory update                                             |
| **context7-aware-coding**       | referenced when using libs                                                                                  | Live docs via Context7 — cache-first via `.ohc/research/`, no guessing                      |
| **writing-skills**              | reference doc (meta)                                                                                        | Skill authoring guide and structure                                                         |
| **ralph**                       | `"ralph"`, `"keep going"`, `"ralph mode"`, **`/ohc-ralph`**                                                 | Persistent BUILD until tests pass                                                           |
| **caveman**                     | **`"stop caveman"`** / **`"normal mode"`** (exit); **`"caveman mode"`**, **`"compressed mode"`** (enter)    | Persistent compressed responses with technical accuracy                                     |

The repo ships **16** skills under **`skills/*/SKILL.md`**. Canonical keyword list: **`hooks/keyword-map.json`**.

Each skill: `SKILL.md` (≤200 lines) + `references/` (on demand) + `scripts/` (output only).

---

## MCP servers

| Server           | Purpose                       | Key                                                             |
| ---------------- | ----------------------------- | --------------------------------------------------------------- |
| **Context7**     | Live library docs             | Optional (free at context7.com/dashboard)                       |
| **GitHub MCP**   | Repos, PRs, issues, CI        | `GITHUB_PERSONAL_ACCESS_TOKEN`                                  |
| **Brave Search** | Web search                    | `BRAVE_API_KEY`                                                 |
| **Playwright**   | Browser automation, e2e       | No                                                              |
| **Firecrawl**    | Web scraping                  | `FIRECRAWL_API_KEY`                                             |
| **Linear**       | Remote MCP (`mcp.linear.app`) | No secret in default `ohc setup` (`scripts/setup/index.js`)     |
| **Sentry**       | Hosted MCP (`mcp.sentry.dev`) | No secret in default setup (add auth if your org requires it)   |
| **Figma**        | Hosted MCP (`mcp.figma.com`)  | No secret in default setup (add tokens if your org requires it) |

Interactive **`ohc setup`** only prompts for env vars where **`scripts/setup/index.js`** marks **`needsKey: true`** for your selection (Context7 remains optional).

---

## Research cache (cross-session, anti-goldfish)

Every Context7 / Brave / GitHub doc fetch is persisted to `.ohc/research/` so future sessions don't re-fetch the same thing. The researcher agent runs **cache-first** — `lookup()` before any external call. At session start, `on-session-start.js` injects an `<ohc_research_index>` reminder listing cached entries so the agent knows upfront what's already answered. The executor/verifier can stamp `verified_working: true` + the commit SHA onto an entry, giving the reviewer a research audit trail.

```bash
ohc research list                     # List cached entries (freshness, library, topic)
ohc research show <lib> <topic>       # Print one entry
ohc research search "<query>"         # Substring search across the cache
ohc research verify <lib> <topic> [commit]  # Mark an entry as verified-working
ohc research prune [--older-than N]   # Remove expired / >N-day entries
ohc research clear                    # Nuke the cache
```

Default TTL is 30 days. `on-session-end.js` auto-prunes stale entries. In `/ohc-team` mode, the cache directory is symlinked into every worker worktree so the whole team shares one source of truth.

---

## ohc CLI

```bash
ohc setup                          # Interactive onboarding (+ optional CONTEXT templates)
ohc doctor                         # Health: .ohc, hooks JSON, MCP env hints, semver (colab devs)
ohc team N:provider "task"         # Spawn a team — see "Parallel team support" above
ohc research list | show | search  # Cross-session research cache
ohc skill list                     # List installed + draft skills
ohc skill promote <name>           # Promote draft to project skill
ohc skill draft <name>             # Scaffold a new skill
ohc version                        # Show version
ohc help                           # All commands
```

---

## Philosophy

oh-my-colab enforces:

- **Plan before build** — no code for tasks >30min without an approved plan
- **Minimal scope** — no speculative features, no gold-plating
- **Verify before done** — verifier reads actual test output, not just "tests pass"
- **Learn after done** — every session teaches the system something via RETRO

These are not suggestions. The hooks, skills, and workflow gates enforce them.

---

## Contributing

Before contributing a skill: read `skills/writing-skills/SKILL.md`. Claude Code slash sources live in **`commands/ohc-*.md`**; keep **`name`** in YAML frontmatter in sync with the filename stem.

- `SKILL.md` must be ≤200 lines (CI blocks if not)
- Move detailed content to `references/`
- Move executable tools to `scripts/`
- Test on Claude Code + at least one other platform
- **`npm test`** runs a Node subset on Windows; full bash smoke (symlink worktree): `npm run test:shell` (Git Bash / WSL / Linux/macOS)

---

## License

MIT © [iadr-dev/colab contributors](https://github.com/iadr-dev/colab)

---
