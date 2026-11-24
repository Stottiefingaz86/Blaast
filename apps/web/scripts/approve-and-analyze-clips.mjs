/**
 * Approve pending nav/home clips (Stake first), extract posters + MCP thumbs,
 * run ffmpeg scene/motion analysis, derive header/side_nav crops, update
 * published-index + session JSON in Supabase.
 *
 * Usage:
 *   node scripts/approve-and-analyze-clips.mjs
 *   node scripts/approve-and-analyze-clips.mjs stake.com
 *   node scripts/approve-and-analyze-clips.mjs --all-motion
 */
import { execFile } from "node:child_process";
import { promises as fs } from "node:fs";
import { readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

function loadEnv() {
  for (const p of [".env.local", ".env"]) {
    try {
      for (const line of readFileSync(p, "utf8").split("\n")) {
        const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
        if (!m) continue;
        let v = m[2].trim();
        if (
          (v.startsWith('"') && v.endsWith('"')) ||
          (v.startsWith("'") && v.endsWith("'"))
        )
          v = v.slice(1, -1);
        if (!process.env[m[1]]) process.env[m[1]] = v;
      }
    } catch {
      /* */
    }
  }
}
loadEnv();

const url = (process.env.NEXT_PUBLIC_SUPABASE_URL || "").replace(/\/$/, "");
const key =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
const BUCKET = "blaast-captures";

if (!url || !key) {
  console.error("Need NEXT_PUBLIC_SUPABASE_URL + service role key");
  process.exit(1);
}

function publicObject(objectPath) {
  return `${url}/storage/v1/object/public/${BUCKET}/${objectPath.replace(/^\//, "")}`;
}

async function uploadBytes(objectPath, bytes, contentType) {
  const res = await fetch(
    `${url}/storage/v1/object/${BUCKET}/${objectPath.replace(/^\//, "")}`,
    {
      method: "POST",
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        "Content-Type": contentType,
        "x-upsert": "true",
      },
      body: bytes,
    },
  );
  if (!res.ok) throw new Error(`upload ${objectPath} ${res.status}`);
}

async function uploadJson(objectPath, data) {
  await uploadBytes(
    objectPath,
    Buffer.from(JSON.stringify(data, null, 2)),
    "application/json",
  );
}

async function fetchIndex() {
  const res = await fetch(
    `${url}/storage/v1/object/public/${BUCKET}/published-index.json?t=${Date.now()}`,
  );
  if (!res.ok) throw new Error(`index ${res.status}`);
  return res.json();
}

async function extractStill(webmPath, pngPath, atMs) {
  const atSec = Math.max(0.3, (atMs || 800) / 1000);
  await execFileAsync(
    "ffmpeg",
    ["-y", "-ss", atSec.toFixed(3), "-i", webmPath, "-frames:v", "1", "-q:v", "2", pngPath],
    { timeout: 90_000 },
  );
  const st = await fs.stat(pngPath);
  return st.size > 800;
}

async function makeMcpJpg(pngPath, jpgPath) {
  await execFileAsync(
    "ffmpeg",
    ["-y", "-i", pngPath, "-vf", "scale=960:-2", "-q:v", "6", jpgPath],
    { timeout: 30_000 },
  );
}

async function analyzeScenes(webmPath) {
  const cuts = [];
  try {
    const { stderr } = await execFileAsync(
      "ffmpeg",
      ["-i", webmPath, "-filter:v", "select='gt(scene,0.25)',showinfo", "-f", "null", "-"],
      { timeout: 120_000, maxBuffer: 8 * 1024 * 1024 },
    );
    const re = /pts_time:([0-9.]+)/g;
    let m;
    while ((m = re.exec(stderr))) cuts.push(Math.round(Number(m[1]) * 1000));
  } catch (err) {
    const msg = String(err?.stderr || "");
    const re = /pts_time:([0-9.]+)/g;
    let m;
    while ((m = re.exec(msg))) cuts.push(Math.round(Number(m[1]) * 1000));
  }
  return [...new Set(cuts)].sort((a, b) => a - b);
}

function chromeRegions() {
  return [
    { role: "header", box: { x: 0, y: 0, width: 100, height: 7.5 }, note: "Top header" },
    { role: "side_nav", box: { x: 0, y: 7.5, width: 17, height: 92.5 }, note: "Left side nav" },
    { role: "main", box: { x: 17, y: 7.5, width: 83, height: 92.5 }, note: "Main stage" },
  ];
}

async function cropRegion(pngPath, outPath, box) {
  const { x, y, width, height } = box;
  await execFileAsync(
    "ffmpeg",
    [
      "-y",
      "-i",
      pngPath,
      "-vf",
      `crop=iw*${width / 100}:ih*${height / 100}:iw*${x / 100}:ih*${y / 100}`,
      "-frames:v",
      "1",
      outPath,
    ],
    { timeout: 30_000 },
  );
  const st = await fs.stat(outPath);
  return st.size > 800;
}

const PRIORITY_COV = new Set([
  "ui-side-nav",
  "ui-header",
  "ui-tab-bar",
  "scr-home",
  "scr-casino-lobby",
]);

async function processArtifact(session, art, dir, rows) {
  if (!art.videoPath) return null;
  const videoPath = art.videoPath;
  const localWebm = path.join(dir, `${art.id}.webm`);
  const posterRel = videoPath.replace(/\.webm$/i, ".png");
  const mcpRel = posterRel.replace(/\.png$/i, ".mcp.jpg");
  const localPng = path.join(dir, `${art.id}.png`);
  const localJpg = path.join(dir, `${art.id}.mcp.jpg`);

  const vidRes = await fetch(publicObject(videoPath));
  if (!vidRes.ok) throw new Error(`download video ${vidRes.status}`);
  await fs.writeFile(localWebm, Buffer.from(await vidRes.arrayBuffer()));

  const atMs = art.clipWindow?.startMs != null ? art.clipWindow.startMs + 500 : 1200;
  await extractStill(localWebm, localPng, atMs);
  await makeMcpJpg(localPng, localJpg);
  await uploadBytes(posterRel, await fs.readFile(localPng), "image/png");
  await uploadBytes(mcpRel, await fs.readFile(localJpg), "image/jpeg");

  const cuts = await analyzeScenes(localWebm);
  const motionHints = cuts.slice(0, 24).map((t, i) => ({
    name: i === 0 ? "first_paint_or_transition" : "scene_transition",
    durationMs: 400,
    easing: "ease-out",
    source: "ffmpeg_scene_detect",
    targetHint: "viewport",
    atMs: t,
  }));
  if (art.durationMs) {
    motionHints.push({
      name: "clip_window",
      durationMs: art.durationMs,
      source: "capture_duration",
      targetHint: "full_clip",
      atMs: 0,
    });
  }

  const wantChrome = /lobby|home|side.?nav|header|tab.?bar|casino|sports/i.test(
    art.coverageStepId,
  );
  const regions = wantChrome ? chromeRegions() : [];
  const structureRel = `${session.id}/${art.id}.structure.json`;

  // Never overwrite measured extension DOM/CSS with synthetic chrome.
  let existingMeasured = false;
  try {
    const existingRes = await fetch(publicObject(structureRel));
    if (existingRes.ok) {
      const existing = await existingRes.json();
      const measured =
        existing &&
        typeof existing === "object" &&
        existing.provenance !== "measured_video_analysis" &&
        existing.synthetic !== true &&
        (Boolean(existing.extractorVersion) ||
          existing.stylesAvailability === "dom" ||
          existing.stylesAvailability === "mixed" ||
          (Array.isArray(existing.nodes) &&
            existing.nodes.some((n) => n && n.styles && typeof n.styles === "object")));
      if (measured) {
        existingMeasured = true;
        const motion = existing.motion && typeof existing.motion === "object" ? existing.motion : {};
        const animations = Array.isArray(motion.animations) ? [...motion.animations] : [];
        for (const h of motionHints) {
          animations.push({
            targetHint: h.targetHint,
            name: { value: h.name, provenance: "inferred" },
            durationMs: { value: h.durationMs, provenance: "inferred" },
            easing: h.easing ? { value: h.easing, provenance: "inferred" } : {},
            source: h.source,
            atMs: h.atMs,
          });
        }
        existing.motion = { ...motion, animations: animations.slice(0, 60) };
        await uploadJson(structureRel, existing);
        console.log("preserved measured structure", art.id);
      }
    }
  } catch {
    /* no existing */
  }

  if (!existingMeasured) {
    const structure = {
      provenance: "measured_video_analysis",
      synthetic: true,
      highFidelityCapable: false,
      dataQuality: "synthetic_fallback",
      page: art.pageUrl ? { url: art.pageUrl } : undefined,
      nodes: regions.map((r, i) => ({
        nodeId: `chrome-${r.role}-${i}`,
        tag: "nav",
        role: r.role,
        selectorHint: `[data-blaast-role="${r.role}"]`,
        textPreview: r.note,
        box: { x: r.box.x, y: r.box.y, width: r.box.width, height: r.box.height },
      })),
      motion: {
        animations: motionHints.map((h) => ({
          targetHint: h.targetHint,
          name: { value: h.name },
          durationMs: { value: h.durationMs },
          easing: { value: h.easing },
          source: h.source,
          atMs: h.atMs,
        })),
      },
    };
    await uploadJson(structureRel, structure);
  }

  const anns = [...(art.annotations || [])];
  if (wantChrome) {
    for (const region of regions.filter((r) => r.role === "header" || r.role === "side_nav")) {
      if (anns.some((a) => a.tag === region.role)) continue;
      const cropRel = `${session.id}/${art.id}-${region.role}.png`;
      const cropLocal = path.join(dir, `${art.id}-${region.role}.png`);
      const ok = await cropRegion(localPng, cropLocal, region.box);
      if (!ok) continue;
      await uploadBytes(cropRel, await fs.readFile(cropLocal), "image/png");
      const mcpCrop = cropRel.replace(/\.png$/i, ".mcp.jpg");
      const mcpLocal = path.join(dir, `${art.id}-${region.role}.mcp.jpg`);
      await makeMcpJpg(cropLocal, mcpLocal);
      await uploadBytes(mcpCrop, await fs.readFile(mcpLocal), "image/jpeg");
      anns.push({
        id: `${art.id}-${region.role}`,
        label: region.role === "header" ? "Header" : "Side navigation",
        tag: region.role,
        atMs: atMs,
        region: { x: region.box.x, y: region.box.y, w: region.box.width, h: region.box.height },
        posterPath: cropRel,
        publishElement: true,
        createdAt: new Date().toISOString(),
      });
    }
  }

  art.reviewStatus = "approved";
  art.posterPath = posterRel;
  art.structurePath = structureRel;
  art.annotations = anns;

  const covTags = []; // filled from coverage in index
  const record = {
    id: `pub-${art.id}`,
    sessionId: session.id,
    artifactId: art.id,
    operatorId: session.operatorId,
    operatorHostname: session.operatorHostname || session.hostname || "unknown",
    operatorName: session.operatorName || "Unknown",
    coverageStepId: art.coverageStepId,
    instruction: art.coverageStepId,
    taxonomy: art.coverageStepId.startsWith("ui-") ? "ui_element" : "screen",
    tags: [
      ...new Set([
        ...(art.coverageStepId === "ui-side-nav" ? ["side_nav", "global_nav"] : []),
        ...(art.coverageStepId === "ui-header" ? ["header", "cta"] : []),
        ...(art.coverageStepId === "ui-tab-bar" ? ["tab_bar", "global_nav"] : []),
        ...(art.coverageStepId === "scr-home" ? ["home", "landing"] : []),
        ...anns.map((a) => a.tag),
      ]),
    ],
    annotations: anns,
    durationMs: art.durationMs,
    pageUrl: art.pageUrl,
    platform: session.platform || "web",
    market: session.market,
    videoPath,
    posterPath: posterRel,
    structurePath: structureRel,
    videoUrl: publicObject(videoPath),
    posterUrl: publicObject(posterRel),
    mcpPosterUrl: publicObject(mcpRel),
    clipWindow: art.clipWindow,
    reviewStatus: "approved",
    publishedAt: new Date().toISOString(),
    evidenceId: `ev-rec-${session.id}-${art.coverageStepId}`,
  };

  const existing = rows.findIndex((r) => r.artifactId === art.id);
  if (existing >= 0) rows[existing] = { ...rows[existing], ...record };
  else rows.push(record);

  // Also publish annotation-level hits as searchable (header/side_nav crops)
  for (const ann of anns) {
    if (!ann.posterPath) continue;
    if (!/^(header|side_nav)$/.test(ann.tag)) continue;
    const elId = `${art.id}-el-${ann.id}`;
    const elRec = {
      ...record,
      id: `pub-${elId}`,
      artifactId: art.id,
      coverageStepId: art.coverageStepId,
      instruction: ann.label,
      taxonomy: "ui_element",
      tags: [...new Set([ann.tag, ...(record.tags || [])])],
      posterPath: ann.posterPath,
      posterUrl: publicObject(ann.posterPath),
      mcpPosterUrl: publicObject(ann.posterPath.replace(/\.png$/i, ".mcp.jpg")),
      evidenceId: `ev-rec-${session.id}-${art.coverageStepId}#${ann.id}`,
      annotations: [ann],
    };
    // Don't duplicate whole-clip rows — element stills live as annotations on the beat
    void elRec;
  }

  console.log(
    "ok",
    record.operatorHostname,
    art.coverageStepId,
    `cuts=${cuts.length}`,
    `anns=${anns.length}`,
  );
  return record;
}

async function main() {
  const args = process.argv.slice(2);
  const onlyHost = args.find((a) => !a.startsWith("--"))?.toLowerCase();
  const allMotion = args.includes("--all-motion");
  const dir = await fs.mkdtemp(path.join(tmpdir(), "blaast-analyze-"));
  const rows = await fetchIndex();

  // Find sessions: from published rows + known stake session
  const sessionIds = new Set(rows.map((r) => r.sessionId).filter(Boolean));
  sessionIds.add("2396e3c8-3899-4fb5-b7e3-35df5a3ae536");

  for (const sid of sessionIds) {
    const res = await fetch(
      `${url}/storage/v1/object/public/${BUCKET}/sessions/${sid}.json?t=${Date.now()}`,
    );
    if (!res.ok) continue;
    const session = await res.json();
    const host = String(
      session.operatorHostname ||
        rows.find((r) => r.sessionId === sid)?.operatorHostname ||
        "",
    ).toLowerCase();
    if (onlyHost && !host.includes(onlyHost.replace(/^www\./, ""))) continue;

    // Attach host/name onto session for records
    const sample = rows.find((r) => r.sessionId === sid);
    session.operatorHostname = sample?.operatorHostname || host || "unknown";
    session.operatorName = sample?.operatorName || session.operatorName || "Unknown";

    const arts = session.artifacts || [];
    for (const art of arts) {
      const isPendingNav =
        art.reviewStatus !== "approved" && PRIORITY_COV.has(art.coverageStepId);
      const isApprovedNeedMotion =
        allMotion && art.reviewStatus === "approved" && art.videoPath;
      const isStakePending =
        host.includes("stake") &&
        art.reviewStatus !== "approved" &&
        art.videoPath &&
        (PRIORITY_COV.has(art.coverageStepId) ||
          /side|header|tab|home|lobby/i.test(art.coverageStepId));

      if (!(isPendingNav || isApprovedNeedMotion || isStakePending)) continue;
      if (!art.videoPath) continue;

      try {
        await processArtifact(session, art, dir, rows);
      } catch (err) {
        console.error("fail", art.coverageStepId, err.message || err);
      }
    }

    // Persist session with approved statuses
    await uploadJson(`sessions/${sid}.json`, session);
  }

  await uploadJson("published-index.json", rows);
  console.log(`Done. Published index rows=${rows.length}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
