/**
 * tests/unit/scripts/research.test.js
 * Unit tests for scripts/research.js
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

let tmpDir, prevCwd;

function freshRequire() {
  const modPath = require.resolve('../../../scripts/research');
  delete require.cache[modPath];
  return require(modPath);
}

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ohc-res-'));
  prevCwd = process.cwd();
  process.chdir(tmpDir);
  fs.mkdirSync(path.join(tmpDir, '.ohc', 'research'), { recursive: true });
});

afterEach(() => {
  process.chdir(prevCwd);
  try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch {}
});

describe('internal helpers', () => {
  it('_slugify normalizes strings', () => {
    const r = freshRequire();
    expect(r._slugify('Next.js')).toBe('next-js');
    expect(r._slugify('  App Router Metadata  ')).toBe('app-router-metadata');
    expect(r._slugify('')).toBe('untitled');
    expect(r._slugify(null)).toBe('untitled');
  });

  it('_parse extracts YAML frontmatter', () => {
    const r = freshRequire();
    const raw = '---\nlibrary: next.js\ntopic: routing\nttl_days: 30\nverified_working: true\n---\n\n# Content';
    const { meta, body } = r._parse(raw);
    expect(meta.library).toBe('next.js');
    expect(meta.ttl_days).toBe(30);
    expect(meta.verified_working).toBe(true);
    expect(body).toContain('# Content');
  });

  it('_parse handles no frontmatter', () => {
    const r = freshRequire();
    const { meta, body } = r._parse('just plain text');
    expect(meta).toEqual({});
    expect(body).toBe('just plain text');
  });

  it('_stringify round-trips with _parse', () => {
    const r = freshRequire();
    const meta = { library: 'react', topic: 'hooks', ttl_days: 7 };
    const body = '## Usage\nsome content';
    const raw = r._stringify(meta, body);
    const parsed = r._parse(raw);
    expect(parsed.meta.library).toBe('react');
    expect(parsed.meta.ttl_days).toBe(7);
    expect(parsed.body).toContain('## Usage');
  });
});

describe('save', () => {
  it('writes .md file with frontmatter', () => {
    const r = freshRequire();
    const fp = r.save({
      library: 'next.js',
      topic: 'app-router',
      payload: '### Usage\nexport const metadata = {...}',
      source: 'context7',
      version: '15.0.0',
    });
    expect(fs.existsSync(fp)).toBe(true);
    const content = fs.readFileSync(fp, 'utf8');
    expect(content).toContain('library: next.js');
    expect(content).toContain('source: context7');
    expect(content).toContain('### Usage');
  });

  it('throws when required fields missing', () => {
    const r = freshRequire();
    expect(() => r.save({})).toThrow();
    expect(() => r.save({ library: 'x' })).toThrow();
    expect(() => r.save({ library: 'x', topic: 'y' })).toThrow();
  });
});

describe('lookup', () => {
  it('returns hit:false on miss', () => {
    const r = freshRequire();
    expect(r.lookup('nonexistent', 'topic')).toEqual({ hit: false });
  });

  it('returns fresh entry within TTL', () => {
    const r = freshRequire();
    r.save({ library: 'react', topic: 'hooks', payload: 'content', ttl_days: 30 });
    const result = r.lookup('react', 'hooks');
    expect(result.hit).toBe(true);
    expect(result.fresh).toBe(true);
    expect(result.stale).toBe(false);
    expect(result.body).toContain('content');
  });
});

describe('list', () => {
  it('returns empty array when no entries', () => {
    const r = freshRequire();
    expect(r.list()).toEqual([]);
  });

  it('lists all entries sorted by age', () => {
    const r = freshRequire();
    r.save({ library: 'a', topic: 't1', payload: 'p1' });
    r.save({ library: 'b', topic: 't2', payload: 'p2' });
    const entries = r.list();
    expect(entries).toHaveLength(2);
    expect(entries[0]).toHaveProperty('library');
    expect(entries[0]).toHaveProperty('topic');
    expect(entries[0]).toHaveProperty('age_days');
  });
});

describe('search', () => {
  it('returns empty for empty query', () => {
    const r = freshRequire();
    expect(r.search('')).toEqual([]);
  });

  it('finds matches in body', () => {
    const r = freshRequire();
    r.save({ library: 'next.js', topic: 'routing', payload: 'useRouter hook usage' });
    const hits = r.search('useRouter');
    expect(hits).toHaveLength(1);
    expect(hits[0].library).toBe('next.js');
  });

  it('finds matches in metadata', () => {
    const r = freshRequire();
    r.save({ library: 'express', topic: 'middleware', payload: 'some body' });
    const hits = r.search('express');
    expect(hits).toHaveLength(1);
  });
});

describe('markVerified', () => {
  it('updates frontmatter on existing entry', () => {
    const r = freshRequire();
    r.save({ library: 'vue', topic: 'composables', payload: 'content' });
    const result = r.markVerified('vue', 'composables', 'abc123');
    expect(result).toBe(true);
    const entry = r.lookup('vue', 'composables');
    expect(entry.meta.verified_working).toBe(true);
    expect(entry.meta.verified_commit).toBe('abc123');
  });

  it('returns false on miss', () => {
    const r = freshRequire();
    expect(r.markVerified('nope', 'nope', 'x')).toBe(false);
  });
});

describe('prune', () => {
  it('removes entries past olderThanDays', () => {
    const r = freshRequire();
    r.save({ library: 'old', topic: 'thing', payload: 'p' });
    const result = r.prune({ olderThanDays: 0, expiredOnly: false });
    expect(result.removed).toHaveLength(1);
    expect(r.list()).toHaveLength(0);
  });

  it('returns empty when no dir', () => {
    const r = freshRequire();
    fs.rmSync(path.join(tmpDir, '.ohc', 'research'), { recursive: true, force: true });
    expect(r.prune()).toEqual({ removed: [] });
  });
});

describe('indexForSessionStart', () => {
  it('returns empty string when no entries', () => {
    const r = freshRequire();
    expect(r.indexForSessionStart()).toBe('');
  });

  it('builds compact index string', () => {
    const r = freshRequire();
    r.save({ library: 'next.js', topic: 'routing', payload: 'body' });
    const idx = r.indexForSessionStart();
    expect(idx).toContain('next.js');
    expect(idx).toContain('routing');
    expect(idx).toContain('Cached research');
  });

  it('respects limit', () => {
    const r = freshRequire();
    for (let i = 0; i < 5; i++) {
      r.save({ library: `lib${i}`, topic: `topic${i}`, payload: `p${i}` });
    }
    const idx = r.indexForSessionStart(2);
    expect(idx).toContain('+3 more');
  });
});
