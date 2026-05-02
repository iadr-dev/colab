---
name: ohc-document-intake
description: External document intake — normalize user-provided specs into .ohc/doc-sources.md and a traced plan (continues `/ohc-plan`).
argument-hint: "[paths URLs or pasted spec refs]"
---

# /ohc-document-intake — External doc pack → OHC execution layer

1. Run **`document-intake`** skill: inventory roles, reconcile with `.ohc/PROJECT.md` + repo, write/update **`.ohc/doc-sources.md`**
2. Run **`brainstorming`** only if competing approaches remain unclear (keep short).
3. Run **`writing-plans`**: narrowed interview, `.ohc/plans/{feature}.md` with **Sources** + **Traceability**
4. **Gate** — show plan and wait for explicit **`go`** before BUILD
