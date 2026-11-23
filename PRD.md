# iGaming Intelligence — Product Requirements Document
Version: 1.0 | Date: 2026-11-23 | Status: Proposed / discovery required

## 1. Vision
A multi-tenant iGaming research and design intelligence platform combining a Mobbin-style reference library, human-led journey capture, lifecycle email research, competitive benchmarking, evidence-based UX audits, and governed AI prototype generation through an existing Design Agent. Expose approved research via MCP and domain-specific agent skills.

## 2. Non-negotiable product principles
1. Capture evidence once; reuse across library, audits, benchmarking, and design studio.
2. Competitor UX patterns are *references*, not customer design tokens. Customer-owned tokens, components and governance override reference styling.
3. Every claim is traceable to evidence (operator, region, device, session, timestamp, artifact, confidence).
4. Clearly distinguish measured facts, visual inference, researcher observations and AI hypotheses.
5. Human-controlled research; no bypassing access restrictions, KYC, geofencing, bot protections or financial transaction controls.
6. Private customer assets and design systems are tenant-isolated; no automatic contribution to shared library.
7. Audit Scuup and Design Agent before reimplementing capabilities.

## 3. Target users
Designers, UX researchers, product managers, CRM researchers, heads of product, design engineers, iGaming agencies. Roles: platform admin, organisation admin, researcher/editor, viewer; future external reviewer.

## 4. Product modules
### M1. Operator & Research Directory (P0)
Operator profiles, products (sportsbook/casino/poker/cashier), brands, markets, platforms, access notes, capture completeness, history. Filter by jurisdiction and capture date. Operator identity is distinct from research account identity.
### M2. Capture Studio (P0)
Chrome MV3 extension with explicit start/stop and per-site permission. Human browses. Capture selected screenshots, navigation and interaction events, screen recordings (with consent), visible DOM/CSS metadata, accessible animation properties, viewport, timestamps. Manual upload fallback for video/screenshots. Segment sessions into journeys and steps. Handle SPA navigation. Do not capture typed secrets, password values, payment details, auth headers, cookies or tokens. Redact sensitive regions before storage and allow researcher review. Disable recording on payment entry/verification screens unless safe selective capture is configured.
### M3. Evidence Processing (P0)
Store raw artifacts privately; derive thumbnail, screenshot candidates, screen classification, component observations, design tokens (measured/inferred), animation clips and motion metadata. Maintain extraction version, provenance, confidence and review state. Avoid claiming exact source styles from canvas/native images.
### M4. Visual Library (P0)
Browse/search operators, screens, flows, motion, components and design profiles; filter by platform, region, feature, state and time. View chronological flow with video and evidence. Collections and comparison views. Only reviewed and rights-cleared assets enter shared catalogue.
### M5. CRM & Lifecycle Research (P1)
Import owned research inbox emails through approved connection or EML upload. Map aliases to operator and research account; preserve subject, sender, received time, sanitized HTML, screenshot, links, campaign tags, and observed event associations. Do not assert causality from timing alone. Never ingest unrelated personal email.
### M6. Journey Audits (P1)
Define audit campaigns, research scenarios, expected steps, findings, severity, confidence, recommendations and linked evidence. Compare registration, KYC, first deposit, bet placement, withdrawal and retention journeys only where authorised. Include responsible-gambling and accessibility review with jurisdiction-specific legal validation.
### M7. Benchmark My Site (P1)
Customer provides owned site URL or upload; private workspace. Compare chosen journeys and patterns with eligible reference set. Evidence-backed tables and gap analyses; do not present subjective heuristics as objective scores. Optional repeat audits over time.
### M8. Governed AI Design Studio / Studio (P1)
Customer-facing **Studio** (nav live, product Coming soon): link owned site + upload customer tokens/components/governance. Agent chats over favourites/trending library patterns (e.g. most-used side nav, bet365-like betslip, Stake lobby/activity, FanDuel onboarding) + industry research → mocks → prototype under **customer** design system via MCP skills. Layout/UX differs from internal Design Agent tooling. Prefer approved components; compose from primitives; flag exceptions. Never copy competitor trademarks/assets. Cite evidence IDs. See `docs/studio-vision.md`.
### M9. MCP & iGaming Skills (P1)
Read-only tools: search_screens, get_flow, get_motion, get_design_profile, compare_flows, get_evidence, get_audit, get_operator_history. Auth scoped by tenant, licensing and asset rights. Skills: sportsbook UX, casino UX, poker UX, cashier/KYC, CRM research, journey audit, design governance. Tool responses cite evidence IDs and source timestamps.
### M10. Commercial SaaS (P2)
Billing, subscription tiers, usage limits, tenant provisioning, audit logs, admin moderation, customer support, legal takedown workflows. Not a prerequisite for internal MVP.

## 5. Core user journeys
**Researcher:** create operator -> select market/device -> start human capture -> navigate -> stop -> review/redact -> tag flow -> publish approved evidence.
**CRM researcher:** register permitted research account -> connect dedicated inbox/alias -> ingest messages -> map to operator -> annotate lifecycle timeline.
**Product team:** connect private owned website -> select comparable operators and scenario -> receive cited benchmark -> create audit findings.
**Designer:** upload customer design system -> choose captured competitor pattern -> generate brand-compliant prototype -> validate -> review exceptions -> export.
**Agent:** authenticated MCP search -> retrieve approved evidence -> apply skill + governance -> output cited design rationale.

## 6. Information model
Organisations; users; memberships; operators; products; markets; research_accounts; research_campaigns; capture_sessions; journeys; journey_steps; events; artifacts; screen_observations; design_profiles; design_tokens; motion_observations; emails; email_events; audit_runs; findings; recommendations; benchmarks; design_systems; design_system_versions; component_registry; governance_rules; prototype_runs; approvals; evidence_links; access_grants; audit_logs.
All tenant-owned entities require organisation_id; shared research uses separate explicit publication and rights status. Artifacts have source, timestamps, jurisdiction, capture device, privacy status, provenance and review status. No plaintext credentials in DB.

## 7. Architecture baseline (validate after audit)
Monorepo TypeScript; Next.js/shadcn frontend; Supabase Postgres/Auth with RLS; private object storage (R2 or equivalent); Chrome MV3 extension; capture/processing workers and queue; multimodal AI extraction; semantic search; MCP server; Design Agent integration via package or API determined by audit. Scuup may provide reusable modules; assume nothing until verified. Never move secrets into client or extension.

## 8. Security, privacy, legal
Default deny for tenant data; RLS and server-side auth; signed short-lived artifact URLs; encrypt at rest/in transit; redact personal and financial data before AI processing; user-controlled capture scope; no recording password fields, payment card entry, authentication tokens or private third-party customer data; data deletion and retention controls; audit trail. Respect operator terms and copyright; assess redistribution rights, permitted research, regional gambling rules and lawful access before commercial publishing. No agent-initiated deposits or bets. Restrict access to verified adult researchers where applicable.

## 9. Functional acceptance criteria
- Capture session records at least 3 manually visited states with correct timestamps and viewport, without storing secret fields.
- Researcher can inspect/redact before publishing; unpublished evidence is invisible outside its authorised workspace.
- One complete journey is searchable and re-openable with its source evidence.
- CSS values distinguish measured from inferred values.
- A CRM email import can be mapped to operator, research account and timestamp with sanitized rendering.
- An audit finding links to specific evidence IDs and labels observation vs inference.
- A customer's design-system version can be imported and validated.
- Design Agent prototype uses approved tokens/components or raises a documented exception; customer system wins over reference style.
- MCP rejects unauthorised cross-tenant requests and returns cited evidence.
- Existing Scuup and Design Agent repos remain unchanged during discovery.

## 10. Nonfunctional requirements
Tenant isolation; least privilege; background job idempotency and retry; versioned extractors and prompts; event traceability; structured logging; deterministic schemas; keyboard-accessible UI; responsive web; exportable research data; sensible costs. Set concrete performance SLOs after baseline measurement rather than inventing numbers.

## 11. MVP scope and exclusions
**4-week target (conditional):** repository audit, one human-led Chrome capture, ingestion, screenshot/flow gallery, CSS extraction, basic search, evidence-backed audit, basic email import, read-only MCP, governed prototype through existing Design Agent if integration is feasible.
**Not MVP:** automatic gambling transactions, bypassing protections, native iOS/Android automated capture, enterprise SSO, exhaustive visual fidelity, automated legal compliance certification, mass-market billing, fully autonomous site crawling.

## 12. Delivery gates
G0: Existing repo audit + reuse matrix approved.
G1: Human capture -> redaction -> storage -> reviewed flow displayed.
G2: Evidence -> search -> cited journey audit.
G3: Design-system import -> governed prototype -> validation report.
G4: MCP retrieval respects tenant/rights boundaries.
G5: Private pilot QA, security review, rights review and release decision.

## 13. Risks
Existing projects incompatible; extension capture permissions and browser limitations; complex SPA/canvas content; PII leakage; copyright/terms constraints; weak AI extraction; governance rules under-specified; model cost and latency; cross-tenant access. Mitigate with repository audit, manual fallback, redaction gates, rights status, human QA, bounded agent tasks and integration tests.

## 14. Open decisions
Scuup actual capabilities; Design Agent APIs and governance format; initial target jurisdictions/operators; allowed capture content; storage provider; first email import path; pilot customers; rights/licensing policy; branding/name; whether external beta is in scope for first eight weeks.

## 15. Success measures
Time to capture/review a journey; % evidence with correct metadata; redaction failures (target zero known leaks); extraction accuracy on reviewed sample; % generated UI conforming to approved design system; audit finding citation coverage; successful MCP tenant-isolation tests; pilot task completion and usefulness ratings.
