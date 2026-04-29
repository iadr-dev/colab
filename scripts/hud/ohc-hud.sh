#!/bin/bash
# ohc-hud.sh — oh-my-colab status bar for Claude Code
# Installed to ~/.ohc/hud/ohc-hud.sh by ohc setup
# Claude Code runs this every 2 seconds via statusLine setting

OHC_HUD_STYLE="full"   # full | standard | minimal — overwritten by ohc setup
OHC_DIR=".ohc"
S="│"

# ── Data ────────────────────────────────────────────────────────────────────
rf() { cat "$1" 2>/dev/null || echo ""; }

# Workflow + agent + task
WF="idle"; AGENT="—"; PLAN_STEP="—"; TASK="(none)"
WF_FILE="$OHC_DIR/state/current-workflow.json"
if [ -f "$WF_FILE" ] && command -v python3 &>/dev/null; then
  WF=$(python3 -c "import json; d=json.load(open('$WF_FILE')); print(d.get('name','idle'))" 2>/dev/null || echo "idle")
  AGENT=$(python3 -c "import json; d=json.load(open('$WF_FILE')); print(d.get('agent','—'))" 2>/dev/null || echo "—")
  PLAN_STEP=$(python3 -c "import json; d=json.load(open('$WF_FILE')); print(f\"{d.get('step',0)}/{d.get('total',0)}\")" 2>/dev/null || echo "—")
fi

NOTEPAD="$OHC_DIR/notepad.md"
if [ -f "$NOTEPAD" ]; then
  TASK=$(awk '/## Current Task/{f=1;next} f&&/^##/{exit} f&&NF{print;exit}' "$NOTEPAD" 2>/dev/null | cut -c1-38)
  TASK="${TASK:-(none)}"
fi

# Git
BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "—")

# Parallel agents + worktrees
AGENT_COUNT=$(find "$OHC_DIR/state/" -maxdepth 1 -name "parallel-*" 2>/dev/null | wc -l | tr -d ' ')
WORKTREE_COUNT=$(git worktree list 2>/dev/null | grep -c "ohc/" || echo "0")

# MCP servers (from claude mcp list output)
MCP_NAMES="—"
if command -v claude &>/dev/null; then
  MCP_NAMES=$(claude mcp list 2>/dev/null | awk 'NR>1{print $1}' | head -3 | tr '\n' ' ' | sed 's/ $//' || echo "—")
fi
[ -z "$MCP_NAMES" ] && MCP_NAMES="—"

# Notepad open items
NOTEPAD_ITEMS="0"
[ -f "$NOTEPAD" ] && NOTEPAD_ITEMS=$(grep -c "^- \[ \]" "$NOTEPAD" 2>/dev/null || echo "0")

# ── Render ───────────────────────────────────────────────────────────────────
case "$OHC_HUD_STYLE" in
  minimal)
    echo "🧠 ohc $S $WF $S $BRANCH $S $TASK"
    ;;
  standard)
    echo "🧠 ohc $S workflow: $WF $S agent: $AGENT $S task: $TASK"
    echo "🔀 branch: $BRANCH $S agents: $AGENT_COUNT $S MCP: $MCP_NAMES"
    ;;
  full|*)
    echo "🧠 ohc $S workflow: $WF $S agent: $AGENT $S task: $TASK"
    echo "📊 plan: $PLAN_STEP steps $S notepad: $NOTEPAD_ITEMS open items"
    echo "🔀 branch: $BRANCH $S agents: $AGENT_COUNT running $S worktrees: $WORKTREE_COUNT $S MCP: $MCP_NAMES"
    ;;
esac
