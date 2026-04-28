# Official Anthropic Skill Spec — Summary

## What a Skill Is
A folder of instructions teaching Claude how to complete a specific task type.
Loaded on demand — only when relevant — token-efficient vs system prompt bloat.

## Folder Structure
```
skills/skill-name/
├── SKILL.md       ← Required. Core instructions.
├── references/    ← Optional. Detailed docs, loaded on demand.
├── scripts/       ← Optional. Executables. Output enters context, NOT source.
├── assets/        ← Optional. Templates, images.
└── LICENSE.txt    ← Optional.
```

## SKILL.md Required Fields
```yaml
---
name: skill-name          # ≤64 chars, kebab-case, becomes slash command
description: >            # ≤200 chars total — the ONLY pre-load text
  Trigger conditions, output type, key context words.
---
```

## Optional Fields
```yaml
allowed-tools: Read Write Edit Bash MultiEdit Glob Grep WebFetch Task
disable-model-invocation: false  # true = tool-only mode, no model calls
version: "1.0.0"
```

## Progressive Disclosure Model
```
Always loaded:     frontmatter description (~200 chars)
Loaded on trigger: SKILL.md body (≤200 lines)
Loaded on demand:  references/*.md files
Never loaded:      scripts/*.sh source code
Output only:       scripts/*.sh stdout (compact results)
```

## Skill Discovery
1. Claude scans skills/*/SKILL.md descriptions
2. Matches description against current task
3. If match: loads full SKILL.md
4. If SKILL.md references a file: loads that file on demand

## Common Mistakes
- Description too vague (doesn't trigger)
- SKILL.md as a reference dump (split to references/)
- Scripts that get read as source (use Bash tool correctly)
- allowed-tools too broad (restrict to what skill actually needs)
