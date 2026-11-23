# Reuse matrix — Scuup × Design Agent → iGaming Intelligence

**Gate G0.** Effort: S ≤ 1 week · M 1–2 weeks · L 2–4 weeks · XL > 4 weeks.  
Risk: Low / Med / High (integration + compliance).

| Capability (PRD) | Source | Decision | Effort | Risk | Notes |
|------------------|--------|----------|--------|------|-------|
| Auth (user login) | Scuup | **Adapter** | S | Med | Reuse Supabase Auth patterns; add orgs before multi-tenant product |
| Organisations / RLS | — | **Rebuild** | M | High | Neither repo has org tenancy; Scuup uses service role |
| Operator directory (M1) | Scuup brands | **Adapter / rebuild** | M | Med | Brands exist inside projects; promote to first-class operators |
| Human capture (M2) | Scuup Browserbase live | **Adapter (interim)** | M | High | Strong remote capture; **not** Chrome MV3. Decide MV3 vs Browserbase for G1 |
| Chrome MV3 extension | — | **Rebuild** | L | High | Absent in both repos |
| Redaction / secret exclusion | — | **Rebuild** | M | High | UI claim only in Scuup; must be real before AI/cloud |
| Evidence storage (M3) | Scuup | **Adapter** | M | Med | Harden: private signed URLs, review state, provenance fields |
| Visual library (M4) | Scuup evidence UI | **Adapter / rebuild** | L | Med | Per-project today; shared rights-cleared catalogue is new |
| CRM / email (M5) | Scuup research IMAP | **Adapter** | M | Med | Shared mailbox → tenant/EML path; sanitize HTML |
| Journey audits (M6) | Scuup analyses + teardowns | **Adapter** | M | Med | Map to findings + evidence IDs; add formal audit campaigns |
| Benchmark my site (M7) | Scuup core product | **Reuse directly / adapter** | S–M | Low | Closest product fit; wrap with citation/rights |
| Design review (competitor CSS/DOM) | Scuup `/api/design` | **Reuse for research only** | S | Low | Not M8; useful for M3/M7 signals |
| Governed design (M8) | Design Studio | **Governance patterns only** | M | Low | Intake→gates→validation ideas; **no** Lumen/BetOnline DS; customers bring tokens or use own AI+MCP |
| Token lint patterns | Design Studio | **Adapt as DS-agnostic rules** | S | Low | “No inventing tokens; customer set wins” — not Lumen var lists |
| Lumen / live-site / BetOnline assets | Design Studio | **Do not reuse** | — | — | Explicitly out of scope for Blaast |
| Skills playbook structure | Design Studio | **Pattern only** | S | Low | Strip brand-specific lumen-build; keep governance playbook shape |
| chris-taste / Lumen knowledge | Design Studio | **Do not ship in product** | — | — | Private to other brand work |
| MCP research tools (M9) | — | **Rebuild** | L | Med | Absent; Design Agent only *consumes* Figma/Mobbin |
| Billing / admin (M10) | Scuup Stripe + admin | **Adapter** | M | Med | Extend with orgs, usage limits, audit logs |
| Queues / workers | Both (ad hoc) | **Rebuild** | M | Med | Need idempotent jobs for capture + extraction |
| Tests / CI culture | Weak both | **Rebuild** | M | Med | Add tenant isolation + capture redaction tests early |

## Recommended integration style

1. **Do not merge** Scuup and Design Studio into one repo in week 1.  
2. **Blaast** owns product schema, tenancy, evidence graph, MCP.  
3. **Scuup** = capture/analysis adapter (API or extracted packages).  
4. **Design Studio** = generation adapter via `POST /api/intake` (+ later package extract of lint/skills).  
5. Prefer **adapters before extraction**; extract shared packages only after two call sites prove the contract.

## Explicit non-reuse

- Design Studio local team auth as SaaS auth  
- Public Supabase evidence URLs as final artifact ACL model  
- Autonomous gambling transactions / research BTC deposit flows as MVP defaults without legal review  
- Mobbin as iGaming screen library (journey inspiration only — already encoded in Design Studio rules)
