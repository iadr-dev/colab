---
description: Run interactive oh-my-colab onboarding: platforms, MCP, HUD, notifications
---

# /setup — Onboarding

Run the interactive setup wizard. Installs oh-my-colab for detected platforms.

If `ohc` CLI available: run `ohc setup` in terminal for the full interactive experience.

Steps:
1. Select platforms (Claude Code, Cursor, Antigravity, Codex, Gemini and Opencode)
2. Select team size (solo / small team / org)
3. Select default workflow
4. Select MCP servers — collect API keys inline for those that need them
   - Context7: works without key (60 req/hr); optional free key at context7.com/dashboard
   - GitHub MCP: needs GITHUB_PERSONAL_ACCESS_TOKEN
   - Brave Search: needs BRAVE_API_KEY
5. Select notification target
6. Select HUD style

Setup writes:
- ~/.claude/settings.json (team mode, env vars, statusLine)
- CLAUDE.md + AGENTS.md symlink
- .cursor/rules/*.mdc + .cursor/commands/
- .agent/rules/ + .agent/skills/ + .agent/workflows/ (if Antigravity)
- .claude/commands/ + .claude/hooks/
- MCP servers via `claude mcp add --scope user`
- .ohc/PROJECT.md, notepad.md, project-memory.json
- ~/.ohc/SOUL.md, USER.md, config.json
- GEMINI.md + gemini-extension.json (if Gemini selected)
- .codex (if Codex selected)
