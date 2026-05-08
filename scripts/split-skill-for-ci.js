#!/usr/bin/env node
/**
 * One-off / utility: copy a quarantine skill tree into skills/<name>/ and split
 * SKILL.md so the root file is <= maxLines (repo CI). Tail goes to references/.
 */
const fs = require('fs');
const path = require('path');

const MAX = 180;
const TAIL = 'skill-body-continuation.md';

function main() {
  const root = path.join(__dirname, '..');
  const quarantine = process.argv[2];
  const name = process.argv[3];
  if (!quarantine || !name) {
    console.error('Usage: node split-skill-for-ci.js <quarantineRoot> <skillName>');
    process.exit(1);
  }
  const src = path.join(quarantine, name);
  const dest = path.join(root, 'skills', name);
  if (!fs.existsSync(path.join(src, 'SKILL.md'))) {
    console.error('Missing SKILL.md in', src);
    process.exit(1);
  }
  fs.cpSync(src, dest, { recursive: true });

  const skillPath = path.join(dest, 'SKILL.md');
  const content = fs.readFileSync(skillPath, 'utf8');
  const lines = content.split(/\r?\n/);

  if (lines.length <= 200) {
    console.log(name, 'OK', lines.length, 'lines — no split');
    return;
  }

  const head = lines.slice(0, MAX);
  const tail = lines.slice(MAX);
  const footer = [
    '',
    '## Extended content',
    '',
    `This repository enforces a short root \`SKILL.md\`. Continue with **\`references/${TAIL}\`** for the rest of the original skill body.`,
    '',
  ];
  fs.writeFileSync(skillPath, [...head, ...footer].join('\n'), 'utf8');

  const refDir = path.join(dest, 'references');
  fs.mkdirSync(refDir, { recursive: true });
  const contPath = path.join(refDir, TAIL);
  const contHeader = `# ${name} — body continuation\n\n_Lines ${MAX + 1}–${lines.length} of the original \`SKILL.md\` (split for CI line limits)._\n\n`;
  fs.writeFileSync(contPath, contHeader + tail.join('\n') + '\n', 'utf8');

  const outLines = fs.readFileSync(skillPath, 'utf8').split('\n').length;
  if (outLines > 200) {
    console.error(name, 'still too long:', outLines);
    process.exit(1);
  }
  console.log(name, 'split →', outLines, 'lines root,', tail.length, 'lines →', TAIL);
}

main();
