#!/usr/bin/env node
/**
 * ohc doctor — sanity check for cwd + optional colab semver alignment
 */
const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawnSync } = require('child_process');

const PKG_ROOT = path.join(__dirname, '..');
const CWD = process.cwd();

const MCP_HINTS = [
  { label: 'GitHub MCP', vars: ['GITHUB_PERSONAL_ACCESS_TOKEN'] },
  { label: 'Brave Search', vars: ['BRAVE_API_KEY'] },
  { label: 'Context7 optional', vars: ['CONTEXT7_API_KEY'] },
  { label: 'Firecrawl', vars: ['FIRECRAWL_API_KEY'] },
  { label: 'Sentry MCP', vars: ['SENTRY_AUTH'], note: 'URL: https://mcp.sentry.dev/mcp' },
  { label: 'Figma MCP', vars: [], note: 'URL: https://mcp.figma.com/sse' },
];

function acc(p) {
  try {
    fs.accessSync(p);
    return true;
  } catch {
    return false;
  }
}

function main() {
  const passes = [];
  const notes = [];
  let exit = 0;

  if (acc(path.join(PKG_ROOT, 'package.json'))) {
    try {
      const pkg = JSON.parse(fs.readFileSync(path.join(PKG_ROOT, 'package.json'), 'utf8'));
      if (pkg.name === '@iadr-dev/colab') {
        const r = spawnSync(process.execPath, [path.join(PKG_ROOT, 'scripts/version.js'), 'check'], {
          cwd: PKG_ROOT,
          encoding: 'utf8',
        });
        if (r.status === 0) passes.push('semver aligned in oh-my-colab checkout');
        else {
          notes.push('version drift — run npm run version:fix in this repo');
          exit = 1;
        }
      }
    } catch (_) {}
  }

  const ohc = path.join(CWD, '.ohc');
  if (!acc(ohc)) notes.push('.ohc missing — run ohc setup');
  else {
    passes.push('.ohc present');
    if (!acc(path.join(ohc, 'notepad.md'))) notes.push('.ohc/notepad.md missing');
    try {
      fs.accessSync(path.join(ohc, 'state'), fs.constants.W_OK);
      passes.push('.ohc/state writable');
    } catch {
      notes.push('.ohc/state not writable');
      exit = 1;
    }
  }

  if (acc(path.join(CWD, '.claude', 'hooks', 'on-user-prompt.js')))
    passes.push('.claude on-user-prompt hook present');

  const hooksJson = path.join(CWD, '.claude', 'hooks', 'hooks.json');
  if (acc(hooksJson)) {
    try {
      JSON.parse(fs.readFileSync(hooksJson, 'utf8'));
      passes.push('.claude/hooks/hooks.json parses');
    } catch {
      notes.push('.claude/hooks/hooks.json invalid JSON');
      exit = 1;
    }
  }

  let platforms = [];
  const userCfg = path.join(os.homedir(), '.ohc', 'config.json');
  if (acc(userCfg)) {
    try {
      platforms = JSON.parse(fs.readFileSync(userCfg, 'utf8')).platforms || [];
    } catch {
      notes.push('~/.ohc/config.json unreadable');
    }
  }

  if (platforms.includes('Cursor')) {
    try {
      const rules = fs.readdirSync(path.join(CWD, '.cursor', 'rules'));
      const n = rules.filter(r => /^ohc/i.test(r)).length;
      if (n >= 2) passes.push(`Cursor ohc-* rule files (${n})`);
      else notes.push('Cursor missing ohc rules — rerun setup');
    } catch {
      notes.push('.cursor/rules missing — rerun setup');
    }
  }

  MCP_HINTS.forEach(({ label, vars, note }) => {
    const missing = vars.filter(v => !process.env[v]);
    if (missing.length > 0) notes.push(`${label}: ${missing.join(', ')} unset`);
    else if (vars.length > 0) passes.push(`${label} env vars set`);
    if (note) notes.push(`${label} tip: ${note}`);
  });

  if (spawnSync('bash', ['--version'], { encoding: 'utf8' }).status === 0)
    passes.push('bash available (full suite: npm test)');
  else notes.push('bash missing — npm test uses Node subset; use Git Bash/WSL for test:shell');

  console.log('\n  ohc doctor\n  ─────────────────');
  passes.forEach(m => console.log(`  ✓ ${m}`));
  notes.forEach(m => console.log(`  ℹ ${m}`));
  console.log('');
  process.exit(exit);
}

module.exports = main;

if (require.main === module) main();
