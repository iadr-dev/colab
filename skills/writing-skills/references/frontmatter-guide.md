# Skill Frontmatter — All Fields

```yaml
---
# REQUIRED
name: my-skill-name
  # Becomes slash command: /my-skill-name
  # Max 64 chars, kebab-case, must be unique across installed skills

description: >
  Short description of when and why to use this skill.
  # Max 200 characters total
  # ONLY text read before deciding to load the skill
  # Include: when to use, what it produces, key trigger words

# OPTIONAL
allowed-tools: Read Write Bash Edit MultiEdit Glob Grep WebFetch Task
  # Restricts which tools the agent can use while skill is active
  # Omit to allow all tools (default)

disable-model-invocation: false
  # true = tool-only mode (no model calls during execution)
  # Useful for pure validation scripts
  # Default: false

version: "1.0.0"
  # Semantic version — good practice for shared/team skills
---
```

## allowed-tools Values
| Tool | What it does |
|------|-------------|
| Read | Read files from filesystem |
| Write | Write/create files |
| Edit | Edit existing files |
| Bash | Execute shell commands |
| MultiEdit | Edit multiple locations in a file |
| Glob | Pattern-match file paths |
| Grep | Search file contents |
| WebFetch | Fetch web URLs |
| Task | Spawn subagent tasks |
