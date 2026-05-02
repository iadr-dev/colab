# Production-ready handoff checklist (expand as your org requires)

Pick items that matter for release; not all apply to MVP.

## Operational

- Runbook exists for deploy / rollback (`docs/runbook/` or owner wiki link)
- On-call routing or equivalent noted in PR / README
- Error budgets / SLOs referenced if user-facing SLA exists

## Product / compliance

- Feature flags documented if used
- Privacy / retention notes if touching PII
- License / attribution for bundled assets

## Security

- Secrets only via env / secret manager
- Minimal threat note for risky surfaces (auth, payments); escalate to reviewer if warranted
