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

| Problem                                              | Solution                                                               |
| ---------------------------------------------------- | ---------------------------------------------------------------------- |
| Goldfish brain — forgets everything between sessions | 4-layer memory: SOUL + USER + PROJECT + notepad                        |
| Re-fetches the same library docs every session       | Cross-session research cache (`.ohc/research/`) — lookup before fetch  |
| Jumps to code without planning                       | Enforced PLAN gate for tasks >30 minutes                               |
| "Done" without running tests                         | Verifier agent reads actual output — 0 failing, 0 skipped              |
| Only works with one platform                         | 5 platforms: Claude Code, Cursor, Antigravity, Codex, Gemini           |
| Parallel agents can't coordinate or verify each other | `/team` five-stage pipeline with `RESULT.json` gate + auto fix loop   |
| No learning loop                                     | RETRO extracts skills from every session                               |

---

## Install

### Claude Code (plugin)

```
/plugin marketplace add iadr-dev/colab
/plugin install @iadr-dev/colab
/setup
```

### Everything else (Cursor, Antigravity, Codex CLI, Gemini CLI, plus Claude Code via npm)

```bash
npm install -g @iadr-dev/colab
ohc setup
```

`ohc setup` detects which platforms you want to support and writes the right config for each: `.claude/`, `.cursor/`, `.agent/`, `~/.codex/`, and `~/.gemini/extensions/oh-my-colab/`.

---

## How it works

Every session starts by reading four files — always, in this order:

```
SOUL.md     → who the agent is (constant)
USER.md     → who you are (your preferences, stack, style)
PROJECT.md  → what this project is (stack, conventions, gotchas)
notepad.md  → what's in progress right now (human-editable)
```

**You can edit `notepad.md` directly between sessions.** Write for your future self or teammate. The agent picks up exactly where you left off.

---

## Workflows — keyword-triggered

Core six:

| Keyword       | Workflow    | What happens                                                  |
| ------------- | ----------- | ------------------------------------------------------------- |
| `"explore"`   | **EXPLORE** | Reads codebase, populates `PROJECT.md`                        |
| `"plan this"` | **PLAN**    | Interview → approaches → task list → confirms before building |
| `"build"`     | **BUILD**   | Loads plan → subagents → TDD → verifier                       |
| `"review"`    | **REVIEW**  | Spec compliance + code quality report                         |
| `"ship it"`   | **SHIP**    | Pre-merge check → changelog → PR → clean                      |
| `"retro"`     | **RETRO**   | Session diff → patterns → update memory files                 |

Meta-workflows:

| Keyword       | Workflow      | What happens                                            |
| ------------- | ------------- | ------------------------------------------------------- |
| `"autopilot"` | **AUTOPILOT** | PLAN + BUILD + REVIEW chained, pauses at plan for OK    |
| `"ralph"`     | **RALPH**     | BUILD with persistence until tests pass (or max iters)  |

Each workflow has a matching slash command (`/explore`, `/plan`, `/build`, …) for explicit invocation. Additional utility commands: `/team` (parallel pipeline), `/research` (cross-session doc cache), `/skill` (list/promote/draft), `/caveman` (compressed mode), `/ralph` (persistent build).

---

## Nine agents

| Agent        | Model  | Role                                     |
| ------------ | ------ | ---------------------------------------- |
| planner      | opus   | Requirements, design, task decomposition |
| executor     | sonnet | Code writing, plan implementation        |
| reviewer     | opus   | Code review, spec compliance, security   |
| verifier     | sonnet | Test execution — reads actual output     |
| debugger     | sonnet | Hypothesis-driven root cause             |
| architect    | opus   | System design, ADRs                      |
| researcher   | haiku  | Context7 docs, Brave Search              |
| writer       | haiku  | Changelogs, PR descriptions              |
| collaborator | sonnet | Team handoffs, notepad updates           |

The `Model` column is the Claude Code subagent model routing and applies only on Claude Code. On other platforms the agent `.md` files are rule/role references — the host platform decides which model runs.

---

## Parallel team support — five-stage pipeline

```bash
# Claude Code — native team mode (Task() dispatch)
/team 3:executor "implement the 3 tasks in .ohc/plans/auth-feature.md"

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

| Skill                           | Trigger                      | Enforces                                                                           |
| ------------------------------- | ---------------------------- | ---------------------------------------------------------------------------------- |
| **ohc-coding-discipline**       | always loaded                | Minimal scope, surgical changes, explicit assumptions, verifiable success criteria |
| **explore-codebase**            | `"explore"`, `"understand"`  | Reading order, PROJECT.md population                                               |
| **brainstorming**               | referenced by writing-plans  | Socratic questioning, 2-3 approaches                                               |
| **writing-plans**               | `"plan this"`, `"plan"`      | ≤2h tasks, confirmation gate before BUILD                                          |
| **test-driven-development**     | `"tdd"`, `"test first"`      | RED-GREEN-REFACTOR, 0 failing 0 skipped                                            |
| **subagent-driven-development** | referenced by BUILD workflow | Git worktrees, dispatch protocol                                                   |
| **systematic-debugging**        | `"debug"`, `"broken"`, `"not working"` | Hypothesis before fix                                                    |
| **requesting-code-review**      | `"review"`, `"code review"`  | Two-pass: spec then quality                                                        |
| **finishing-a-branch**          | `"ship"`, `"ship it"`        | Pre-merge check, changelog, PR, cleanup                                            |
| **retrospective**               | `"retro"`, `"retrospective"` | Session diff, pattern extraction, memory update                                    |
| **context7-aware-coding**       | referenced when using libs   | Live docs via Context7 — cache-first via `.ohc/research/`, no guessing             |
| **writing-skills**              | reference doc (meta)         | Skill authoring guide and structure                                                |
| **ralph**                       | `"ralph"`, `"keep going"`, `/ralph` | Persistent BUILD until tests pass                                           |
| **caveman**                     | `"caveman mode"`, `"compressed mode"` | Persistent compressed responses with technical accuracy                   |

Each skill: `SKILL.md` (≤200 lines) + `references/` (on demand) + `scripts/` (output only).

---

## MCP servers

| Server           | Purpose                 | Key                                       |
| ---------------- | ----------------------- | ----------------------------------------- |
| **Context7**     | Live library docs       | Optional (free at context7.com/dashboard) |
| **GitHub MCP**   | Repos, PRs, issues, CI  | `GITHUB_PERSONAL_ACCESS_TOKEN`            |
| **Brave Search** | Web search              | `BRAVE_API_KEY`                           |
| **Playwright**   | Browser automation, e2e | No                                        |
| **Firecrawl**    | Web scraping            | `FIRECRAWL_API_KEY`                       |
| **Linear**       | Project management      | `LINEAR_API_KEY`                          |
| **Sentry**       | Error monitoring        | `SENTRY_AUTH_TOKEN`                       |
| **Figma**        | Design context          | `FIGMA_API_KEY`                           |

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

Default TTL is 30 days. `on-session-end.js` auto-prunes stale entries. In `/team` mode, the cache directory is symlinked into every worker worktree so the whole team shares one source of truth.

---

## ohc CLI

```bash
ohc setup                          # Interactive 5-screen onboarding
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

Before contributing a skill: read `skills/writing-skills/SKILL.md`.

- `SKILL.md` must be ≤200 lines (CI blocks if not)
- Move detailed content to `references/`
- Move executable tools to `scripts/`
- Test on Claude Code + at least one other platform

---

## License

MIT © [iadr-dev/colab contributors](https://github.com/iadr-dev/colab)

---
