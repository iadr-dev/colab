#!/bin/bash
# pre-merge-check.sh — validate branch is clean before merge
# (no `set -e`: we want to report every failing check, not stop at the first)
ERRORS=0

echo "🔍 Pre-merge check"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# 1. No debug code
echo "Checking for debug code..."
DEBUG_PATTERNS='console\.log\|debugger\|pdb\.set_trace\|binding\.pry\|fmt\.Println\|dbg!\|println!\s*(\s*"'
if git diff main... --name-only 2>/dev/null | xargs grep -l "$DEBUG_PATTERNS" 2>/dev/null; then
  echo "✗ Debug code found in changed files"
  ERRORS=$((ERRORS + 1))
else
  echo "✓ No debug code"
fi

# 2. Tests pass
echo "Running test suite..."
if bash skills/test-driven-development/scripts/verify-tests-pass.sh; then
  echo "✓ Tests passing"
else
  echo "✗ Tests failing"
  ERRORS=$((ERRORS + 1))
fi

# 3. Lint + typecheck for detected language(s)
echo "Running code quality checks..."
if bash skills/test-driven-development/scripts/verify-code-quality.sh; then
  echo "✓ Code quality checks passed"
else
  echo "✗ Code quality checks failed"
  ERRORS=$((ERRORS + 1))
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ $ERRORS -gt 0 ]; then
  echo "❌ Pre-merge FAILED ($ERRORS blocking issues)"
  exit 1
else
  echo "✅ Pre-merge PASSED — ready to merge"
fi
