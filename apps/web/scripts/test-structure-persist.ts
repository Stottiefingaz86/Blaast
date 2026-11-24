/**
 * Imports real Phase 2A modules. Run from apps/web:
 *   npx tsx scripts/test-structure-persist.ts
 */
import { promises as fs } from "fs";
import path from "path";
import {
  isMeasuredStructure,
  validateStructureSnapshot,
  redactStructureSnapshot,
  classifyStructure,
  mergeMotionHintsIntoStructure,
  markSyntheticFallback,
  writeAndUploadStructure,
  loadStructureSnapshot,
} from "../src/lib/evidence/structure-persist";
import { summarizeStructure } from "../src/lib/evidence/structure-summary";
import { capturesDir } from "../src/lib/platform/data-dir";

async function main() {
  const fixture = JSON.parse(
    await fs.readFile(
      path.join(
        process.cwd(),
        "src/lib/evidence/__fixtures__/measured-structure.json",
      ),
      "utf8",
    ),
  );

  let failed = 0;
  function assert(cond: boolean, msg: string) {
    if (!cond) {
      failed++;
      console.error("FAIL", msg);
    } else {
      console.log("PASS", msg);
    }
  }

  assert(isMeasuredStructure(fixture), "fixture measured");
  assert(validateStructureSnapshot(fixture).ok, "fixture valid");
  assert(classifyStructure(fixture) === "measured", "classify measured");

  const summary = summarizeStructure(fixture);
  assert(summary.regions.length >= 1, "regions summarised");
  assert(
    Boolean(summary.regions[0]?.styles?.backgroundColor),
    "styles survive summary",
  );
  assert(
    summary.motionHints.some((m) => m.durationMs === 200),
    "motion duration in summary",
  );

  const dirty = structuredClone(fixture) as typeof fixture;
  dirty.nodes[0].textPreview = "leak@secret.test";
  const clean = redactStructureSnapshot(dirty) as typeof fixture;
  assert(
    !String(clean.nodes[0].textPreview).includes("leak@secret.test"),
    "redact email",
  );

  const merged = mergeMotionHintsIntoStructure(fixture, [
    {
      name: "scene_transition",
      durationMs: 400,
      easing: "ease-out",
      source: "ffmpeg_scene_detect",
      targetHint: "viewport",
    },
  ]) as typeof fixture;
  assert(isMeasuredStructure(merged), "merged still measured");
  assert(merged.nodes[0].styles.borderRadius === "16px", "radius kept");

  const syn = markSyntheticFallback({
    provenance: "measured_video_analysis",
    nodes: [],
  });
  assert(syn.synthetic === true, "synthetic flag");
  assert(!isMeasuredStructure(syn), "synthetic not measured");

  assert(!validateStructureSnapshot(null).ok, "null invalid");
  assert(!validateStructureSnapshot({ nodes: "bad" }).ok, "nodes type invalid");

  const rel = `_phase2a-test/${Date.now()}.structure.json`;
  const written = await writeAndUploadStructure({
    structureRel: rel,
    snapshot: fixture,
  });
  assert(written.ok, `writeAndUpload ok (${written.error || "no cloud err"})`);
  assert(written.kind === "measured", "written kind measured");

  const loaded = await loadStructureSnapshot(rel);
  assert(loaded.ok, `load local ok: ${loaded.error || ""}`);
  assert(loaded.kind === "measured", "loaded measured");
  assert(loaded.source === "local", "loaded from local");
  const aside = (loaded.raw as typeof fixture).nodes[0];
  assert(aside.styles.backgroundColor === "rgb(26, 31, 37)", "loaded bg");
  assert(aside.styles.fontWeight === "500", "loaded weight");
  assert(
    (loaded.raw as typeof fixture).viewport.devicePixelRatio === 2,
    "loaded dpr",
  );

  const refused = await loadStructureSnapshot("https://evil.test/x.json");
  assert(!refused.ok, "refuse arbitrary URL");
  assert(
    (refused.error || "").includes("arbitrary"),
    "arbitrary URL error message",
  );

  const missing = await loadStructureSnapshot("no-such/path.structure.json");
  assert(!missing.ok, "missing path fails explicitly");

  try {
    await fs.unlink(path.join(capturesDir(), rel));
  } catch {
    /* */
  }

  try {
    const origin = process.env.BLAAST_ORIGIN || "https://blaast-five.vercel.app";
    const res = await fetch(`${origin}/api/mcp`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        accept: "application/json, text/event-stream",
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "tools/call",
        params: {
          name: "get_evidence",
          arguments: {
            evidence_id:
              "ev-rec-2396e3c8-3899-4fb5-b7e3-35df5a3ae536-ui-side-nav",
          },
        },
      }),
    });
    const text = await res.text();
    assert(res.status < 500, `deployed MCP status ${res.status}`);
    assert(
      text.includes("ui-side-nav") || text.includes("23efa99e"),
      "deployed MCP mentions side-nav beat (body may be SSE)",
    );
  } catch (err) {
    console.warn("deployed MCP smoke skipped/failed", err);
  }

  console.log(failed ? `\n${failed} failed` : "\nAll module tests passed");
  process.exit(failed ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
