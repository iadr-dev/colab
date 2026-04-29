/**
 * scripts/research-cli.js — `ohc research` subcommand
 *
 * Usage:
 *   ohc research list
 *   ohc research show <library> <topic>
 *   ohc research search "<query>"
 *   ohc research prune [--older-than <days>]
 *   ohc research clear
 *   ohc research verify <library> <topic> [commit]
 */

const fs       = require('fs');
const path     = require('path');
const research = require('./research');

function printHelp() {
  console.log([
    '',
    '  ohc research — cross-session research cache',
    '',
    '  Commands:',
    '    list                                 List cached entries (newest first)',
    '    show <library> <topic>               Print a cached entry',
    '    search "<query>"                     Substring search across cache',
    '    prune [--older-than N]               Remove expired (or >N day) entries',
    '    clear                                Remove all cached entries',
    '    verify <library> <topic> [commit]    Mark an entry as verified-working',
    '',
    '  Cache location: .ohc/research/',
    '',
  ].join('\n'));
}

function cmdList() {
  const entries = research.list();
  if (!entries.length) {
    console.log('\n  No cached research. .ohc/research/ is empty.\n');
    return;
  }
  console.log(`\n  Cached research (${entries.length} entries):\n`);
  for (const e of entries) {
    const tag  = e.stale ? `stale ${e.age_days}d` : `fresh ${e.age_days}d`;
    const v    = e.verified_working ? ' ✓' : '';
    const ver  = e.version ? ` @${e.version}` : '';
    console.log(`  [${tag}] ${e.library}${ver} / ${e.topic}${v}  (${e.source})`);
  }
  console.log('');
}

function cmdShow(library, topic) {
  if (!library || !topic) {
    console.error('  Usage: ohc research show <library> <topic>');
    process.exit(1);
  }
  const hit = research.lookup(library, topic);
  if (!hit.hit) {
    console.error(`  No cached entry for ${library} / ${topic}.`);
    process.exit(1);
  }
  const status = hit.fresh ? 'fresh' : 'stale';
  console.log(`\n  ${hit.meta.library} / ${hit.meta.topic}`);
  console.log(`  source=${hit.meta.source}  version=${hit.meta.version || '?'}  fetched=${hit.meta.fetched}  (${status}, ${hit.age_days}d old)`);
  console.log(`  file: ${hit.path}`);
  console.log('  ─────────────────────────────────────');
  console.log(hit.body);
  console.log('');
}

function cmdSearch(query) {
  if (!query) { console.error('  Usage: ohc research search "<query>"'); process.exit(1); }
  const hits = research.search(query);
  if (!hits.length) { console.log(`\n  No matches for "${query}".\n`); return; }
  console.log(`\n  ${hits.length} match(es) for "${query}":\n`);
  for (const h of hits) {
    console.log(`  ${h.library} / ${h.topic}`);
    console.log(`    ${h.snippet}`);
    console.log('');
  }
}

function cmdPrune(args) {
  const idx = args.indexOf('--older-than');
  const olderThanDays = idx >= 0 ? parseInt(args[idx + 1], 10) : null;
  const opts = olderThanDays != null ? { olderThanDays, expiredOnly: false } : { expiredOnly: true };
  const r = research.prune(opts);
  const mode = olderThanDays != null ? `older than ${olderThanDays}d` : 'expired (past TTL)';
  console.log(`\n  Pruned ${r.removed.length} ${mode} entries.`);
  for (const f of r.removed) console.log(`    - ${f}`);
  console.log('');
}

function cmdClear() {
  const dir = research.DIR;
  if (!fs.existsSync(dir)) { console.log('\n  Nothing to clear.\n'); return; }
  let removed = 0;
  for (const f of fs.readdirSync(dir)) {
    if (f.endsWith('.md')) { try { fs.unlinkSync(path.join(dir, f)); removed++; } catch {} }
  }
  console.log(`\n  Cleared ${removed} entries from .ohc/research/.\n`);
}

function cmdVerify(library, topic, commit) {
  if (!library || !topic) {
    console.error('  Usage: ohc research verify <library> <topic> [commit]');
    process.exit(1);
  }
  const ok = research.markVerified(library, topic, commit || null);
  if (!ok) {
    console.error(`  No cached entry for ${library} / ${topic}.`);
    process.exit(1);
  }
  console.log(`  ✓ Marked ${library} / ${topic} as verified-working${commit ? ` (commit ${commit})` : ''}.`);
}

module.exports = function researchCli(args) {
  const [sub, ...rest] = args;
  if (!sub || sub === 'help' || sub === '--help') return printHelp();
  if (sub === 'list')   return cmdList();
  if (sub === 'show')   return cmdShow(rest[0], rest[1]);
  if (sub === 'search') return cmdSearch(rest.join(' ').replace(/^"|"$/g, ''));
  if (sub === 'prune')  return cmdPrune(rest);
  if (sub === 'clear')  return cmdClear();
  if (sub === 'verify') return cmdVerify(rest[0], rest[1], rest[2]);
  console.error(`  Unknown subcommand: ${sub}`);
  printHelp();
  process.exit(1);
};
