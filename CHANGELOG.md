# Changelog

All notable changes are documented here.
Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)
Versioning: [Semantic Versioning](https://semver.org/)

---

## [Unreleased]

---

## [0.1.0] — 2025-04-28

### Added

**Platform support (6 platforms)**
- Claude Code — `.claude-plugin/` manifest, CLAUDE.md, hooks, commands
- Cursor — `.cursor/rules/*.mdc`, `.cursor/commands/`, self-learning integration
- Antigravity — `.agent/rules/`, `.agent/skills/`, `.agent/workflows/`
- Codex CLI — `.codex` context file, AGENTS.md symlink, bootstrap INSTALL.md
- Gemini CLI — `GEMINI.md`, `gemini-extension.json`
- OpenCode — `.opencode/plugins/colab.js`

**4-layer memory system**
- `SOUL.md` — agent identity (constant, never changes)
- `USER.md` — developer profile (updated by RETRO)
- `PROJECT.md` — project context (updated by EXPLORE + RETRO)
- `notepad.md` — human-readable, human-editable session state

**9 specialized agents** with fixed model routing (opus/sonnet/haiku)
- planner, executor, reviewer, verifier, debugger, architect, researcher, writer, collaborator

**12 skills** (all ≤200 lines, official Anthropic structure with references/ + scripts/)
- `ohc-coding-discipline` — Karpathy-extended: minimal scope, surgical changes, assumptions, success criteria
- `explore-codebase` — systematic codebase understanding
- `brainstorming` — Socratic design before implementation
- `writing-plans` — task decomposition with ≤2h tasks, confirmation gate
- `test-driven-development` — RED-GREEN-REFACTOR enforcement
- `subagent-driven-development` — parallel dispatch via git worktrees
- `systematic-debugging` — hypothesis-driven root cause analysis
- `requesting-code-review` — two-pass: spec compliance then code quality
- `finishing-a-branch` — pre-merge check, changelog, PR description, cleanup
- `retrospective` — session learning loop (novel — not in OMC or superpowers)
- `context7-aware-coding` — live library docs via Context7 MCP
- `writing-skills` — meta-skill for creating new skills

**6 named workflows** triggered by keywords
- EXPLORE, PLAN, BUILD, REVIEW, SHIP, RETRO
- Chaining: autopilot (PLAN+BUILD+REVIEW), ralph (persistent BUILD)

**11 slash commands**
- setup, explore, plan, build, review, ship, retro, autopilot, team, ask, skill

**4 lifecycle hooks**
- on-session-start, on-pre-tool, on-post-tool, on-stop
- `keyword-map.json` — human-editable trigger map

**ohc CLI**
- `ohc setup` — interactive 6-screen onboarding (arrow keys, Space toggle, masked API key input)
- `ohc team N:provider "task"` — parallel agent spawning via git worktrees + tmux
- `ohc skill list | promote | draft` — skill lifecycle management
- `ohc notify --summary` — Slack / Discord / Telegram
- `ohc cursor-sync` — Cursor Dashboard team rule sync

**MCP auto-setup**
- Installs via `claude mcp add --scope user` (no `.mcp.json` in repo)
- 8 servers: Context7 (optional key), GitHub, Brave Search, Playwright, Firecrawl, Linear, Sentry, Figma
- Context7: free without key (60 req/hr); optional free key at context7.com/dashboard

**HUD status bar**
- 4-line real-time status in Claude Code (workflow, agent, plan progress, MCP, branch, agents)
- Themes: full / standard / minimal

**CI/CD pipeline (5 jobs)**
- Skill line count check (fails if SKILL.md >200 lines)
- Frontmatter validation (skills, agents, commands)
- JSON validation (manifests, keyword-map)
- JS syntax check (all hooks and scripts)
- Shell script lint (shellcheck)

[Unreleased]: https://github.com/iadr-dev/colab/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/iadr-dev/colab/releases/tag/v0.1.0
