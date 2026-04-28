# 🧠 oh-my-colab

> **Methodology + orchestration + persistent memory. Every platform.**

Your AI coding agent has the intelligence of a senior engineer. What it lacks is _discipline_, _memory_, and a _team_. oh-my-colab gives it all three.

```
🧠 ohc │ workflow: BUILD │ agent: executor/sonnet │ task: implement auth refresh
📊 plan: 4/7 steps │ notepad: 2 open items
🔀 branch: feat/oauth │ agents: 3 running │ worktrees: 3 │ MCP: context7 github brave-search
⚡ notifications: slack ✓
```

---

## Why oh-my-colab?

| Problem                                              | Solution                                                               |
| ---------------------------------------------------- | ---------------------------------------------------------------------- |
| Goldfish brain — forgets everything between sessions | 4-layer memory: SOUL + USER + PROJECT + notepad                        |
| Jumps to code without planning                       | Enforced PLAN gate for tasks >30 minutes                               |
| "Done" without running tests                         | Verifier agent reads actual output — 0 failing, 0 skipped              |
| Only works with one platform                         | 6 platforms: Claude Code, Cursor, Antigravity, Codex, Gemini, OpenCode |
| No team workflows                                    | Parallel N-agent support via git worktrees                             |
| No learning loop                                     | RETRO extracts skills from every session                               |

---

## Install

### Claude Code (recommended)

```
/plugin marketplace add iadr-dev/colab
/plugin install @iadr-dev/colab
/setup
```

### npm CLI

```bash
npm install -g @iadr-dev/colab
ohc setup
```

### Cursor

Tell your Cursor agent:

```
Fetch and follow https://raw.githubusercontent.com/iadr-dev/colab/main/.opencode/INSTALL.md
```

### Antigravity

Tell your Antigravity agent:

```
Fetch and follow https://raw.githubusercontent.com/iadr-dev/colab/main/.opencode/INSTALL.md
```

### Codex CLI

```
Fetch and follow https://raw.githubusercontent.com/iadr-dev/colab/main/.codex-bootstrap/INSTALL.md
```

### Gemini CLI

```bash
gemini extensions install https://github.com/iadr-dev/colab
```

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

## Six workflows — keyword-triggered

| Keyword       | Workflow    | What happens                                                  |
| ------------- | ----------- | ------------------------------------------------------------- |
| `"explore"`   | **EXPLORE** | Reads codebase, populates `PROJECT.md`                        |
| `"plan this"` | **PLAN**    | Interview → approaches → task list → confirms before building |
| `"build"`     | **BUILD**   | Loads plan → subagents → TDD → verifier                       |
| `"review"`    | **REVIEW**  | Spec compliance + code quality report                         |
| `"ship it"`   | **SHIP**    | Pre-merge check → changelog → PR → clean                      |
| `"retro"`     | **RETRO**   | Session diff → patterns → update memory files                 |

```
autopilot  → PLAN + BUILD + REVIEW (pauses at plan for your OK)
ralph      → BUILD with persistence until tests pass
```

---

## Nine agents — automatic model routing

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

---

## Parallel team support

```bash
# Claude Code — native team mode
/team 3:executor "implement the 3 tasks in .ohc/plans/auth-feature.md"

# CLI — tmux workers
ohc team 2:codex "security review of src/auth"
ohc team 4:gemini "redesign dashboard components"
ohc team 3:claude "write tests for utils/ modules"
```

Each worker gets its own git worktree. No file conflicts. Results merged and verified.

---

## Skills — enforced, not suggested

| Skill                           | Triggers              | Enforces                                                                           |
| ------------------------------- | --------------------- | ---------------------------------------------------------------------------------- |
| **ohc-coding-discipline**       | Always                | Minimal scope, surgical changes, explicit assumptions, verifiable success criteria |
| **explore-codebase**            | `"explore"`           | Reading order, PROJECT.md population                                               |
| **brainstorming**               | Before PLAN           | Socratic questioning, 2-3 approaches                                               |
| **writing-plans**               | `"plan this"`         | ≤2h tasks, confirmation gate before BUILD                                          |
| **test-driven-development**     | BUILD active          | RED-GREEN-REFACTOR, 0 failing 0 skipped                                            |
| **subagent-driven-development** | Multi-task plans      | Git worktrees, dispatch protocol                                                   |
| **systematic-debugging**        | `"debug"`, `"broken"` | Hypothesis before fix                                                              |
| **requesting-code-review**      | `"review"`            | Two-pass: spec then quality                                                        |
| **finishing-a-branch**          | `"ship"`              | Pre-merge check, changelog, PR, cleanup                                            |
| **retrospective**               | `"retro"`             | Session diff, pattern extraction, memory update                                    |
| **context7-aware-coding**       | Library usage         | Live docs via Context7 — no guessing                                               |
| **writing-skills**              | Meta                  | Skill authoring guide and structure                                                |

Each skill: `SKILL.md` (≤200 lines) + `references/` (on demand) + `scripts/` (output only).

---

## MCP servers

Configured automatically during `ohc setup` via `claude mcp add`.

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

## Interactive setup

```
╔══════════════════════════════════════════╗
║  oh-my-colab setup (4/6)                ║
║  MCP servers (Space to toggle)          ║
╠══════════════════════════════════════════╣
║  ▶ [✓] Context7  — live docs (optional key) ║
║    [✓] GitHub MCP — repos/PRs/CI       ║
║    [✓] Brave Search — web search       ║
║    [ ] Playwright — browser/e2e        ║
╚══════════════════════════════════════════╝
  GitHub MCP selected. Enter your token:
  > ghp_*********************
```

6 screens. Arrow keys + Space + Enter. API keys collected inline, installed via `claude mcp add`.

---

## Platform support matrix

| Feature         |    Claude Code    |      Cursor       |    Antigravity    |   Codex   |  Gemini   |
| --------------- | :---------------: | :---------------: | :---------------: | :-------: | :-------: |
| System context  |     CLAUDE.md     |     AGENTS.md     |     AGENTS.md     | AGENTS.md | GEMINI.md |
| Rules / skills  |      skills/      |  .cursor/rules/   |   .agent/rules/   |     —     |     —     |
| Commands        | .claude/commands/ | .cursor/commands/ | .agent/workflows/ |     —     |     —     |
| Hooks           |  .claude/hooks/   |         —         |         —         |     —     |     —     |
| HUD             |         ✓         |         —         |         —         |     —     |     —     |
| Parallel agents |     ✓ native      |     ✓ native      |     ✓ native      |   tmux    |   tmux    |
| MCP install     |  claude mcp add   |         —         |         —         |     —     |     —     |
| Context7        |         ✓         |         ✓         |         ✓         |     ✓     |     ✓     |

---

## ohc CLI

```bash
ohc setup                          # Interactive 6-screen onboarding
ohc team N:provider "task"         # Spawn N parallel agents
ohc skill list                     # List installed + draft skills
ohc skill promote <name>           # Promote draft to project skill
ohc skill draft <name>             # Scaffold a new skill
ohc notify --summary               # Send session summary notification
ohc cursor-sync                    # Push rules to Cursor Dashboard
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
