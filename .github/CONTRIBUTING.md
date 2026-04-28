# Contributing to oh-my-colab

## What we accept

### ✓ Welcomed
- Bug fixes for any component
- New skills (follow guidelines below)
- New platform support
- CLI improvements
- Hook system improvements
- Documentation fixes

### ✗ Not accepted without prior discussion
- Skills that duplicate existing skills
- Skills that work on only one platform without documented reason
- Changes to core methodology pipeline
- Changes that break the 200-line SKILL.md discipline

---

## Skill contribution guidelines

Read `skills/writing-skills/SKILL.md` before authoring a skill.

### Required structure
```
skills/your-skill-name/
├── SKILL.md           ← ≤200 lines, valid frontmatter
├── references/        ← detailed docs
├── scripts/           ← executable validation/generation tools
└── assets/            ← blank templates
```

### SKILL.md frontmatter
```yaml
---
name: your-skill-name
description: >
  When to use. What it produces. Key trigger words. (200 chars max)
allowed-tools: Read Write Bash
---
```

### The 200-line rule
CI will fail your PR if SKILL.md exceeds 200 lines. Move detailed content to `references/`.

### Platform testing
Test on at least Claude Code + one other (Cursor or Antigravity preferred).

---

## Development setup

```bash
git clone https://github.com/iadr-dev/colab
cd colab
npm install
npm test         # run smoke tests
npm run lint:skills  # check SKILL.md line counts
```

---

## Commit format

```
<type>(<scope>): <summary under 72 chars>

<body — what and why>

Directive: what was asked
Constraint: what shaped the approach
Rejected: alternatives considered and why
Verified: how completion was confirmed
```

Types: `feat` | `fix` | `refactor` | `test` | `docs` | `chore`

---

## PR process

1. Fork and create a branch: `feat/skill-name` or `fix/description`
2. Make changes
3. Run `npm test` — all checks must pass
4. Open PR using the template
5. Maintainer review within 72 hours
