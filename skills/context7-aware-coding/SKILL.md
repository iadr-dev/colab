---
name: context7-aware-coding
description: >
  Enforces use of Context7 MCP for all external library documentation. Prevents
  API hallucination by requiring real-time doc fetching before any external library
  call. Auto-triggered when external library usage is detected in code context.
allowed-tools: Read
---

# Context7-Aware Coding

Never use training data for external library API signatures. Always fetch current docs.

## The Rule

Before writing any code that calls an external library:
1. Identify the library and the specific API needed
2. **Check `.ohc/research/` cache first** — `research.lookup(library, topic)`.
   Fresh hit → use cached body, do not re-fetch.
3. On miss or stale hit: fetch current docs via Context7
4. After fetch: `research.save({library, topic, source:'context7', version, payload})`
5. Use the fetched signature — not your memory

This prevents: hallucinated method names, deprecated APIs, wrong parameter order,
missing required fields, version incompatibilities.

The cache is cross-session (survives `/clear` and new sessions) and indexed into
session start via the `<ohc_research_index>` reminder, so the agent knows upfront
what's already been researched.

## How to Use Context7

### Prefix trigger
```
use context7 — how do I use prisma findMany with cursor-based pagination?
use context7 nextjs — what is the correct way to use server actions in Next.js 15?
```

### By library ID
```
context7 /vercel/next.js — app router metadata API
context7 /prisma/prisma — transaction API
context7 /tailwindlabs/tailwindcss.com — responsive variants
```

See references/ folder for library IDs organized by category:
- **references/frontend-library-ids.md** - React, Vue, Next.js, Tailwind CSS
- **references/backend-fullstack-library-ids.md** - Express, Prisma, tRPC, auth
- **references/mobile-library-ids.md** - React Native, Flutter, Android, iOS
- **references/python-library-ids.md** - FastAPI, Flask, Django, data science
- **references/ai-llm-library-ids.md** - Vercel AI SDK, LangChain, OpenAI

### Research mode
Use normal Context7 queries first. If the answer is shallow, outdated, or missing the
exact API surface needed, retry the same query with research mode enabled.

Research mode requires a Context7 API key. If unavailable, say so explicitly and use
the normal docs response plus official docs/source as the fallback.

## When Context7 Returns Nothing

1. Try broader query (less specific version requirement)
2. Retry with research mode if a Context7 API key is configured
3. Fall back to researcher agent with Brave Search
4. Check library's official GitHub — read source if docs missing
5. Flag explicitly: "Could not find current docs for X. Based on v{N} docs: ..."

Never silently guess. Always flag when docs were unavailable.

## Cache audit (verified-working)

After executor/verifier confirms the research produced working code:
```
ohc research verify <library> <topic> <commit-sha>
```
This stamps `verified_working: true` + the commit SHA onto the cached entry so
the reviewer can audit which design decisions rest on which fetched docs, and
so subsequent sessions can trust that entry more strongly.

## MCP Install (if not already configured)
```bash
# Without key (60 req/hr free tier)
claude mcp add context7 -- npx -y @upstash/context7-mcp

# With free API key (higher limits — get at context7.com/dashboard)
claude mcp add context7 -- npx -y @upstash/context7-mcp --api-key YOUR_KEY
```
