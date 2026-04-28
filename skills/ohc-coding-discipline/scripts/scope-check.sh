#!/bin/bash
# scope-check.sh — validate changed files match current task scope
# Usage: bash skills/ohc-coding-discipline/scripts/scope-check.sh

set -e
NOTEPAD=".ohc/notepad.md"

if [ ! -f "$NOTEPAD" ]; then
  echo "⚠ No .ohc/notepad.md found. Cannot validate scope."
  exit 0
fi

CURRENT_TASK=$(awk '/## Current Task/{found=1; next} found && /^##/{exit} found{print}' \
  "$NOTEPAD" | tr -s ' ' | grep -v '^$' | head -3)

if [ -z "$CURRENT_TASK" ]; then
  echo "⚠ No current task in notepad.md. Skipping scope check."
  exit 0
fi

echo "📋 Current task: $(echo "$CURRENT_TASK" | head -1)"
echo ""
echo "📂 Changed files (staged + unstaged):"

CHANGED=$(git diff --name-only HEAD 2>/dev/null || echo "")
STAGED=$(git diff --name-only --cached 2>/dev/null || echo "")
ALL=$(printf "%s\n%s" "$CHANGED" "$STAGED" | sort -u | grep -v '^$')

if [ -z "$ALL" ]; then
  echo "  (no changes detected)"
  exit 0
fi

echo "$ALL" | while read -r f; do echo "  📄 $f"; done

echo ""
echo "⚠ Review: do ALL changed files relate to the current task?"
echo "  If not, log unrelated files to .ohc/notepad.md under '## Noticed (not in scope)'"
