# Task 02 — Human capture vertical slice (Mobbin library)

**Depends on:** Task 01 foundation (auth, orgs, artifact storage) for cloud upload.  
**Extension scaffold exists now:** [`apps/capture-extension`](../apps/capture-extension).  
**Schemas:** [`packages/capture-schema`](../packages/capture-schema).  
**Architecture:** [`docs/capture-architecture.md`](../docs/capture-architecture.md).

## Goal
Manual Chrome MV3 capture fills an iGaming Mobbin-style library: ordered screens in a journey, with measured layout/CSS where available. Sites block Browserbase — do not use it for library fill.

## Phases

### Phase A — Done (scaffold) / complete when wired to API
- [x] MV3 extension: start/stop, per-origin permission, screenshot, structure snapshot, sensitive flags  
- [x] Local step list in popup  
- [ ] Redact paint UI before upload  
- [ ] Upload bundle to Blaast API → private storage  
- [ ] Library shows ordered flow (≥3 screens)

### Phase B — Layout & tokens in product UI
- [ ] Persist `structure` + CSS variables on steps  
- [ ] Token panel: **measured** vs **inferred** labels ([`docs/measured-vs-inferred.md`](../docs/measured-vs-inferred.md))  
- [ ] Taxonomy tags (manual or assisted) from [`docs/igaming-taxonomy.md`](../docs/igaming-taxonomy.md)

### Phase C — Motion & assets
- [ ] `getAnimations()` / CSS animation sampling  
- [ ] Visible image asset index (rights uncleared by default)  
- [ ] Optional short clip around step

### Phase D — Later
- Behaviour pack / studio “copy behaviour” — customer tokens win; competitor = reference only

## Hard rules
- No passwords, payment values, cookies, auth headers  
- User-initiated only; SPA URL changes tracked lightly later  
- Canvas/WebGL → pixels measured, styles `unavailable`  
- Manual file import fallback for phone captures

## Acceptance (Phase A end-to-end)
On a permitted test site: capture three screens; review/redact; upload; render ordered journey with provenance; tests confirm sensitive fields excluded.
