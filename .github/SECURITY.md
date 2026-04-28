# Security Policy

## Supported versions

| Version | Supported |
| ------- | --------- |
| 0.3.x   | ✓         |

## Reporting

**Do not open public issues for security vulnerabilities.**

Use GitHub's private vulnerability reporting or email the maintainers.

Include: description, steps to reproduce, potential impact, suggested fix.
Response within 72 hours.

## Scope

In scope:

- API keys written insecurely during `ohc setup`
- Hook scripts exploitable via crafted tool output
- MCP configurations exposing sensitive data
- Path traversal in skill loading or state file access

Out of scope:

- Issues in MCP server implementations (report to those maintainers)
- Issues in Claude Code, Cursor, Antigravity, or Codex (report to those vendors)
