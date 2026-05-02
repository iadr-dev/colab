---
name: ohc-research
description: Cross-session research cache. Inspect, search, prune, or verify cached library docs that the researcher agent fetched via Context7/Brave/GitHub.
argument-hint: "list | show <lib> <topic> | search \"<query>\" | prune [--older-than N] | clear | verify <lib> <topic> [commit]"
---

# /ohc-research — Research Cache

The researcher agent caches every external-doc fetch (Context7, Brave, GitHub) to
`.ohc/research/` so future sessions don't re-fetch the same thing. This command
lets you inspect and maintain that cache.

## Why it exists

Without a cache, every new session's researcher had goldfish brain — it would
ask Context7 the same `prisma findMany cursor pagination` question over and
over, burning free-tier quota and wasting tokens. The cache kills that loop.

At session start, `hooks/on-session-start.js` injects an `<ohc_research_index>`
reminder listing every cached entry + freshness. The researcher agent MUST
`lookup()` before fetching.

## Usage
```
/ohc-research list                                  List cached entries (newest first)
/ohc-research show <library> <topic>                Print one entry
/ohc-research search "<query>"                      Substring match across all entries
/ohc-research prune                                 Remove entries past TTL (default 30d)
/ohc-research prune --older-than 90                 Remove anything older than 90 days
/ohc-research clear                                 Nuke the entire cache
/ohc-research verify <library> <topic> [commit]     Stamp an entry as verified-working
```

## Equivalent CLI
```
ohc research list | show | search | prune | clear | verify
```

## File format (`.ohc/research/<library>--<topic>.md`)
```
---
library: next.js
library_id: /vercel/next.js
topic: app-router-metadata-api
source: context7
version: 15.0.0
fetched: 2026-04-29T12:00:00.000Z
ttl_days: 30
verified_working: true
verified_commit: abc123
---

## Research: next.js app-router-metadata-api
...
```

## Lifecycle

| Event             | What happens                                              |
| ----------------- | --------------------------------------------------------- |
| Researcher fetch  | `save()` writes entry with `ttl_days=30`                  |
| Session start     | `indexForSessionStart()` injects entries into context     |
| Executor/verifier | `markVerified()` stamps `verified_working + commit`       |
| Session end       | `prune({expiredOnly:true})` auto-removes stale entries    |

## Related
- `agents/researcher.md` — cache-first protocol
- `skills/context7-aware-coding/SKILL.md` — Context7 usage pattern
- `scripts/research.js` — cache API used by agents and hooks
