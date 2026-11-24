import { execFile } from "child_process";
import { promises as fs } from "fs";
import path from "path";
import { promisify } from "util";

const execFileAsync = promisify(execFile);

export type AnalyzedMotionHint = {
  name: string;
  durationMs?: number;
  easing?: string;
  iterationCount?: string;
  source: string;
  targetHint?: string;
  atMs?: number;
};

export type AnalyzedChromeRegion = {
  role: "header" | "side_nav" | "main" | "footer";
  box: { x: number; y: number; width: number; height: number };
  note: string;
};

/**
 * Analyze a capture WebM for scene cuts / transitions (ffmpeg).
 * Used on publish so every brand gets motion hints for MCP rebuilds.
 */
export async function analyzeVideoMotion(opts: {
  videoAbsPath: string;
  durationMs?: number;
}): Promise<{
  motionHints: AnalyzedMotionHint[];
  sceneCutsMs: number[];
}> {
  const sceneCutsMs: number[] = [];
  try {
    // Detect scene changes — stdout lines like: pts_time:1.234
    const { stderr } = await execFileAsync(
      "ffmpeg",
      [
        "-i",
        opts.videoAbsPath,
        "-filter:v",
        "select='gt(scene,0.25)',showinfo",
        "-f",
        "null",
        "-",
      ],
      { timeout: 120_000, maxBuffer: 8 * 1024 * 1024 },
    );
    const re = /pts_time:([0-9.]+)/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(stderr))) {
      const sec = Number(m[1]);
      if (Number.isFinite(sec)) sceneCutsMs.push(Math.round(sec * 1000));
    }
  } catch (err) {
    // ffmpeg writes showinfo to stderr even on "failure" exit sometimes
    const msg = err && typeof err === "object" && "stderr" in err
      ? String((err as { stderr?: string }).stderr ?? "")
      : "";
    const re = /pts_time:([0-9.]+)/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(msg))) {
      const sec = Number(m[1]);
      if (Number.isFinite(sec)) sceneCutsMs.push(Math.round(sec * 1000));
    }
    if (!sceneCutsMs.length) {
      console.error("[analyzeVideoMotion]", err);
    }
  }

  const uniqueCuts = [...new Set(sceneCutsMs)].sort((a, b) => a - b);
  const motionHints: AnalyzedMotionHint[] = uniqueCuts.slice(0, 24).map((atMs, i) => {
    const next = uniqueCuts[i + 1];
    const durationMs =
      next != null
        ? Math.min(1200, Math.max(180, next - atMs))
        : 400;
    return {
      name: i === 0 ? "first_paint_or_transition" : "scene_transition",
      durationMs,
      easing: "ease-out",
      source: "ffmpeg_scene_detect",
      targetHint: "viewport",
      atMs,
    };
  });

  // Always note continuous capture window for hover/scroll rebuilds
  if (opts.durationMs && opts.durationMs > 800) {
    motionHints.push({
      name: "clip_window",
      durationMs: opts.durationMs,
      source: "capture_duration",
      targetHint: "full_clip",
      atMs: 0,
    });
  }

  return { motionHints, sceneCutsMs: uniqueCuts };
}

/**
 * Default chrome regions for desktop casino shells (percent boxes).
 * Used when structure DOM wasn't captured — still gives agents header/side_nav.
 */
export function defaultDesktopChromeRegions(): AnalyzedChromeRegion[] {
  return [
    {
      role: "header",
      box: { x: 0, y: 0, width: 100, height: 7.5 },
      note: "Top header: menu, product icons, logo, wallet, utilities",
    },
    {
      role: "side_nav",
      box: { x: 0, y: 7.5, width: 17, height: 92.5 },
      note: "Left side navigation / nested casino browse",
    },
    {
      role: "main",
      box: { x: 17, y: 7.5, width: 83, height: 92.5 },
      note: "Main content stage",
    },
  ];
}

/** Crop a region from a full-frame PNG into a new PNG (ffmpeg). */
export async function cropPosterRegion(opts: {
  posterAbsPath: string;
  outAbsPath: string;
  /** Percent box 0–100 */
  box: { x: number; y: number; width: number; height: number };
}): Promise<boolean> {
  await fs.mkdir(path.dirname(opts.outAbsPath), { recursive: true });
  const { x, y, width, height } = opts.box;
  try {
    await execFileAsync(
      "ffmpeg",
      [
        "-y",
        "-i",
        opts.posterAbsPath,
        "-vf",
        `crop=iw*${(width / 100).toFixed(4)}:ih*${(height / 100).toFixed(4)}:iw*${(x / 100).toFixed(4)}:ih*${(y / 100).toFixed(4)}`,
        "-frames:v",
        "1",
        opts.outAbsPath,
      ],
      { timeout: 30_000 },
    );
    const st = await fs.stat(opts.outAbsPath);
    return st.size > 800;
  } catch (err) {
    console.error("[cropPosterRegion]", err);
    return false;
  }
}

/** Build a structure snapshot agents can load via get_evidence. */
export function buildMotionStructureSnapshot(opts: {
  pageUrl?: string;
  viewport?: { width: number; height: number };
  motionHints: AnalyzedMotionHint[];
  chromeRegions?: AnalyzedChromeRegion[];
}) {
  return {
    provenance: "measured_video_analysis",
    page: opts.pageUrl ? { url: opts.pageUrl } : undefined,
    viewport: opts.viewport,
    nodes: (opts.chromeRegions ?? defaultDesktopChromeRegions()).map((r, i) => ({
      nodeId: `chrome-${r.role}-${i}`,
      tag: "nav",
      role: r.role,
      selectorHint: `[data-blaast-role="${r.role}"]`,
      textPreview: r.note,
      box: {
        x: r.box.x,
        y: r.box.y,
        width: r.box.width,
        height: r.box.height,
      },
    })),
    motion: {
      animations: opts.motionHints.map((h) => ({
        targetHint: h.targetHint,
        name: { value: h.name },
        durationMs: { value: h.durationMs },
        easing: { value: h.easing },
        iterationCount: { value: h.iterationCount },
        source: h.source,
        atMs: h.atMs,
      })),
    },
  };
}
