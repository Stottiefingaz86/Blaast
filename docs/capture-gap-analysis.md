# Capture gap analysis — Stake sidebar reconstruction benchmark

**Phase 1 only.** Trace of real Stake desktop `ui-side-nav` from capture → publish → deployed MCP.  
**Date:** 2026-11-24  
**Benchmark artifact:** `23efa99e-86da-494c-bc9c-b3d7fe58c6ff`  
**Session:** `2396e3c8-3899-4fb5-b7e3-35df5a3ae536`  
**Evidence ID:** `ev-rec-2396e3c8-3899-4fb5-b7e3-35df5a3ae536-ui-side-nav`  
**Operator:** stake.com (desktop_web)

No schema changes, refactors, or recaptures were performed for this audit.

---

## Executive finding

Capture infrastructure for DOM + computed CSS + WAAPI **exists** in the extension. For Stake chrome beats, that measured data is **not** what MCP agents receive.

**Primary loss point:** on approve/publish, real structure is **replaced** by a synthetic “chrome regions” snapshot (`provenance: measured_video_analysis`) with hardcoded percent boxes and **no CSS**. Separately, MCP evidence assembly reads structure from the **local** captures disk, so on Vercel the snapshot is reported as **unreadable** even when a JSON file exists on Supabase Storage.

Result: agents get posters + video URLs + coverage tags, then invent layout. That matches the failed sidebar reconstructions.

---

## 1. Trace — Stake `ui-side-nav`

### 1.1 Capability chain (layer status)

| Layer | Status | Evidence |
|-------|--------|----------|
| Extension capture (video/poster/structureJson) | **Implemented** | `apps/capture-extension/background.js` (~L275–318) always requests structure + poster on stop; payload includes `structureJson`, `viewport`, `sensitiveFlags` |
| DOM / `getComputedStyle` / css variables / WAAPI | **Implemented** | `apps/capture-extension/content/structure.js` (`MEASURED_STYLE_KEYS`, `collectMotion()`, `cssVariables()`); schema `packages/capture-schema/src/structure.ts` |
| Persist on artifact create | **Partial** | `apps/web/src/lib/admin/store.ts` `saveRecordingArtifact` writes `*.structure.json` to **local** captures dir only (~L502–508). Video/poster also `uploadCaptureBuffer` to cloud; **structure is not cloud-uploaded here** |
| Approve / publish processing | **Destructive overwrite** | `apps/web/src/lib/evidence/publish.ts` (~L273–314) and `apps/web/scripts/approve-and-analyze-clips.mjs` rebuild structure via `buildMotionStructureSnapshot` + `defaultDesktopChromeRegions()` |
| Synthetic structure content | **Persisted & published** | CDN object exists; see §1.3 |
| Published index / DB path pointer | **Present** | `published-index.json` row has `structurePath` for this artifact |
| Structure file upload with media | **Missing in publish path** | `uploadPublishedMedia` (`apps/web/src/lib/storage/captures.ts` ~L126–165) uploads **video + poster only**. Synthetic structure reached CDN via approve script `uploadJson`, not via a preserve-original path |
| MCP `get_evidence` beat resolution | **Fixed (deployed)** | Deployed response returns exact `ui-side-nav` beat (not `first_deposit`) — see §3 |
| MCP structure → agent measurements | **Fail** | Step `layoutNotes` includes `Structure snapshot present but unreadable`; no `structureRegions` / `motionHints` in usable form |
| Reconstruction spec / validation | **Missing** | No `get_reconstruction_spec`; no Playwright validation |

### 1.2 Published clip record (sanitised)

From public `published-index.json` (85 clips total; 13 Stake):

| Field | Value |
|-------|--------|
| coverageStepId | `ui-side-nav` |
| reviewStatus | `approved` |
| durationMs | `24342` |
| pageUrl | `https://www.stake.com` |
| platform | `desktop_web` |
| market | `CA` |
| posterUrl | CDN `…/23efa99e-….png` (exists) |
| videoUrl | CDN `…/23efa99e-….webm` (exists) |
| mcpPosterUrl | CDN `….mcp.jpg` (exists) |
| structurePath | `2396e3c8-…/23efa99e-….structure.json` |
| annotations | 2 synthetic crops: header `0,0 100×7.5%`, side_nav `0,7.5 17×93%` |

**Viewport / DPR:** not present on the published clip row.

### 1.3 Actual stored structure JSON (CDN, full shape)

Fetched 200 from Storage. **Entire body is synthetic** (not extension `extractorVersion` / `stylesAvailability: dom`):

```json
{
  "provenance": "measured_video_analysis",
  "page": { "url": "https://www.stake.com" },
  "nodes": [
    {
      "nodeId": "chrome-header-0",
      "tag": "nav",
      "role": "header",
      "selectorHint": "[data-blaast-role=\"header\"]",
      "textPreview": "Top header",
      "box": { "x": 0, "y": 0, "width": 100, "height": 7.5 }
    },
    {
      "nodeId": "chrome-side_nav-1",
      "role": "side_nav",
      "box": { "x": 0, "y": 7.5, "width": 17, "height": 92.5 }
    },
    {
      "nodeId": "chrome-main-2",
      "role": "main",
      "box": { "x": 17, "y": 7.5, "width": 83, "height": 92.5 }
    }
  ],
  "motion": {
    "animations": [
      {
        "targetHint": "full_clip",
        "name": { "value": "clip_window" },
        "durationMs": { "value": 24342 },
        "easing": {},
        "source": "capture_duration"
      }
    ]
  }
}
```

- **No** `styles` on any node  
- **No** `cssVariables`  
- **No** real selectors from Stake DOM  
- Boxes are **hardcoded percent heuristics** from `defaultDesktopChromeRegions()` in `apps/web/src/lib/admin/analyze-video-motion.ts` (~L108–126)  
- Motion is clip duration (and elsewhere ffmpeg scene-detect), **not** sidebar collapse CSS  

### 1.4 Corpus-wide structure survey

Checked every published `structurePath` object on CDN:

| Metric | Result |
|--------|--------|
| Structures fetched | 70 |
| `provenance: measured_video_analysis` | **70 / 70** |
| Nodes with any `styles` | **0** |
| Real extension-style snapshots in published set | **0 observed** |
| Clips with no `structurePath` | 15 |

Conclusion: information loss is **systemic on publish/analyze**, not Stake-only.

### 1.5 Where original extension structure goes

1. Extension captures real snapshot → POST `/api/admin/sessions/:id/artifacts` with `structureJson`.  
2. `saveRecordingArtifact` writes local `*.structure.json` — **does not upload structure to Storage**.  
3. On approve, `publishApprovedArtifact` **unconditionally writes a new** structure file from video analysis and sets `art.structurePath` to it (~L289–314).  
4. Prior DOM snapshot on disk (if any) is overwritten; it was never durable in cloud.  
5. `from-recording.ts` (~L109–134) reads structure via `capturesRoot()` **local path only**. On Vercel MCP: file missing locally → `"Structure snapshot present but unreadable"`.

---

## 2. Pass / fail matrix (Stake sidebar fidelity needs)

Legend: **Pass** = present and usable for reconstruction of that property. **Fail** = missing or not usable. **N/A** = not expected at this layer.

| Property | Implemented in codebase | Captured (extension capable) | Persisted (durable) | Published | MCP-accessible | Agent-usable | Failure locus |
|----------|-------------------------|------------------------------|---------------------|-----------|----------------|--------------|---------------|
| DOM hierarchy | Pass (`structure.js`) | Unknown for this beat* | Fail | Fail | Fail | Fail | Overwrite + no cloud upload of original — `store.ts`, `publish.ts` |
| Element bounding boxes (px) | Pass | Unknown* | Fail | Fail (percent heuristics only) | Fail | Fail | Same |
| Computed CSS | Pass | Unknown* | Fail | Fail | Fail | Fail | Same |
| Typography | Pass (font* keys) | Unknown* | Fail | Fail | Fail | Fail | Same |
| Colours | Pass | Unknown* | Fail | Fail | Fail | Fail | Same |
| Borders / radius | Pass | Unknown* | Fail | Fail | Fail | Fail | Same |
| Padding / spacing | Pass | Unknown* | Fail | Fail | Fail | Fail | Same |
| Layout (flex/grid display) | Pass (partial keys) | Unknown* | Fail | Fail | Fail | Fail | Same; `gap` measured, full grid template not in allowlist |
| Icon geometry / SVG | Partial (box only; no SVG extract) | Fail | Fail | Fail | Fail | Fail | Not in `structure.js` allowlist |
| Default state | Implicit (single snapshot) | Unknown* | Fail | Fail | Fail | Fail | No named states |
| Hover state | Not implemented as pair | Fail | Fail | Fail | Fail | Fail | Extension never snapshots `:hover` |
| Expanded state | Not named | Fail | Fail | Fail | Fail | Fail | No state machine in capture |
| Collapsed state | Not named | Fail | Fail | Fail | Fail | Fail | Same; video may contain it but not labeled |
| Transition duration | WAAPI path exists | Unknown* | Fail | Fail (scene/clip only) | Fail | Fail | `collectMotion` not in published file; ffmpeg path instead |
| Easing | WAAPI path exists | Unknown* | Fail | Fail | Fail | Fail | Same |
| Animation keyframes | Partial (WAAPI) | Unknown* | Fail | Fail | Fail | Fail | Same |
| Video reference frames | Poster + mcp thumb | Pass | Pass | Pass | Pass (URLs) | Partial (agent must fetch; `get_evidence` has no inline image) | `get_evidence` returns URLs only; `search_*` inlines thumbs |
| Viewport dimensions | Extension captures | Unknown on pub row | Fail on published structure | Fail | Fail | Fail | Dropped in synthetic snap / not on index row |
| Device pixel ratio | In viewport type | Unknown | Fail | Fail | Fail | Fail | Same |
| Original full screenshot | Pass | Pass | Pass | Pass | Pass (URL) | Pass if fetched | OK |
| Component crops | Synthetic annotation crops | Heuristic | Pass | Pass | Partial (paths in anns; not always in MCP step media) | Partial | Crops are hardcoded % regions, not measured nav chrome |

\* **Unknown for this beat:** we cannot prove the extension wrote a real DOM snapshot for `23efa99e…` because durable cloud never retained a pre-overwrite copy. Capability exists; **this record does not contain it**.

### Exact loss points (files)

1. **`apps/web/src/lib/admin/store.ts`** — structure written locally only; no `uploadCaptureBuffer` for `structureJson`.  
2. **`apps/web/src/lib/evidence/publish.ts`** — overwrites structure with `buildMotionStructureSnapshot`; `uploadPublishedMedia` omits structure.  
3. **`apps/web/src/lib/admin/analyze-video-motion.ts`** — `defaultDesktopChromeRegions()` hardcoded layout; `analyzeVideoMotion` = ffmpeg scene cuts.  
4. **`apps/web/scripts/approve-and-analyze-clips.mjs`** — batch wrote synthetic structures for existing clips (corpus now 70/70 synthetic).  
5. **`apps/web/src/lib/evidence/from-recording.ts`** — reads local disk only; Vercel → “unreadable”.  
6. **No state capture API** — hover / collapsed / expanded never modeled.

---

## 3. Deployed MCP verification

### 3.1 Exact-beat fix

**Pass.** Live `get_evidence` for  
`ev-rec-2396e3c8-3899-4fb5-b7e3-35df5a3ae536-ui-side-nav`  
returns evidence whose `steps[0].coverageStepId` is `ui-side-nav` and `stepId` is `23efa99e-…`.  
Earlier bug (journey expansion to `first_deposit`) is **not** reproducing on this call.

### 3.2 Sanitised MCP `get_evidence` response (deployed)

Sensitive URLs truncated; shape preserved:

```json
{
  "evidence": {
    "evidenceId": "ev-rec-2396e3c8-3899-4fb5-b7e3-35df5a3ae536-ui-side-nav",
    "flowId": "stake.com-home_tour",
    "operatorSlug": "stake.com",
    "operatorName": "Stake",
    "group": "home_tour",
    "actions": ["Show the side navigation"],
    "hasVideo": true,
    "confidence": "reviewed",
    "steps": [
      {
        "stepId": "23efa99e-86da-494c-bc9c-b3d7fe58c6ff",
        "label": "Show the side navigation",
        "coverageStepId": "ui-side-nav",
        "tags": ["side_nav", "global_nav", "header", "side_navigation"],
        "layoutNotes": [
          "Captured at https://www.stake.com",
          "Tagged: Header @1s region 0%,0% 100×8%",
          "Tagged: Side navigation @1s region 0%,8% 17×93%",
          "Structure snapshot present but unreadable"
        ],
        "artifacts": [
          {
            "kind": "screenshot",
            "url": "https://blaast-five.vercel.app/api/admin/sessions/…/artifacts/…?file=poster",
            "mimeType": "image/png",
            "provenance": "measured"
          },
          {
            "kind": "video",
            "url": "https://blaast-five.vercel.app/api/admin/sessions/…/artifacts/…?file=video",
            "mimeType": "video/webm",
            "provenance": "measured"
          }
        ]
      }
    ],
    "sessionId": "2396e3c8-3899-4fb5-b7e3-35df5a3ae536",
    "libraryPath": "/admin/capture/2396e3c8-3899-4fb5-b7e3-35df5a3ae536"
  },
  "agent_prompt": null,
  "prompt_source": null,
  "citations": []
}
```

### 3.3 Agent receives?

| Need | Result |
|------|--------|
| Correct component beat | **Yes** |
| Actual inline images in `get_evidence` | **No** — URLs only (`search_*` tools inline MCP thumbs via `apps/web/src/lib/mcp/visual.ts`) |
| Structured measurements (CSS/geometry) | **No** |
| Complete interaction states | **No** |
| Useful motion (collapse/hover) | **No** |
| Accessible poster/video | **Yes** if session media API / CDN reachable |
| Journey expansion | **Not on this call** |
| Truncation of measurements | N/A — measurements absent |
| `agent_prompt` | **null** on this call (generation returned null / failed silently in handler `.catch`) |

---

## 4. Recovery without new captures (six operators)

| Missing piece | Recoverable from stored DOM/CSS? | Fix publishing only? | Recover from video/frames? | Requires new capture? |
|---------------|----------------------------------|----------------------|----------------------------|------------------------|
| Real computed CSS / DOM tree | **No** — not in published corpus (0/70 with styles); original not cloud-retained | N/A | No | **Yes** for chrome beats |
| Hover / collapsed / expanded named states | No | No | **Partial** — frames can be extracted manually; not labeled | **Yes** for reliable state pairs + CSS |
| Collapse transition ms / easing | No | No | **Weak estimate** from frame deltas | **Yes** for CSS/WAAPI truth |
| Viewport / DPR | Not on pub rows | If still on session artifact in admin cloud JSON — **check per session**; Stake pub row lacks it | Infer from poster pixel size | Prefer recapture to be sure |
| Posters / videos / mcp thumbs | Already present | Keep | Already present | No |
| Heuristic chrome crops | Present but wrong precision | Can re-crop from posters with better boxes | Yes | Optional |
| Scene-cut motion JSON | Present | Keep as weak signal only | Re-run ffmpeg | No |

**Does Stake require recapturing for the sidebar benchmark?**  
**Yes**, for High Fidelity acceptance (geometry ≤2px, matched CSS, hover, collapse). Existing videos remain useful for motion QA and frame sampling, but they **cannot** restore lost DOM/CSS.

Do **not** recapture until Phase 2 fixes preserve structure on upload and stop overwriting on publish.

---

## 5. Deterministic reconstruction (evaluation only)

### What already supports non-LLM measurement consumption

- Schema: `packages/capture-schema/src/structure.ts` (`MeasuredStyles`, boxes, cssVariables, provenance).  
- Summariser: `apps/web/src/lib/evidence/structure-summary.ts` maps nodes → regions + motionHints + tokenHints (only if real styles exist).  
- Design Agent contract: `docs/design-agent-contract.md` — customer tokens override competitor styling (Apply My Design System mode).

### Proposed split (no implementation this phase)

| Property | Authority |
|----------|-----------|
| Width, radius, colour, type, gap, padding | Captured structure (deterministic) |
| Hover / collapsed geometry + CSS | Captured state snapshots (deterministic) |
| Transition duration / easing | WAAPI / computed transition (deterministic) |
| React composition / file structure | Agent |
| Map to customer DS tokens | Design Agent + governance |
| Pass/fail fidelity | Validation engine (future) |

A thin **deterministic compiler** (structure nodes → layout tokens / style object / state table) can feed any coding agent. LLM should not re-guess `borderRadius` when `styles.borderRadius` is present.

Blocked today: **no real structure in the pipeline output**.

---

## 6. Recommended minimal fixes (priority by fidelity impact)

Ordered for Stake sidebar reconstruction — **propose only**; implement after review.

1. **P0 — Stop overwriting real structure on publish**  
   `publish.ts` / approve script: if `art.structurePath` already has extension snapshot (`extractorVersion` / `stylesAvailability`), **merge** motion hints; do not replace nodes.  
   Impact: restores measured CSS path for future captures.

2. **P0 — Cloud-upload structure on artifact save + on publish**  
   `store.ts` + `uploadPublishedMedia`: treat `structure.json` like poster/video.  
   Impact: durable evidence on Vercel.

3. **P0 — MCP read structure from CDN when local missing**  
   `from-recording.ts`: fetch Storage object when `capturesRoot` read fails.  
   Impact: agents get regions/styles without redeploying captures to the MCP host disk.

4. **P1 — Named chrome states in capture**  
   Extension: snapshot default + hover (forced) + collapsed after user toggles; store as state-keyed structure or sibling files.  
   Impact: only way to stop inventing open/close.

5. **P1 — `get_reconstruction_spec` (thin wrapper)**  
   Bundle: poster, crops, structure regions+styles, states, video URL, viewport — one MCP tool.  
   Impact: agents stop scavenging 16 videos.

6. **P2 — Validation loop**  
   Playwright + masked pixel diff on chrome region.  
   Impact: measurable Done criteria.

7. **P2 — Inline or guaranteed-fetchable stills on `get_evidence`**  
   Align with `search_*` visual path so agents always see the still.

---

## 7. Stake recapture decision

| Question | Answer |
|----------|--------|
| Recapture now? | **No** — wait for P0 preserve/upload/read fixes |
| Recapture after P0? | **Yes** — Stake desktop `ui-side-nav` + header, including explicit collapsed + hover passes |
| Existing Stake videos wasted? | **No** — keep for frame/motion QA; insufficient alone for High Fidelity |

---

## 8. Definition of done (benchmark — not yet met)

From the approved acceptance list, current score against deployed MCP + published Stake side-nav:

| Criterion | Status |
|-----------|--------|
| Correct Stake evidence via deployed MCP | **Met** (exact beat) |
| Measured geometry ≤2px | **Not met** — no measured px CSS boxes |
| Typography / colours / radius matched from capture | **Not met** |
| Hover states | **Not met** |
| Expanded / collapsed | **Not met** |
| Animation timing ±30ms | **Not met** |
| Easing / sequence validated | **Not met** |
| Masked screenshot validation | **Not built** |
| Customer DS mode governance | **Out of scope Phase 1** |
| Second operator without hardcoding | **Not proven** |

---

## Source file index

| Path | Role in gap |
|------|-------------|
| `apps/capture-extension/content/structure.js` | Real DOM/CSS/WAAPI capture |
| `apps/capture-extension/background.js` | Attaches `structureJson` on stop |
| `packages/capture-schema/src/structure.ts` | Typed measured styles |
| `apps/web/src/lib/admin/store.ts` | Local structure write; no cloud structure upload |
| `apps/web/src/lib/evidence/publish.ts` | Overwrites structure; media upload omits structure |
| `apps/web/src/lib/admin/analyze-video-motion.ts` | Synthetic chrome + ffmpeg motion |
| `apps/web/scripts/approve-and-analyze-clips.mjs` | Batch synthetic structures → CDN |
| `apps/web/src/lib/storage/captures.ts` | `uploadPublishedMedia` video/poster only |
| `apps/web/src/lib/evidence/from-recording.ts` | Local-only structure load → MCP “unreadable” |
| `apps/web/src/lib/evidence/structure-summary.ts` | Would expose styles if present |
| `apps/web/src/lib/mcp/tools.ts` | `get_evidence` / `search_*` |
| `apps/web/src/lib/mcp/visual.ts` | Inline images for search only |

---

*End of Phase 1 deliverable. Next implementation phase pending review.*
