---
description: Run interactive oh-my-colab onboarding: platforms, MCP, HUD
---

# /setup — Onboarding

Run the interactive setup wizard. Installs oh-my-colab for detected platforms.

If `ohc` CLI available: run `ohc setup` in terminal for the full interactive experience.

Steps:
1. Select platforms (Claude Code, Cursor, Antigravity, Codex, and Gemini)
2. Select team size (solo / small team / org)
3. Select default workflow
4. Select MCP servers — collect API keys inline for those that need them
   - Context7: works without key (60 req/hr); optional free key at context7.com/dashboard
   - GitHub MCP: needs GITHUB_PERSONAL_ACCESS_TOKEN
   - Brave Search: needs BRAVE_API_KEY
5. Select HUD style (only shown when Claude Code is selected)

Setup writes:
- ~/.claude/settings.json (team mode, env vars, statusLine)
- CLAUDE.md + AGENTS.md (project root)
- .claude/ agents/ + skills/ + commands/ + hooks/ + hooks.json (Claude Code; also used by Cursor for compat)
- .cursor/rules/*.mdc + .cursor/mcp.json (if Cursor)
- .agent/{rules,skills,workflows}/ + ~/.gemini/antigravity/{rules,skills,workflows}/ (if Antigravity)
- GEMINI.md + ~/.gemini/extensions/oh-my-colab/gemini-extension.json (if Gemini)
- ~/.codex/prompts/ + ~/.codex/config.toml (if Codex)
- MCP servers via `claude mcp add --scope user` (if Claude Code)
- .ohc/PROJECT.md, notepad.md, project-memory.json
- ~/.ohc/SOUL.md, USER.md, config.json
