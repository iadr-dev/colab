/**
 * scripts/research.js — cross-session research cache
 *
 * Persists external-doc lookups (Context7, Brave, GitHub) to .ohc/research/
 * so future sessions don't re-fetch the same docs. Prevents goldfish brain
 * and burns less free-tier MCP quota.
 *
 * File layout: .ohc/research/<library-slug>--<topic-slug>.md
 * Frontmatter (YAML) + markdown body.
 *
 * Used by:
 *   - agents/researcher.md  → lookup before fetch, save after fetch
 *   - hooks/on-session-start.js → inject index of cached entries
 *   - hooks/on-session-end.js   → prune expired entries
 *   - scripts/research-cli.js   → user-facing CLI (ohc research ...)
 */

const fs   = require('fs');
const path = require('path');

const CWD = process.cwd();
const OHC = path.join(CWD, '.ohc');
const DIR = path.join(OHC, 'research');

const DEFAULT_TTL_DAYS = 30;

function mkdir(d) { if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true }); }
function read(p)  { try { return fs.readFileSync(p, 'utf8'); } catch { return null; } }

function slugify(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'untitled';
}

function filePath(library, topic) {
  return path.join(DIR, `${slugify(library)}--${slugify(topic)}.md`);
}

function parse(raw) {
  const m = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!m) return { meta: {}, body: raw };
  const meta = {};
  for (const line of m[1].split('\n')) {
    const kv = line.match(/^([a-z_]+):\s*(.*)$/i);
    if (!kv) continue;
    let v = kv[2].trim();
    if (v === 'null' || v === '') v = null;
    else if (v === 'true')  v = true;
    else if (v === 'false') v = false;
    else if (/^-?\d+$/.test(v)) v = parseInt(v, 10);
    else if (/^".*"$/.test(v)) v = v.slice(1, -1);
    meta[kv[1]] = v;
  }
  return { meta, body: m[2] };
}

function stringify(meta, body) {
  const lines = ['---'];
  for (const [k, v] of Object.entries(meta)) {
    if (v === null || v === undefined) { lines.push(`${k}: null`); continue; }
    if (typeof v === 'string' && /[:#]/.test(v)) lines.push(`${k}: "${v.replace(/"/g, '\\"')}"`);
    else lines.push(`${k}: ${v}`);
  }
  lines.push('---', '', body.trim(), '');
  return lines.join('\n');
}

function ageDays(iso) {
  if (!iso) return Infinity;
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return Infinity;
  return Math.floor((Date.now() - t) / 86400000);
}

/**
 * Persist a research entry. Overwrites any existing entry for (library, topic).
 * @param {object} opts
 * @param {string} opts.library          - e.g. "next.js"
 * @param {string} opts.topic            - e.g. "app-router-metadata-api"
 * @param {string} opts.payload          - markdown body (the actual research)
 * @param {string} [opts.source]         - "context7" | "brave-search" | "github" | "manual"
 * @param {string} [opts.version]        - library version string
 * @param {string} [opts.library_id]     - canonical id, e.g. "/vercel/next.js"
 * @param {number} [opts.ttl_days]
 * @param {boolean} [opts.verified_working]
 * @returns {string} file path written
 */
function save(opts) {
  const {
    library, topic, payload,
    source = 'manual', version = null, library_id = null,
    ttl_days = DEFAULT_TTL_DAYS, verified_working = false,
  } = opts || {};

  if (!library || !topic || !payload) {
    throw new Error('research.save: library, topic, payload are required');
  }

  mkdir(DIR);
  const fp = filePath(library, topic);
  const meta = {
    library,
    library_id,
    topic,
    source,
    version,
    fetched: new Date().toISOString(),
    ttl_days,
    verified_working,
    verified_commit: null,
  };
  fs.writeFileSync(fp, stringify(meta, payload));
  return fp;
}

/**
 * Look up a cached entry by (library, topic). Returns hit metadata + payload
 * with freshness indicator. Never throws on miss.
 * @returns {{hit: boolean, fresh: boolean, stale: boolean, age_days: number, meta: object, body: string, path: string} | {hit: false}}
 */
function lookup(library, topic) {
  const fp = filePath(library, topic);
  if (!fs.existsSync(fp)) return { hit: false };
  const { meta, body } = parse(read(fp) || '');
  const age = ageDays(meta.fetched);
  const ttl = Number.isFinite(meta.ttl_days) ? meta.ttl_days : DEFAULT_TTL_DAYS;
  return {
    hit: true,
    fresh: age <= ttl,
    stale: age > ttl,
    age_days: age,
    meta,
    body,
    path: fp,
  };
}

/**
 * List all cached entries (metadata only, no body).
 * Sorted newest-first.
 */
function list() {
  if (!fs.existsSync(DIR)) return [];
  return fs.readdirSync(DIR)
    .filter(f => f.endsWith('.md'))
    .map(f => {
      const fp = path.join(DIR, f);
      const { meta } = parse(read(fp) || '');
      const age = ageDays(meta.fetched);
      const ttl = Number.isFinite(meta.ttl_days) ? meta.ttl_days : DEFAULT_TTL_DAYS;
      return {
        file: f,
        path: fp,
        library: meta.library || '?',
        topic: meta.topic || '?',
        source: meta.source || '?',
        version: meta.version || null,
        fetched: meta.fetched || null,
        age_days: age,
        stale: age > ttl,
        ttl_days: ttl,
        verified_working: !!meta.verified_working,
      };
    })
    .sort((a, b) => (a.age_days - b.age_days));
}

/**
 * Substring search across all cache bodies + metadata.
 * Case-insensitive. Returns entries with match context.
 */
function search(query) {
  const q = String(query || '').toLowerCase();
  if (!q) return [];
  if (!fs.existsSync(DIR)) return [];
  const hits = [];
  for (const f of fs.readdirSync(DIR)) {
    if (!f.endsWith('.md')) continue;
    const fp = path.join(DIR, f);
    const raw = read(fp) || '';
    const { meta, body } = parse(raw);
    const haystack = `${meta.library} ${meta.topic} ${body}`.toLowerCase();
    if (haystack.includes(q)) {
      const idx = body.toLowerCase().indexOf(q);
      const snippet = idx >= 0
        ? body.slice(Math.max(0, idx - 40), idx + 120).replace(/\s+/g, ' ').trim()
        : `${meta.library} / ${meta.topic}`;
      hits.push({
        file: f,
        path: fp,
        library: meta.library,
        topic: meta.topic,
        snippet,
      });
    }
  }
  return hits;
}

/**
 * Prune entries. By default removes entries past their TTL.
 * @param {object} [opts]
 * @param {number} [opts.olderThanDays] - remove anything older than N days (overrides TTL)
 * @param {boolean} [opts.expiredOnly]  - default true; if false with olderThanDays, uses age only
 * @returns {{removed: string[]}}
 */
function prune(opts = {}) {
  const { olderThanDays = null, expiredOnly = true } = opts;
  if (!fs.existsSync(DIR)) return { removed: [] };

  const removed = [];
  for (const entry of list()) {
    let shouldRemove = false;
    if (olderThanDays != null) {
      shouldRemove = entry.age_days >= olderThanDays;
    } else if (expiredOnly) {
      shouldRemove = entry.stale;
    }
    if (shouldRemove) {
      try { fs.unlinkSync(entry.path); removed.push(entry.file); } catch {}
    }
  }
  return { removed };
}

/**
 * Mark a cached entry as verified-working (linked to a commit).
 * Called after executor/verifier confirms the research led to working code.
 */
function markVerified(library, topic, commit) {
  const fp = filePath(library, topic);
  if (!fs.existsSync(fp)) return false;
  const { meta, body } = parse(read(fp) || '');
  meta.verified_working = true;
  meta.verified_commit = commit || null;
  fs.writeFileSync(fp, stringify(meta, body));
  return true;
}

/**
 * Build a compact index string for injection into session-start context.
 * Empty string if no cache.
 */
function indexForSessionStart(limit = 20) {
  const entries = list();
  if (!entries.length) return '';

  const shown = entries.slice(0, limit);
  const lines = shown.map(e => {
    const tag = e.stale ? `stale ${e.age_days}d` : `fresh ${e.age_days}d`;
    const ver = e.verified_working ? ' ✓' : '';
    return `- [${tag}] ${e.library} / ${e.topic}${ver}`;
  });
  const more = entries.length > limit ? `\n(+${entries.length - limit} more — run \`ohc research list\`)` : '';
  return [
    `Cached research (${entries.length} ${entries.length === 1 ? 'entry' : 'entries'}, .ohc/research/):`,
    ...lines,
  ].join('\n') + more + '\n\nResearcher agent MUST check cache (`lookup(library, topic)`) before Context7/Brave fetches.';
}

module.exports = {
  save, lookup, list, search, prune, markVerified, indexForSessionStart,
  // exposed for testing
  _slugify: slugify, _filePath: filePath, _parse: parse, _stringify: stringify,
  DIR, DEFAULT_TTL_DAYS,
};
