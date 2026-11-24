# Phase 2A — Evidence pipeline repair (report)

**Status:** Implemented locally; awaiting deploy for full MCP remote-read of *new* measured captures.  
**Stake recapture:** not done (per constraints).

## Root causes fixed

1. **Structure never cloud-uploaded on capture** → `writeAndUploadStructure` in `store.ts` save path.  
2. **Publish overwrote measured DOM/CSS** with synthetic chrome → publish preserves measured; synthetic only as labelled fallback.  
3. **MCP read local-only** → `loadStructureSnapshot` tries local then authorised CDN path.  
4. **Batch approve script** could re-destroy measured files → skips overwrite when measured detected.

## Files changed

| File | Change |
|------|--------|
| `apps/web/src/lib/evidence/structure-persist.ts` | **New** — validate, redact, classify, merge motion, write/upload, load local/remote |
| `apps/web/src/lib/admin/store.ts` | Persist + upload structure on artifact save |
| `apps/web/src/lib/evidence/publish.ts` | Preserve measured; synthetic fallback labelled; upload structure |
| `apps/web/src/lib/storage/captures.ts` | `uploadPublishedMedia` includes `structurePath` |
| `apps/web/src/lib/evidence/from-recording.ts` | Remote-capable load + `structureCompleteness` on steps |
| `apps/web/src/lib/evidence/types.ts` | `StructureCompleteness` type |
| `apps/web/src/lib/mcp/tools.ts` | `structure_summary` on `get_evidence` |
| `apps/web/scripts/approve-and-analyze-clips.mjs` | Do not overwrite measured structure |
| `apps/web/src/lib/evidence/__fixtures__/measured-structure.json` | Controlled fixture |
| `apps/web/scripts/test-structure-pipeline.mjs` | Regression harness |
| `apps/web/scripts/test-structure-persist.ts` | Module-level regression + deployed MCP smoke |

## Tests executed

```
node scripts/test-structure-pipeline.mjs     → 29 passed
npx tsx scripts/test-structure-persist.ts    → All module tests passed
npx tsc --noEmit                             → clean
```

Covered: measured classification, CSS fields (bg, radius, font, padding, boxes, layout), motion duration/easing, viewport/DPR, redaction, malformed/null, synthetic fallback labelling, preserve-on-merge, arbitrary URL refusal, local round-trip, deployed CDN synthetic Stake object reachable, deployed MCP exact `ui-side-nav` beat.

## Example original capture payload (fixture)

See `apps/web/src/lib/evidence/__fixtures__/measured-structure.json` — includes `extractorVersion`, `stylesAvailability: "dom"`, node `styles` (e.g. `backgroundColor`, `borderRadius`, `fontSize`, `fontWeight`, `paddingLeft`), `box`, CSS transition `durationMs: 200`, easing, `viewport` 1440×900 @2x.

## Matching MCP behaviour after deploy

`get_evidence` will attach per-step:

- `structureRegions` (+ styles when measured)  
- `motionHints`  
- `structureCompleteness` (`kind`, `source`, `highFidelityCapable`, `hasStyles`, …)  
- top-level `structure_summary`

**Today’s deployed Stake `ui-side-nav` response** still reflects **pre-repair published synthetic** structure (until a new measured capture is published). Exact beat resolution remains correct.

## Remaining limitations

- Existing published corpus (70 synthetic structures) is unchanged — **needs new captures after deploy**, not rewrite-from-video.  
- Hover / collapsed **state pairs** still not captured (Phase 2B+).  
- Visual validation / reconstruction renderer not in scope.  
- Cloud upload requires Supabase env; failures are logged explicitly (not silent).  
- Bucket is public-object today (existing architecture); no new private ACL layer in 2A.

## Acceptance checklist

| Criterion | Status |
|-----------|--------|
| Real structure persistently stored | **Yes** (local + cloud upload on save/publish) |
| Publishing preserves measured | **Yes** |
| Synthetic never overwrites measured | **Yes** |
| Remote structure readable | **Yes** (loader + CDN); deploy needed for prod MCP |
| Fixture survives pipeline modules | **Yes** (tests) |
| Missing info explicit | **Yes** (`structureCompleteness` / layoutNotes) |
| Existing operator records accessible | **Yes** (no destructive republish) |
| Regression tests pass | **Yes** |
