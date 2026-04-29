#!/usr/bin/env node
/**
 * tests/smoke/check-skill-lines.js — lint skill files for length
 * Rules:
 *   - SKILL.md must exist in each skills/<name>/ directory
 *   - SKILL.md must be <= 200 lines
 * Exits 0 if all pass, 1 if any fail
 */

const fs   = require('fs');
const path = require('path');

const ROOT      = path.join(__dirname, '../..');
const skillsDir = path.join(ROOT, 'skills');
const MAX_LINES = 200;

let pass = 0;
let fail = 0;

if (!fs.existsSync(skillsDir)) {
  console.error('  ✗ skills/ directory not found');
  process.exit(1);
}

for (const name of fs.readdirSync(skillsDir)) {
  const skillFile = path.join(skillsDir, name, 'SKILL.md');
  if (!fs.existsSync(skillFile)) continue;

  const lines = fs.readFileSync(skillFile, 'utf8').split('\n').length;
  if (lines > MAX_LINES) {
    console.error(`  ✗ skills/${name}/SKILL.md is ${lines} lines (max ${MAX_LINES})`);
    console.error(`    Move content to skills/${name}/references/ to split it.`);
    fail++;
  } else {
    console.log(`  ✓ skills/${name}/SKILL.md (${lines} lines)`);
    pass++;
  }
}

console.log(`\n  Skills: ${pass} ok, ${fail} over limit\n`);
process.exit(fail > 0 ? 1 : 0);
