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
2. Fetch current docs via Context7
3. Use the fetched signature — not your memory

This prevents: hallucinated method names, deprecated APIs, wrong parameter order,
missing required fields, version incompatibilities.

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
context7 /tailwindlabs/tailwindcss — responsive variants
```

See references/library-ids.md for common IDs.

## When Context7 Returns Nothing

1. Try broader query (less specific version requirement)
2. Fall back to researcher agent with Brave Search
3. Check library's official GitHub — read source if docs missing
4. Flag explicitly: "Could not find current docs for X. Based on v{N} docs: ..."

Never silently guess. Always flag when docs were unavailable.

## MCP Install (if not already configured)
```bash
# Without key (60 req/hr free tier)
claude mcp add context7 -- npx -y @upstash/context7-mcp

# With free API key (higher limits — get at context7.com/dashboard)
claude mcp add context7 -- npx -y @upstash/context7-mcp --api-key YOUR_KEY
```
