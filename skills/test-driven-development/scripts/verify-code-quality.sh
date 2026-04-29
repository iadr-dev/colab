#!/bin/bash
# verify-code-quality.sh — run typecheck + lint for the detected language(s)
#
# Behavior:
#   - Auto-detects language from fingerprint files (package.json, go.mod, etc.)
#   - Runs each tool only if it's installed (which / npx --no-install)
#   - Missing tool = skipped (not a failure); present tool with errors = failure
#   - Exits 0 if all present tools pass, 1 if any fails
#
# Output format matches verify-tests-pass.sh so the verifier agent can parse it.

set -u

TOTAL_CHECKS=0
PASSED=0
FAILED=0
SKIPPED=0
FAILED_NAMES=()

run_check() {
  local name="$1"; shift
  TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
  local tmp
  tmp=$(mktemp)
  if "$@" >"$tmp" 2>&1; then
    echo "  ✓ $name"
    PASSED=$((PASSED + 1))
  else
    echo "  ✗ $name"
    sed 's/^/      /' "$tmp" | head -20
    FAILED=$((FAILED + 1))
    FAILED_NAMES+=("$name")
  fi
  rm -f "$tmp"
}

skip_check() {
  TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
  SKIPPED=$((SKIPPED + 1))
  echo "  ⏭ $1 (not installed)"
}

have() { command -v "$1" >/dev/null 2>&1; }
# Check if a package is resolvable via npx without triggering install
have_npx_pkg() {
  [ -f "package.json" ] || return 1
  # Prefer local node_modules/.bin entry; else check devDependencies
  local bin_name="$1" dep_name="${2:-$1}"
  [ -x "node_modules/.bin/$bin_name" ] && return 0
  grep -q "\"$dep_name\"" package.json 2>/dev/null
}

echo "🔎 Code quality checks"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# ── TypeScript / JavaScript ─────────────────────────────────────────────────
if [ -f "tsconfig.json" ]; then
  if have_npx_pkg tsc typescript; then
    run_check "tsc --noEmit (typecheck)" npx --no-install tsc --noEmit
  else
    skip_check "tsc (typecheck)"
  fi
fi

if [ -f "package.json" ]; then
  if have_npx_pkg biome @biomejs/biome; then
    run_check "biome check (lint+format)" npx --no-install biome check .
  elif have_npx_pkg eslint; then
    run_check "eslint" npx --no-install eslint .
  else
    skip_check "js/ts linter (no eslint/biome in devDependencies)"
  fi
fi

# ── Python ──────────────────────────────────────────────────────────────────
if [ -f "pyproject.toml" ] || [ -f "requirements.txt" ] || [ -f "setup.py" ]; then
  if have ruff; then
    run_check "ruff check" ruff check .
  elif have flake8; then
    run_check "flake8" flake8 .
  fi

  if have pyright; then
    run_check "pyright (typecheck)" pyright
  elif have mypy; then
    run_check "mypy (typecheck)" mypy .
  fi
fi

# ── Go ──────────────────────────────────────────────────────────────────────
if [ -f "go.mod" ]; then
  if have go; then
    run_check "go vet" go vet ./...
    if have golangci-lint; then
      run_check "golangci-lint" golangci-lint run
    fi
  fi
fi

# ── Rust ────────────────────────────────────────────────────────────────────
if [ -f "Cargo.toml" ]; then
  if have cargo; then
    run_check "cargo check" cargo check --quiet --all-targets
    run_check "cargo clippy" cargo clippy --quiet -- -D warnings
  fi
fi

# ── Dart / Flutter ──────────────────────────────────────────────────────────
if [ -f "pubspec.yaml" ]; then
  if have flutter; then
    run_check "flutter analyze" flutter analyze
  elif have dart; then
    run_check "dart analyze" dart analyze
  fi
fi

# ── Swift ───────────────────────────────────────────────────────────────────
if [ -f "Package.swift" ]; then
  if have swift; then
    run_check "swift build (typecheck)" swift build --build-tests
    if have swiftlint; then
      run_check "swiftlint" swiftlint --strict
    fi
  fi
fi

# ── Kotlin / Android ────────────────────────────────────────────────────────
# Intentionally not auto-running ./gradlew detekt — too slow for tight loops.
# Users can add it explicitly to their pre-merge.

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Checks: $TOTAL_CHECKS (✓ $PASSED  ✗ $FAILED  ⏭ $SKIPPED)"

if [ "$TOTAL_CHECKS" -eq 0 ]; then
  echo "  ⚠ No language detected — nothing to check."
  exit 0
fi

if [ "$FAILED" -gt 0 ]; then
  echo ""
  echo "  Failed checks:"
  for f in "${FAILED_NAMES[@]}"; do echo "    ✗ $f"; done
  echo "❌ FAILED — fix lint/typecheck issues before claiming done"
  exit 1
fi

if [ "$PASSED" -eq 0 ]; then
  echo "  ℹ All quality tools skipped (not installed) — consider installing them."
  exit 0
fi

echo "✅ PASSED — all present quality checks clean"
exit 0
