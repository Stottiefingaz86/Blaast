# Design Agent integration contract

**Source of truth inspected:** `design-studio` @ `9368a94`  
**Updated 2026-11-23:** Reuse **governance patterns only**. Do **not** use Lumen, BetOnline tokens, live-site shell, or prior brand assets. Blaast platform UI = **shadcn**. Customers bring their own tokens or use MCP with their own AI.

## Goal
Blaast owns research evidence, rights, and governance rules. Customer (or their agent) owns design tokens/components. Competitor flows are references only — never copied as branding or styling source of truth.

## Auth
| Call | Auth |
|------|------|
| `POST /api/intake` | `Authorization: Bearer $STUDIO_INTAKE_TOKEN` |
| Handover / dev-questions | Same bearer **or** studio session cookie (local/signed-in) |

Never embed Anthropic/Figma keys in Blaast clients. Studio holds model keys.

## Intake (Blaast → Studio)

```http
POST /api/intake
Authorization: Bearer <STUDIO_INTAKE_TOKEN>
Content-Type: application/json
```

```json
{
  "title": "Cashier trust — deposit retry",
  "surface": "Cashier",
  "source": "igaming-intelligence",
  "brief": "Markdown brief…",
  "files": [{ "name": "refs.md", "data": "<base64>" }]
}
```

**Response:** `201 { "slug": "...", "url": "..." }`  
Evidence: `docs/PIPELINE.md`, `apps/studio/server.mjs`.

### Blaast brief requirements (extend beyond stock Studio)
The stock Studio assumes **Lumen**. For multi-tenant M8, Blaast must put the following in `brief` (and later a formal schema):

| Field | Required | Purpose |
|-------|----------|---------|
| `customer_design_system_version` | yes | Pin tokens/components version |
| `approved_token_set_ref` | yes | Where Studio (or agent) may read customer tokens |
| `approved_component_allowlist` | yes | Prefer these; else compose / exception |
| `governance_rules_ref` | yes | Do/don't, brand, a11y, RG constraints |
| `reference_evidence_ids[]` | yes | Blaast evidence IDs for cited competitor patterns |
| `reference_flow_summary` | yes | Layout/interaction principles only — no asset copy |
| `forbidden` | yes | Logos, trademarks, copying competitor CSS dumps |

Until Studio supports tenant DS natively, options:
1. **Adapter mode (MVP):** generate against a **sandbox DS** mounted into the studio repo for that job (sync tokens into a job-scoped path); or  
2. **Lumen pilot:** first pilot uses Lumen as stand-in customer DS (faster, weaker product proof).

**Recommendation:** approve option 1 or 2 explicitly before Task 04.

## Job lifecycle (Studio-owned)
Statuses include `queued | working | questions | direction | refine | awaiting_signoff | ready_for_dev | …`  
Stored in `specs/<slug>/job.json`.  
Blaast should poll or webhook later; v1 = poll studio UI/API with human gates unchanged.

## Validation before accept
| Check | Owner | Pass criteria |
|-------|-------|---------------|
| Token lint | Studio `tokens:lint` / adapted linter | No raw hex; only approved vars |
| Approved components | Studio reviewer + Blaast policy | Unlisted components → `exception[]` |
| No competitor branding | Human + automated string/asset scan | Fail job if logos/trademarks copied |
| Evidence citation | Blaast | Prototype metadata records `reference_evidence_ids` + DS version |
| Customer tokens win | Blaast + Studio | Reference CSS must not override customer tokens |

## Outbound (Studio → Blaast)
| Artifact | Endpoint / path |
|----------|-----------------|
| Handover JSON/files | `GET /api/jobs/:slug/handover` |
| Archive | `GET /api/jobs/:slug/handover.tar.gz` |
| Dev questions | `POST/GET /api/jobs/:slug/dev-questions` |

Blaast stores: `prototype_run`, `design_system_version`, `evidence_links`, `validation_report`, `exceptions`.

## What not to do
- Do not rebuild the agent if HTTP + skills suffice.  
- Do not publish Design Studio as the multi-tenant MCP product.  
- Do not send secrets, cookies, or payment captures in intake files.  
- Do not treat Mobbin screens as iGaming operator evidence.

## Suggested Blaast types (draft)

```ts
type DesignStudioIntake = {
  title: string
  surface: string
  source: "igaming-intelligence"
  brief: string
  files?: { name: string; data: string }[]
}

type PrototypeValidationReport = {
  designSystemVersion: string
  referenceEvidenceIds: string[]
  lintPassed: boolean
  exceptions: { component?: string; token?: string; reason: string }[]
  competitorAssetsDetected: boolean
}
```
