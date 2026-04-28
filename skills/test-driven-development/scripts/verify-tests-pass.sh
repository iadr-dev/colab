#!/bin/bash
# verify-tests-pass.sh — run test suite, fail if any skip or fail
set -e
EXIT_CODE=0

detect_runner() {
  if [ -f "package.json" ]; then
    grep -q '"vitest"' package.json 2>/dev/null && echo "vitest" && return
    grep -q '"jest"' package.json 2>/dev/null && echo "jest" && return
    echo "npm test"
  elif [ -f "pyproject.toml" ] || [ -f "pytest.ini" ]; then echo "pytest"
  elif [ -f "go.mod" ]; then echo "gotest"
  else echo "unknown"
  fi
}

RUNNER=$(detect_runner)
echo "🧪 Runner: $RUNNER"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

case $RUNNER in
  vitest)
    OUTPUT=$(npx vitest run --reporter=verbose 2>&1) || EXIT_CODE=1
    echo "$OUTPUT"
    PASSED=$(echo "$OUTPUT" | grep -c "✓" || true)
    FAILED=$(echo "$OUTPUT" | grep -cE "✗|FAIL" || true)
    SKIPPED=$(echo "$OUTPUT" | grep -c "skip\|todo" || true)
    ;;
  jest)
    OUTPUT=$(npx jest --verbose 2>&1) || EXIT_CODE=1
    echo "$OUTPUT"
    PASSED=$(echo "$OUTPUT" | grep "Tests:" | grep -o "[0-9]* passed" | grep -o "[0-9]*" || echo "0")
    FAILED=$(echo "$OUTPUT" | grep "Tests:" | grep -o "[0-9]* failed" | grep -o "[0-9]*" || echo "0")
    SKIPPED=$(echo "$OUTPUT" | grep "Tests:" | grep -o "[0-9]* skipped" | grep -o "[0-9]*" || echo "0")
    ;;
  pytest)
    OUTPUT=$(python -m pytest -v 2>&1) || EXIT_CODE=1
    echo "$OUTPUT"
    PASSED=$(echo "$OUTPUT" | grep -o "[0-9]* passed" | grep -o "[0-9]*" || echo "0")
    FAILED=$(echo "$OUTPUT" | grep -o "[0-9]* failed" | grep -o "[0-9]*" || echo "0")
    SKIPPED=$(echo "$OUTPUT" | grep -o "[0-9]* skipped" | grep -o "[0-9]*" || echo "0")
    ;;
  gotest)
    OUTPUT=$(go test ./... -v 2>&1) || EXIT_CODE=1
    echo "$OUTPUT"
    PASSED=$(echo "$OUTPUT" | grep -c "^--- PASS" || echo "0")
    FAILED=$(echo "$OUTPUT" | grep -c "^--- FAIL" || echo "0")
    SKIPPED=$(echo "$OUTPUT" | grep -c "^--- SKIP" || echo "0")
    ;;
  *)
    echo "⚠ Unknown runner. Run tests manually."
    exit 0
    ;;
esac

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✓ Passed:  ${PASSED:-?}"
echo "✗ Failed:  ${FAILED:-?}"
echo "⏭ Skipped: ${SKIPPED:-?}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ "${FAILED:-0}" -gt 0 ] || [ "${SKIPPED:-0}" -gt 0 ]; then
  echo "❌ FAILED — fix failing/skipped tests before claiming done"
  exit 1
else
  echo "✅ PASSED — all tests passing, none skipped"
  exit 0
fi
