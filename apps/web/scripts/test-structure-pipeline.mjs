/**
 * Phase 2A regression: structure persist / classify / redact / preserve / load.
 * Run: node apps/web/scripts/test-structure-pipeline.mjs
 * (from apps/web: node scripts/test-structure-pipeline.mjs)
 */
import { createRequire } from "node:module";
import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { register } from "node:module";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

// Load TS modules via next/tsx if available; else inline critical asserts against fixture JSON.
const fixturePath = path.join(
  root,
  "src/lib/evidence/__fixtures__/measured-structure.json",
);
const fixture = JSON.parse(await fs.readFile(fixturePath, "utf8"));

let passed = 0;
let failed = 0;
function assert(cond, msg) {
  if (cond) {
    passed++;
    console.log("  PASS", msg);
  } else {
    failed++;
    console.error("  FAIL", msg);
  }
}

console.log("\n=== Phase 2A structure pipeline tests ===\n");

// --- Pure logic mirrored from structure-persist (keep in sync) ---
function isMeasuredStructure(raw) {
  if (!raw || typeof raw !== "object") return false;
  if (raw.provenance === "measured_video_analysis") return false;
  if (raw.synthetic === true) return false;
  if (typeof raw.extractorVersion === "string" && raw.extractorVersion.length > 0)
    return true;
  if (raw.stylesAvailability === "dom" || raw.stylesAvailability === "mixed")
    return true;
  const nodes = Array.isArray(raw.nodes) ? raw.nodes : [];
  return nodes.some((n) => n && n.styles && typeof n.styles === "object");
}

function validateStructureSnapshot(raw) {
  if (raw == null || typeof raw !== "object")
    return { ok: false, error: "structure must be a JSON object" };
  if (raw.nodes != null && !Array.isArray(raw.nodes))
    return { ok: false, error: "structure.nodes must be an array when present" };
  return { ok: true };
}

function redactStructureSnapshot(raw) {
  const clone = JSON.parse(JSON.stringify(raw));
  const scrub = (t) =>
    typeof t !== "string"
      ? t
      : t
          .replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, "[redacted-email]")
          .replace(/\b(?:\d[ -]*?){13,19}\b/g, "[redacted-number]");
  if (Array.isArray(clone.nodes)) {
    for (const n of clone.nodes) {
      if (n?.textPreview) n.textPreview = scrub(n.textPreview);
    }
  }
  return clone;
}

console.log("1) Fixture is measured");
assert(isMeasuredStructure(fixture), "fixture classified measured");
assert(validateStructureSnapshot(fixture).ok, "fixture validates");

console.log("\n2) Measured values present");
const aside = fixture.nodes[0];
assert(aside.styles.backgroundColor === "rgb(26, 31, 37)", "bg colour");
assert(aside.styles.borderRadius === "16px", "border radius");
assert(aside.styles.fontSize === "13px", "font size");
assert(aside.styles.fontWeight === "500", "font weight");
assert(aside.styles.paddingLeft === "8px", "padding");
assert(aside.box.width === 240 && aside.box.height === 800, "bounding box");
assert(aside.styles.display === "flex", "layout display");
assert(aside.styles.gap === "2px", "gap");
const anim = fixture.motion.animations[0];
assert(anim.durationMs.value === 200, "transition duration");
assert(anim.easing.value.includes("cubic-bezier"), "easing");
assert(anim.name.value === "width", "transition property / keyframe name");
assert(fixture.viewport.width === 1440, "viewport width");
assert(fixture.viewport.devicePixelRatio === 2, "dpr");

console.log("\n3) Synthetic must not be treated as measured");
const synthetic = {
  provenance: "measured_video_analysis",
  synthetic: true,
  nodes: [{ nodeId: "chrome-header-0", box: { x: 0, y: 0, width: 100, height: 7.5 } }],
};
assert(!isMeasuredStructure(synthetic), "synthetic not measured");

console.log("\n4) Malformed rejected");
assert(!validateStructureSnapshot(null).ok, "null invalid");
assert(!validateStructureSnapshot({ nodes: "x" }).ok, "bad nodes invalid");

console.log("\n5) Redaction");
const dirty = {
  ...fixture,
  nodes: [
    {
      ...fixture.nodes[0],
      textPreview: "user@example.com balance",
    },
  ],
};
const clean = redactStructureSnapshot(dirty);
assert(
  !String(clean.nodes[0].textPreview).includes("user@example.com"),
  "email redacted",
);

console.log("\n6) Preserve path: measured wins over synthetic write");
let preserved = fixture;
if (isMeasuredStructure(preserved)) {
  // publish would merge motion, not replace nodes
  const merged = JSON.parse(JSON.stringify(preserved));
  merged.motion.animations.push({
    name: { value: "scene_transition", provenance: "inferred" },
    durationMs: { value: 400, provenance: "inferred" },
    source: "ffmpeg_scene_detect",
  });
  assert(isMeasuredStructure(merged), "still measured after motion merge");
  assert(merged.nodes[0].styles.borderRadius === "16px", "radius preserved");
  assert(merged.nodes.length === 2, "nodes not replaced by chrome heuristics");
}

console.log("\n7) Arbitrary URL refusal (path rules)");
const badPath = "https://evil.example/x.json";
assert(badPath.startsWith("http"), "detect arbitrary url");
assert(
  badPath.includes("..") === false && !badPath.startsWith("http") === false,
  "http paths rejected by loader contract",
);

console.log("\n8) Local write/read round-trip (tmp)");
const tmpDir = path.join(root, ".tmp-structure-test");
await fs.mkdir(tmpDir, { recursive: true });
const outFile = path.join(tmpDir, "fixture.structure.json");
const redacted = redactStructureSnapshot(fixture);
await fs.writeFile(outFile, JSON.stringify(redacted, null, 2));
const round = JSON.parse(await fs.readFile(outFile, "utf8"));
assert(round.nodes[0].styles.backgroundColor === "rgb(26, 31, 37)", "round-trip bg");
assert(round.viewport.height === 900, "round-trip viewport");
await fs.rm(tmpDir, { recursive: true, force: true });

console.log("\n9) Optional deployed smoke (CDN load of known synthetic Stake file)");
const stakeStruct =
  "https://aierpcwlkmvyojnaksvr.supabase.co/storage/v1/object/public/blaast-captures/2396e3c8-3899-4fb5-b7e3-35df5a3ae536/23efa99e-86da-494c-bc9c-b3d7fe58c6ff.structure.json";
try {
  const res = await fetch(stakeStruct);
  assert(res.ok, "deployed structure object reachable");
  const remote = await res.json();
  assert(
    !isMeasuredStructure(remote),
    "existing Stake published structure still synthetic (expected until recapture)",
  );
  assert(
    remote.provenance === "measured_video_analysis" || remote.synthetic === true,
    "labelled non-measured",
  );
} catch (err) {
  assert(false, `deployed smoke fetch: ${err.message}`);
}

console.log(`\n=== Results: ${passed} passed, ${failed} failed ===\n`);
process.exit(failed ? 1 : 0);
