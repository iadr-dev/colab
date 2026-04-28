---
name: writing-skills
description: >
  Meta-skill for creating new skills in oh-my-colab format. Use when RETRO
  identifies a pattern worth formalizing. Ensures correct folder structure,
  200-line discipline, proper frontmatter, and token-efficient design.
allowed-tools: Read Write
---

# Writing Skills

Use after RETRO identifies a pattern worth formalizing as a reusable skill.

## Skill Folder Structure
```
skills/{skill-name}/
├── SKILL.md              ← core instructions, ≤200 lines
├── references/           ← detailed docs, loaded on demand
│   └── *.md
├── scripts/              ← executable tools, only output enters context
│   └── *.sh / *.py
└── assets/               ← templates, blank forms
    └── *.md
```

## Required SKILL.md Frontmatter
```yaml
---
name: skill-name              # kebab-case, ≤64 chars, becomes /skill-name
description: >                # ≤200 chars — ONLY thing read before triggering
  When this skill activates. What it produces. Key trigger words or contexts.
  Make this searchable. Be specific about when to use vs not use.
allowed-tools: Read Write Bash  # optional — restrict available tools
---
```

## The 200-Line Rule
SKILL.md must stay under 200 lines. If content exceeds it:
1. Identify the long section (usually examples or detailed reference)
2. Move it to `references/{descriptive-name}.md`
3. Replace with: `See references/{name}.md for [brief description]`

**What stays in SKILL.md**: the protocol (what to do, in what order)
**What goes to references/**: examples, full checklists, edge cases, templates
**What goes to scripts/**: validation, detection, generation logic
**What goes to assets/**: blank templates the user copies

## Writing Good Descriptions
The description is ALL the agent reads before deciding to load this skill.

Bad: "A skill for debugging code."
Good: "Hypothesis-driven debugging. Triggers on debug, error, broken, failing.
Forces explicit hypothesis before fix. Prevents guess-and-check debugging."

## Promoting from Draft
Draft skills go to `.ohc/skills/{name}.md` (single file, informal).
Promoted skills go to `skills/{name}/SKILL.md` (full folder structure).

```bash
ohc skill draft {name}    # scaffold folder + template
ohc skill promote {name}  # move draft to skills/ folder
```

See references/skill-spec.md for the complete Anthropic skill specification.
See references/frontmatter-guide.md for all frontmatter fields.
