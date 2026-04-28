---
name: finishing-a-branch
description: >
  Pre-merge checklist, changelog entry, PR description, and worktree cleanup.
  Ensures no debug code, all tests pass, documentation updated. Triggers on
  keyword "ship" or when SHIP workflow is active.
allowed-tools: Read Write Bash
---

# Finishing a Branch

The final steps before merging. Never skip the pre-merge check.

## Step 1: Pre-merge Check
```bash
bash skills/finishing-a-branch/scripts/pre-merge-check.sh
```
Must exit 0 before proceeding. Fix and re-run if it fails.

## Step 2: Changelog Entry
Add to CHANGELOG.md under [Unreleased]:
```markdown
### Added
- {feature}: {one-line description} — {PR link}
### Fixed
- {bug}: {what was wrong and what was fixed} — {PR link}
```

## Step 3: PR Description
```markdown
## What
{2-3 sentences: what this PR does, not how}

## Why
{1-2 sentences: why this change was needed}

## How to Test
1. {step-by-step test instructions}
Expected: {what success looks like}

## Checklist
- [ ] Tests pass
- [ ] No debug code left
- [ ] Changelog updated
```

## Step 4: Final Test Run
Run full test suite on branch tip. Do not proceed if any test fails or skips.

## Step 5: Clean up Worktrees
```bash
git worktree list | grep ohc/ | awk '{print $1}' | xargs -I{} git worktree remove {}
git branch | grep ohc/ | xargs git branch -d
```
