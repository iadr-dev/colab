# Changelog

All notable changes are documented here.
Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)
Versioning: [Semantic Versioning](https://semver.org/)

---

## [Unreleased]

---

## [0.4.8] — 2026-05-02

### Fixed

- **`ohc setup` MCP step**: Per-platform detection so multi-platform runs no longer label a server as fully present when it only exists on a subset of selected tools (picker shows where each MCP is configured; defaults favor servers still missing somewhere).
- **`claude mcp add`**: Skips only when the server already exists under **Claude Code**, not when present only under Cursor/Codex/Gemini/Antigravity.

### Changed

- **CONTEXT glossary step**: Options show whether `CONTEXT.md` / `CONTEXT-MAP.md` already exist so “skip existing” behavior is visible before confirming.

---

## [0.4.7] — 2026-05-02

### Added

- **document-intake** skill and **`/ohc-document-intake`** command; Sources + Traceability in plan templates (`writing-plans`)
- **`CONTEXT.md`** / **`CONTEXT-MAP.md`** templates and optional **`ohc setup`** seeding
- **`ohc doctor`** (`scripts/doctor.js`) for workspace health hints
- **`hooks/plugin-hooks.json`** plus **`hooks/resolve-paths.js`** (`CLAUDE_PLUGIN_ROOT` fallback)
- **`finishing-a-branch/references/production-checklist.md`**
- Cross-platform **`npm test`** via **`tests/smoke/run-smoke.js`** (Windows Node subset; bash remains **`npm run test:shell`**)

### Changed

- Claude Code slash commands renamed to **`/ohc-*`** with sources under **`commands/ohc-*.md`**; YAML **`name`** matches stem (**`hooks/keyword-map.json`**: **`/ohc-ralph`** etc.)
- **README**, **templates** (`CLAUDE`, `SOUL`, Cursor rules, Antigravity), and hooks copy reference **`hooks/keyword-map.json`**, MCP **`needsKey`** behavior, and full slash list

### Removed

- Redundant mirrored workflow stubs under **`skills/`** (`build`, `explore`, `plan`, …) in favor of plugin commands plus methodology skills

---

## [0.4.6] — 2026-04-30

### Changed

- Claude marketplace manifest: **`autoUpdate`** enabled for plugin installs; listing semver **0.4.6**

---

## [0.4.5] — 2026-04-30

### Added

- Workflow-aligned skills (`explore`, `plan`, `build`, `review`, `ship`, `retro`, `autopilot`, `team`, `research`, `setup`, `skill`) packaged beside existing methodology skills for Claude slash-command routing

### Changed

- Claude plugin manifest loads bundled workflow definitions via **`skills`** path instead of inline command lists
- Marketplace and package semver aligned to **0.4.5**

---

## [0.4.4] — 2026-04-30

### Changed

- Claude plugin manifest (`plugin.json`): plugin id `oh-my-colab`, author/homepage/license/keywords; marketplace listing uses matching plugin id with local `./` source for installs from this repo

---

## [0.4.3] — 2026-04-30

### Changed

- Claude marketplace plugin `source` set to the public GitHub repository URL (replacing local `./`).

---

## [0.4.2] — 2026-04-30

### Changed

- Claude marketplace manifest (`marketplace.json`): display name `oh-my-colab`, local `./` plugin source, consolidated version fields for marketplace tooling

---

## [0.4.1] — 2026-04-29

### Changed

- README — Claude plugin marketplace URL, Antigravity `.agents/` wording in setup overview, skill table formatting
- Claude plugin marketplace metadata (`marketplace.json`)
- `ohc setup` — Antigravity-related install paths and wizard flow refinements
- Interactive setup helpers (`interactive-picker`, `masked-input`)

### Fixed

- Platform request issue template label consistency

---

## [0.4.0] — 2026-04-29

### Added

- Claude Code `hooks.json` registry plus lifecycle hooks (permission requests, compact boundaries, session end, subagent start/stop, user prompt)
- Modular `scripts/team/` implementation (tmux, worktree, native orchestration) replacing the single-file team runner
- CLI helpers: `memory.js`, `ralph.js`, `research.js`, `research-cli.js`
- Slash commands for `caveman`, `ralph`, and `research`
- Skills for `caveman` and `ralph`; expanded reference docs (domain docs, architecture vocabulary, feedback loops, behavior-first testing)
- Smoke tests under `tests/smoke`
- Templates `MEMORY.template.json` and `SELF-EVAL.template.md`

### Changed

- Agent prompts refreshed across `agents/*.md`
- `ohc setup` emits Claude Code `statusLine` as a `{ type, command, refreshInterval }` object (compatible with current Claude Code settings validation)
- HUD script, keyword map, and hook script behavior updates
- README and GitHub security policy copy

### Removed

- `commands/ask.md`
- `scripts/cursor-sync.js` and `scripts/notify.js`; team orchestration consolidated under `scripts/team/`

---

## [0.3.1] — 2026-04-28

### Fixed

- **Version check exit code** — `scripts/version.js` now properly exits with code 1 when version inconsistencies are detected, allowing pre-commit hooks to correctly block inconsistent commits
- **Gradle package manager detection** — `project-scanner.js` now correctly identifies Gradle projects using Groovy DSL (`build.gradle`) in addition to Kotlin DSL (`build.gradle.kts`)

---

## [0.3.0] — 2026-04-28

### Added

- **Centralized version management system** — new `scripts/version.js` with npm scripts for consistent version control across package.json, plugin configs, and setup scripts
- **Pre-commit hooks** — automated version consistency checks to prevent inconsistent commits
- **Automated git tagging** — `npm run version:tag` creates and pushes release tags
- **Context7 library coverage expansion** — mobile ecosystem (Android/Kotlin with Hilt, Room, Retrofit; iOS/Swift with Core Data, Alamofire), AI/LLM SDKs, infrastructure tools
- **Organized library reference** — split large library-ids.md into focused category files for better navigation
- **Research mode documentation** — enhanced Context7 usage with fallback strategies

### Changed

- **Library ID organization** — reorganized into frontend, backend, mobile, AI/LLM, infrastructure, and testing categories
- **Context7 skill structure** — updated to reference category-specific library ID files
- **Version management workflow** — VERSION.md documentation with commands and examples

### Technical

- **NPM scripts** — version:check, version:fix, version:set, version:bump (patch/minor/major), version:tag, version:current
- **Template file handling** — supports multiple regex patterns for version references in JavaScript templates
- **Mobile development coverage** — Android (Kotlin, Jetpack Compose, Hilt, Navigation, Material Design), iOS (Swift, SwiftUI, Core Data, Alamofire)

---

## [0.2.1] — 2026-04-28

### Fixed

- **CI/CD publish flow** — added `publishConfig` and GitHub Action scope mapping to resolve 404 errors during scoped package publication

---

## [0.2.0] — 2026-04-28

### Added

- **OpenCode platform support** — `ohc setup` now generates `.opencode/` directory structure (`agents/`, `commands/`, `skills/`, `tools/`) and `opencode.json` with MCP servers auto-injected
- **Mobile library IDs** — `context7-aware-coding` reference sheet expanded with React Native, Expo, React Navigation, NativeWind, Reanimated, Flutter, Kotlin Coroutines, Jetpack Compose, Ktor, and SwiftUI/Swift entries
- **Monorepo, runtime & database detection** — `explore-codebase` skill generator now detects Turborepo, Nx, pnpm workspaces, Lerna, Deno, Bun, Prisma, Drizzle, Alembic, Flutter, Kotlin/Android, and Swift/iOS stacks
- **Mobile exploration guidance** — `SKILL.md` reading rounds updated with mobile manifests (`pubspec.yaml`, `build.gradle`, `Package.swift`, `AndroidManifest.xml`, `Info.plist`) and mobile test patterns (`flutter test`, XCTest)

### Changed

- **Dynamic platform config generation** — static `.codex` and `gemini-extension.json` files removed from the repository; all platform-specific files are now generated by `ohc setup` at onboarding time
- **`AGENTS.md` routing fixed** — `AGENTS.md` is now generated for any platform that requires it (Claude Code, Codex CLI, OpenCode); was previously tied only to Claude Code
- **`genClaude` → `genAgents`** — setup function refactored to correctly conditionalise `CLAUDE.md` vs `AGENTS.md` based on selected platforms
- **`gemini-extension.json` generated with MCP servers** — Gemini CLI setup now injects selected MCP servers directly into the extension manifest
- **`writeCodex` now fully dynamic** — `.codex` context file is generated at setup time from a template rather than copied from a static file
- **README install instructions unified** — all platforms (Cursor, Antigravity, Gemini CLI, OpenCode) now use the standard `npm install -g @iadr-dev/colab && ohc setup` flow
- **CI JSON validation updated** — removed `gemini-extension.json` from static validation since it is now generated dynamically

### Removed

- Static `.codex` file from repository root (generated at setup time)
- Static `gemini-extension.json` from repository root (generated at setup time)
- Static `.opencode/` directory from repository root (generated at setup time)

---

## [0.1.0] — 2025-04-28

### Added

**Platform support (6 platforms)**
- Claude Code — `.claude-plugin/` manifest, CLAUDE.md, hooks, commands
- Cursor — `.cursor/rules/*.mdc`, `.cursor/commands/`, self-learning integration
- Antigravity — `.agents/rules/`, `.agents/skills/`, `.agents/workflows/`
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

[Unreleased]: https://github.com/iadr-dev/colab/compare/v0.4.8...HEAD
[0.4.8]: https://github.com/iadr-dev/colab/compare/v0.4.7...v0.4.8
[0.4.7]: https://github.com/iadr-dev/colab/compare/v0.4.6...v0.4.7
[0.4.6]: https://github.com/iadr-dev/colab/compare/v0.4.5...v0.4.6
[0.4.5]: https://github.com/iadr-dev/colab/compare/v0.4.4...v0.4.5
[0.4.4]: https://github.com/iadr-dev/colab/compare/v0.4.3...v0.4.4
[0.4.3]: https://github.com/iadr-dev/colab/compare/v0.4.2...v0.4.3
[0.4.2]: https://github.com/iadr-dev/colab/compare/v0.4.1...v0.4.2
[0.4.1]: https://github.com/iadr-dev/colab/compare/v0.4.0...v0.4.1
[0.4.0]: https://github.com/iadr-dev/colab/compare/v0.3.1...v0.4.0
[0.3.1]: https://github.com/iadr-dev/colab/compare/v0.3.0...v0.3.1
[0.3.0]: https://github.com/iadr-dev/colab/compare/v0.2.1...v0.3.0
[0.2.1]: https://github.com/iadr-dev/colab/compare/v0.2.0...v0.2.1
[0.2.0]: https://github.com/iadr-dev/colab/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/iadr-dev/colab/releases/tag/v0.1.0
