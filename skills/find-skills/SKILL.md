---
name: find-skills
description: Helps users discover and install agent skills. Use this when the user asks "how do I do X", "find a skill for X", or wants to extend agent capabilities.
allowed-tools: [run_command, mcp_firecrawl_firecrawl_search, read_url_content]
---

# find-skills

This skill helps you discover and install skills from the open agent skills ecosystem and our internal registry.

## Phase 1: Understand Requirements

Identify the domain and specific task the user needs help with (e.g., React performance, testing, design).

## Phase 2: Internal Lookup

Check our local registry first to see if we already have a skill for this.

- **Tool**: `view_file` on `hooks/keyword-map.json`
- **Action**: Search for keywords related to the user's request.

## Phase 3: External Discovery

If not found internally, search the wider ecosystem.

1. **Browse**: Check [skills.sh](https://skills.sh/) for top-rated skills.
2. **Search**: Run `npx skills find [query]` to find matching packages.
3. **Verify**: Check install counts and source reputation (prefer `vercel-labs`, `anthropics`, `microsoft`).

## Phase 4: Recommendation

Present options to the user with:

1. Skill name and description.
2. Install count and source.
3. The install command: `npx skills add <package>`.

## Phase 5: Implementation

If the user approves, install the skill:

```bash
npx skills add <owner/repo@skill> -g -y
```

## References

| File                                             | Purpose                         |
| ------------------------------------------------ | ------------------------------- |
| [keyword-map.json](colab/hooks/keyword-map.json) | Internal skill trigger registry |
