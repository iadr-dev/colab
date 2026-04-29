#!/usr/bin/env node
/**
 * on-pre-compact.js — Claude Code PreCompact hook
 * Fires: before context window compaction (~80% full)
 * Budget: ~500ms — synchronous filesystem only (no network, no MCP)
 * Does:
 *   - Snapshot notepad.md + active-skills to .ohc/state/sessions/<id>/precompact-<ts>.md
 *   - Uses memory.snapshotNotepad() for consistent snapshot format
 */

const fs   = require('fs');
const path = require('path');
const memory = require('../scripts/memory');

const CWD = process.cwd();
const OHC = path.join(CWD, '.ohc');

function read(p) { try { return fs.readFileSync(p, 'utf8'); } catch { return null; } }

const sessionId = read(path.join(OHC, 'state', 'current-session.txt'))?.trim();
const ts = Date.now();

try {
  memory.snapshotNotepad(sessionId, ts);
} catch {}

process.stdout.write(JSON.stringify({ action: 'continue' }));
