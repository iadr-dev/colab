/**
 * skill.js — manage oh-my-colab skills
 */
const fs   = require('fs');
const path = require('path');

const CWD     = process.cwd();
const PKG_ROOT = path.join(__dirname, '..');

module.exports = function skill(args) {
  const [sub, name] = args;
  switch (sub) {
    case 'list':    return list();
    case 'promote': return promote(name);
    case 'draft':   return draft(name);
    default: console.log('Usage: ohc skill list | promote <n> | draft <n>');
  }
};

function list() {
  console.log('\n  📚 Installed skills (skills/):');
  const dir = path.join(CWD, 'skills');
  if (fs.existsSync(dir)) {
    for (const d of fs.readdirSync(dir)) {
      const f = path.join(dir, d, 'SKILL.md');
      if (fs.existsSync(f)) {
        const lines = fs.readFileSync(f, 'utf8').split('\n').length;
        const warn  = lines > 200 ? ` ⚠ ${lines} lines (>200)` : '';
        console.log(`    ✓ ${d}${warn}`);
      }
    }
  }
  console.log('\n  📝 Draft skills (.ohc/skills/):');
  const draftDir = path.join(CWD, '.ohc', 'skills');
  const files = fs.existsSync(draftDir)
    ? fs.readdirSync(draftDir).filter(f => f.endsWith('.md'))
    : [];
  if (!files.length) {
    console.log('    (none — RETRO creates drafts here)');
  } else {
    for (const f of files) {
      const n = f.replace('.md', '');
      console.log(`    📝 ${n}  →  ohc skill promote ${n}`);
    }
  }
  console.log();
}

function promote(name) {
  if (!name) { console.error('Usage: ohc skill promote <n>'); return; }
  const src = path.join(CWD, '.ohc', 'skills', `${name}.md`);
  if (!fs.existsSync(src)) { console.error(`  ✗ Draft not found: .ohc/skills/${name}.md`); return; }
  const destDir = path.join(CWD, 'skills', name);
  for (const d of ['references','scripts','assets']) {
    if (!fs.existsSync(path.join(destDir, d)))
      fs.mkdirSync(path.join(destDir, d), { recursive: true });
  }
  const content = fs.readFileSync(src, 'utf8');
  fs.writeFileSync(path.join(destDir, 'SKILL.md'), content);
  const lines = content.split('\n').length;
  console.log(`\n  ✓ Promoted: .ohc/skills/${name}.md → skills/${name}/SKILL.md`);
  if (lines > 200) console.log(`  ⚠ ${lines} lines (over 200 limit) — split content into references/`);
  console.log(`  Folders created: references/ scripts/ assets/\n`);
}

function draft(name) {
  if (!name) { console.error('Usage: ohc skill draft <n>'); return; }
  const draftDir = path.join(CWD, '.ohc', 'skills');
  if (!fs.existsSync(draftDir)) fs.mkdirSync(draftDir, { recursive: true });
  const draftFile = path.join(draftDir, `${name}.md`);
  if (fs.existsSync(draftFile)) {
    console.error(`  ✗ Draft already exists: .ohc/skills/${name}.md\n  Edit it, then run: ohc skill promote ${name}`);
    return;
  }
  const title = name.split('-').map(w => w[0].toUpperCase() + w.slice(1)).join(' ');
  fs.writeFileSync(draftFile, `---
name: ${name}
description: >
  TODO: describe when to use this skill (200 char max).
  Include trigger keywords and output type.
allowed-tools: Read Write Bash
---

# ${title}

TODO: skill protocol here. Keep this file under 200 lines.
Move examples to references/*.md, tools to scripts/*.sh

## When to Use

## Steps
1.
2.
3.

## Gotchas
(common mistakes — most valuable section)

## See Also
- references/ — detailed guides (created when you promote)
- scripts/    — validation or generation tools
`);
  console.log(`\n  ✓ Draft created: .ohc/skills/${name}.md`);
  console.log(`  Edit it, then run: ohc skill promote ${name}\n`);
}
