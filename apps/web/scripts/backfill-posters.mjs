/**
 * Download WebMs missing cloud posters, extract a still, upload PNG,
 * patch published-index (+ optional Postgres) with posterUrl/videoUrl.
 */
import { execFile } from "node:child_process";
import { promises as fs } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { readFileSync } from "node:fs";

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
      /* missing */
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

async function fetchIndex() {
  const res = await fetch(
    `${url}/storage/v1/object/public/${BUCKET}/published-index.json?t=${Date.now()}`,
  );
  if (!res.ok) throw new Error(`index ${res.status}`);
  return res.json();
}

async function uploadIndex(rows) {
  const res = await fetch(
    `${url}/storage/v1/object/${BUCKET}/published-index.json`,
    {
      method: "POST",
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        "x-upsert": "true",
      },
      body: JSON.stringify(rows),
    },
  );
  if (!res.ok) throw new Error(`upload index ${res.status} ${await res.text()}`);
}

async function objectExists(objectPath) {
  const res = await fetch(publicObject(objectPath), { method: "HEAD" });
  return res.ok;
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

async function extractStill(webmPath, pngPath, atMs) {
  const atSec = Math.max(0.2, (atMs || 500) / 1000);
  await execFileAsync(
    "ffmpeg",
    [
      "-y",
      "-ss",
      atSec.toFixed(3),
      "-i",
      webmPath,
      "-frames:v",
      "1",
      "-q:v",
      "3",
      pngPath,
    ],
    { timeout: 90_000 },
  );
  const st = await fs.stat(pngPath);
  return st.size > 800;
}

async function main() {
  const args = process.argv.slice(2);
  const force = args.includes("--force");
  const onlyHost = args.find((a) => !a.startsWith("--"))?.toLowerCase(); // e.g. rainbet.com
  const rows = await fetchIndex();
  const work = [];
  for (const rec of rows) {
    if (onlyHost && !(rec.operatorHostname || "").toLowerCase().includes(onlyHost.replace(/^www\./, ""))) {
      continue;
    }
    const videoPath = rec.videoPath;
    if (!videoPath || /^https?:/i.test(videoPath)) continue;
    const hasPoster =
      !force &&
      ((rec.posterUrl && /^https?:/i.test(rec.posterUrl)) ||
        (rec.posterPath && (await objectExists(rec.posterPath))));
    const hasVideo =
      (rec.videoUrl && /^https?:/i.test(rec.videoUrl)) ||
      (await objectExists(videoPath));
    if (!hasVideo) {
      console.log("skip no video", rec.coverageStepId, videoPath);
      continue;
    }
    // Always stamp CDN videoUrl
    rec.videoUrl = publicObject(videoPath);
    if (hasPoster) {
      if (rec.posterPath && !rec.posterUrl) {
        rec.posterUrl = publicObject(rec.posterPath);
      }
      continue;
    }
    work.push(rec);
  }

  console.log(`Need posters: ${work.length}`);
  const dir = await fs.mkdtemp(path.join(tmpdir(), "blaast-poster-"));
  let ok = 0;
  for (const rec of work) {
    const videoPath = rec.videoPath;
    const posterRel = videoPath.replace(/\.webm$/i, ".png");
    const localWebm = path.join(dir, path.basename(videoPath));
    const localPng = path.join(dir, path.basename(posterRel));
    try {
      const vidRes = await fetch(publicObject(videoPath));
      if (!vidRes.ok) throw new Error(`download ${vidRes.status}`);
      await fs.writeFile(localWebm, Buffer.from(await vidRes.arrayBuffer()));
      // Prefer a later frame — signup/event clips often still show Home at t=0
      const start = rec.clipWindow?.startMs ?? 0;
      const end = rec.clipWindow?.endMs ?? start + 12000;
      const span = Math.max(800, end - start);
      const step = String(rec.coverageStepId || rec.instruction || "");
      let atMs = start + span * 0.45;
      if (/signup-steps|register|form/i.test(step)) atMs = start + span * 0.7;
      else if (/bet-event|lobby|game|betslip|promo|vip/i.test(step))
        atMs = start + span * 0.4;
      else if (!rec.clipWindow) atMs = 2500;
      const extracted = await extractStill(localWebm, localPng, atMs);
      if (!extracted) throw new Error("ffmpeg empty");
      const bytes = await fs.readFile(localPng);
      await uploadBytes(posterRel, bytes, "image/png");
      rec.posterPath = posterRel;
      rec.posterUrl = publicObject(posterRel);
      ok++;
      console.log("ok", rec.coverageStepId, posterRel);
    } catch (err) {
      console.error("fail", rec.coverageStepId, err.message || err);
      // Still expose video for CaptureMedia fallback
      rec.videoUrl = publicObject(videoPath);
    }
  }

  await uploadIndex(rows);
  // Also write local cache if present
  try {
    const local = path.join(process.cwd(), ".data", "published-clips.json");
    await fs.mkdir(path.dirname(local), { recursive: true });
    await fs.writeFile(local, JSON.stringify(rows, null, 2));
  } catch {
    /* ignore */
  }
  console.log(`Done. Extracted ${ok}/${work.length}. Index updated.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
