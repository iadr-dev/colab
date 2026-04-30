---
name: research
description: Cross-session research cache — inspect, search, prune, or verify cached library docs
argument-hint: "list | show <lib> <topic> | search \"<query>\" | prune [--older-than N] | clear | verify <lib> <topic>"
---

# /research — Research Cache

The researcher agent caches every external-doc fetch (Context7, Brave, GitHub) to
`.ohc/research/` so future sessions don't re-fetch the same thing.

## Usage
```
/research list                                  List cached entries (newest first)
/research show <library> <topic>                Print one entry
/research search "<query>"                      Substring match across all entries
/research prune                                 Remove entries past TTL (default 30d)
/research prune --older-than 90                 Remove anything older than 90 days
/research clear                                 Nuke the entire cache
/research verify <library> <topic> [commit]     Stamp an entry as verified-working
```

## File format (`.ohc/research/<library>--<topic>.md`)
```
---
library: next.js
topic: app-router-metadata-api
source: context7
fetched: 2026-04-29T12:00:00.000Z
ttl_days: 30
verified_working: true
---
```

## Related
- `agents/researcher.md` — cache-first protocol
- `scripts/research.js` — cache API
