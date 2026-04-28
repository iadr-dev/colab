#!/usr/bin/env python3
"""
extract-patterns.py — summarize session log for retro
Usage: python3 skills/retrospective/scripts/extract-patterns.py
"""
import json, os
from pathlib import Path

sessions_dir = Path('.ohc/state/sessions')
if not sessions_dir.exists():
    print("No sessions found. Run a workflow first.")
    raise SystemExit(0)

sessions = sorted(sessions_dir.iterdir(), reverse=True)
if not sessions:
    print("No sessions found.")
    raise SystemExit(0)

latest = sessions[0]
log_file = latest / 'log.jsonl'

if not log_file.exists():
    print(f"No log in {latest}. Session may be too new.")
    raise SystemExit(0)

events = []
with open(log_file) as f:
    for line in f:
        line = line.strip()
        if line:
            try: events.append(json.loads(line))
            except: pass

tool_calls = [e for e in events if e.get('type') == 'tool_use']
by_tool = {}
for t in tool_calls:
    name = t.get('tool', 'unknown')
    by_tool[name] = by_tool.get(name, 0) + 1

print(f"# Session Analysis: {latest.name}")
print(f"Total events: {len(events)}")
print()

if by_tool:
    print("## Tool Usage")
    for tool, count in sorted(by_tool.items(), key=lambda x: -x[1]):
        print(f"  {tool}: {count}x")
    print()

bash_calls = [e for e in tool_calls if e.get('tool') == 'Bash']
if bash_calls:
    print(f"## Commands Run ({len(bash_calls)} total)")
    for b in bash_calls[:5]:
        cmd = b.get('input', {}).get('command', '')[:80]
        print(f"  $ {cmd}")
    if len(bash_calls) > 5:
        print(f"  ... and {len(bash_calls) - 5} more")
    print()

print("## Retro Questions to Answer")
print("  1. Did the session follow the plan in .ohc/plans/?")
print("  2. What took longer than expected?")
print("  3. What was discovered that wasn't anticipated?")
print("  4. Is there a reusable pattern worth capturing as a skill?")
