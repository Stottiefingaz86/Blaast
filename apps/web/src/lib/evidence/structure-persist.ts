/**
 * Persist / load / classify structure snapshots for the evidence pipeline.
 * Measured extension snapshots must never be silently replaced by synthetic chrome.
 */

import { promises as fs } from "fs";
import path from "path";
import { capturesDir } from "@/lib/platform/data-dir";
import { storagePublicUrl } from "@/lib/storage/captures";

function capturesRoot() {
  return capturesDir();
}

export type StructureKind = "measured" | "synthetic" | "unknown" | "missing";

export type StructureLoadResult = {
  ok: boolean;
  kind: StructureKind;
  raw?: unknown;
  source: "local" | "remote" | "none";
  error?: string;
  highFidelityCapable: boolean;
};

const MAX_STRUCTURE_BYTES = 2_500_000;
const EMAIL_RE = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;
const LONG_HEX_RE = /\b0x[a-fA-F0-9]{20,}\b/g;
const CARDISH_RE = /\b(?:\d[ -]*?){13,19}\b/g;

/** True when snapshot looks like extension DOM capture (not video chrome heuristics). */
export function isMeasuredStructure(raw: unknown): boolean {
  if (!raw || typeof raw !== "object") return false;
  const s = raw as Record<string, unknown>;
  if (s.provenance === "measured_video_analysis") return false;
  if (s.synthetic === true) return false;
  if (typeof s.extractorVersion === "string" && s.extractorVersion.length > 0) {
    return true;
  }
  if (s.stylesAvailability === "dom" || s.stylesAvailability === "mixed") {
    return true;
  }
  const nodes = Array.isArray(s.nodes) ? s.nodes : [];
  const withStyles = nodes.filter(
    (n) =>
      n &&
      typeof n === "object" &&
      (n as { styles?: unknown }).styles &&
      typeof (n as { styles: unknown }).styles === "object",
  );
  return withStyles.length >= 1;
}

export function classifyStructure(raw: unknown | undefined | null): StructureKind {
  if (raw == null) return "missing";
  if (isMeasuredStructure(raw)) return "measured";
  if (
    raw &&
    typeof raw === "object" &&
    ((raw as { provenance?: string }).provenance === "measured_video_analysis" ||
      (raw as { synthetic?: boolean }).synthetic === true)
  ) {
    return "synthetic";
  }
  return "unknown";
}

export function highFidelityCapable(raw: unknown): boolean {
  return classifyStructure(raw) === "measured";
}

/** Soft schema check — rejects garbage without requiring a new DB schema. */
export function validateStructureSnapshot(raw: unknown): {
  ok: boolean;
  error?: string;
} {
  if (raw == null || typeof raw !== "object") {
    return { ok: false, error: "structure must be a JSON object" };
  }
  const s = raw as Record<string, unknown>;
  if (s.nodes != null && !Array.isArray(s.nodes)) {
    return { ok: false, error: "structure.nodes must be an array when present" };
  }
  if (Array.isArray(s.nodes)) {
    for (const n of s.nodes.slice(0, 200)) {
      if (!n || typeof n !== "object") {
        return { ok: false, error: "structure node must be an object" };
      }
      const box = (n as { box?: unknown }).box;
      if (box != null) {
        if (typeof box !== "object") {
          return { ok: false, error: "structure node.box must be an object" };
        }
        const b = box as Record<string, unknown>;
        for (const k of ["x", "y", "width", "height"]) {
          if (b[k] != null && typeof b[k] !== "number") {
            return { ok: false, error: `structure node.box.${k} must be a number` };
          }
        }
      }
    }
  }
  return { ok: true };
}

/** Redact emails / card-like / long hex from text previews before cloud upload. */
export function redactStructureSnapshot(raw: unknown): unknown {
  if (!raw || typeof raw !== "object") return raw;
  const clone = JSON.parse(JSON.stringify(raw)) as Record<string, unknown>;

  const scrub = (t: unknown): unknown => {
    if (typeof t !== "string") return t;
    return t
      .replace(EMAIL_RE, "[redacted-email]")
      .replace(CARDISH_RE, "[redacted-number]")
      .replace(LONG_HEX_RE, "[redacted-hex]");
  };

  if (typeof clone.documentTitle === "string") {
    clone.documentTitle = scrub(clone.documentTitle) as string;
  }
  if (clone.page && typeof clone.page === "object") {
    const page = clone.page as Record<string, unknown>;
    if (typeof page.title === "string") page.title = scrub(page.title);
  }
  if (Array.isArray(clone.nodes)) {
    for (const n of clone.nodes) {
      if (n && typeof n === "object") {
        const node = n as Record<string, unknown>;
        if (typeof node.textPreview === "string") {
          node.textPreview = scrub(node.textPreview) as string;
        }
      }
    }
  }
  return clone;
}

export function markSyntheticFallback(snap: Record<string, unknown>): Record<string, unknown> {
  return {
    ...snap,
    synthetic: true,
    highFidelityCapable: false,
    provenance: snap.provenance ?? "measured_video_analysis",
    dataQuality: "synthetic_fallback",
  };
}

/** Merge ffmpeg/video motion into a measured snapshot without replacing nodes. */
export function mergeMotionHintsIntoStructure(
  measured: unknown,
  motionHints: Array<{
    name: string;
    durationMs?: number;
    easing?: string;
    iterationCount?: string;
    source: string;
    targetHint?: string;
    atMs?: number;
  }>,
): unknown {
  if (!measured || typeof measured !== "object") return measured;
  const clone = JSON.parse(JSON.stringify(measured)) as Record<string, unknown>;
  const motion =
    clone.motion && typeof clone.motion === "object"
      ? (clone.motion as Record<string, unknown>)
      : {};
  const existing = Array.isArray(motion.animations) ? [...motion.animations] : [];
  const extras = motionHints.map((h) => ({
    targetHint: h.targetHint,
    name: { value: h.name, provenance: "inferred" as const },
    durationMs:
      h.durationMs != null
        ? { value: h.durationMs, provenance: "inferred" as const }
        : undefined,
    easing: h.easing
      ? { value: h.easing, provenance: "inferred" as const }
      : undefined,
    iterationCount: h.iterationCount
      ? { value: h.iterationCount, provenance: "inferred" as const }
      : undefined,
    source: h.source,
    atMs: h.atMs,
  }));
  motion.animations = [...existing, ...extras].slice(0, 60);
  clone.motion = motion;
  return clone;
}

/**
 * Load structure: local captures dir first, then authorised CDN object for same path.
 * Does not fetch arbitrary URLs.
 */
export async function loadStructureSnapshot(
  structurePath: string | undefined | null,
): Promise<StructureLoadResult> {
  if (!structurePath || structurePath.includes("..") || structurePath.startsWith("http")) {
    return {
      ok: false,
      kind: "missing",
      source: "none",
      error: structurePath?.startsWith("http")
        ? "refusing arbitrary remote URL"
        : "no structurePath",
      highFidelityCapable: false,
    };
  }

  const rel = structurePath.replace(/^\//, "");
  const localAbs = path.join(capturesRoot(), rel);

  try {
    const buf = await fs.readFile(localAbs);
    if (buf.byteLength > MAX_STRUCTURE_BYTES) {
      return {
        ok: false,
        kind: "unknown",
        source: "local",
        error: "structure file too large",
        highFidelityCapable: false,
      };
    }
    const raw = JSON.parse(buf.toString("utf8"));
    const v = validateStructureSnapshot(raw);
    if (!v.ok) {
      return {
        ok: false,
        kind: "unknown",
        source: "local",
        error: v.error,
        highFidelityCapable: false,
      };
    }
    const kind = classifyStructure(raw);
    return {
      ok: true,
      kind,
      raw,
      source: "local",
      highFidelityCapable: kind === "measured",
    };
  } catch {
    /* try remote */
  }

  const publicUrl = storagePublicUrl(rel);
  if (!publicUrl) {
    return {
      ok: false,
      kind: "missing",
      source: "none",
      error: "local missing and storage not configured",
      highFidelityCapable: false,
    };
  }

  try {
    const res = await fetch(publicUrl, { method: "GET" });
    if (!res.ok) {
      return {
        ok: false,
        kind: "missing",
        source: "remote",
        error: `remote structure HTTP ${res.status}`,
        highFidelityCapable: false,
      };
    }
    const text = await res.text();
    if (text.length > MAX_STRUCTURE_BYTES) {
      return {
        ok: false,
        kind: "unknown",
        source: "remote",
        error: "remote structure too large",
        highFidelityCapable: false,
      };
    }
    const raw = JSON.parse(text);
    const v = validateStructureSnapshot(raw);
    if (!v.ok) {
      return {
        ok: false,
        kind: "unknown",
        source: "remote",
        error: v.error,
        highFidelityCapable: false,
      };
    }
    const kind = classifyStructure(raw);
    return {
      ok: true,
      kind,
      raw,
      source: "remote",
      highFidelityCapable: kind === "measured",
    };
  } catch (err) {
    return {
      ok: false,
      kind: "missing",
      source: "remote",
      error: err instanceof Error ? err.message : "remote fetch failed",
      highFidelityCapable: false,
    };
  }
}

export async function writeAndUploadStructure(opts: {
  structureRel: string;
  snapshot: unknown;
  /** When true, throw/return error object if cloud upload fails while configured */
  requireCloudWhenConfigured?: boolean;
}): Promise<{
  ok: boolean;
  structurePath: string;
  cloudUploaded: boolean;
  error?: string;
  kind: StructureKind;
}> {
  const {
    validateStructureSnapshot: validate,
    redactStructureSnapshot: redact,
    classifyStructure: classify,
  } = {
    validateStructureSnapshot,
    redactStructureSnapshot,
    classifyStructure,
  };

  const v = validate(opts.snapshot);
  if (!v.ok) {
    return {
      ok: false,
      structurePath: opts.structureRel,
      cloudUploaded: false,
      error: v.error,
      kind: "unknown",
    };
  }

  const redacted = redact(opts.snapshot);
  const rel = opts.structureRel.replace(/^\//, "");
  const abs = path.join(capturesRoot(), rel);
  await fs.mkdir(path.dirname(abs), { recursive: true });
  const body = Buffer.from(JSON.stringify(redacted, null, 2), "utf8");
  if (body.byteLength > MAX_STRUCTURE_BYTES) {
    return {
      ok: false,
      structurePath: rel,
      cloudUploaded: false,
      error: "structure exceeds size limit after redact",
      kind: classify(redacted),
    };
  }
  await fs.writeFile(abs, body);

  let cloudUploaded = false;
  let cloudError: string | undefined;
  try {
    const { uploadCaptureBuffer } = await import("@/lib/storage/captures");
    const uploaded = await uploadCaptureBuffer({
      objectPath: rel,
      body,
      contentType: "application/json",
    });
    if (uploaded) {
      cloudUploaded = true;
    } else {
      // null = storage not configured OR upload failed (logged in uploadCaptureBuffer)
      const configured = Boolean(
        process.env.NEXT_PUBLIC_SUPABASE_URL &&
          (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY),
      );
      if (configured) {
        cloudError = "structure cloud upload failed";
        console.error("[writeAndUploadStructure]", cloudError, rel);
      }
    }
  } catch (err) {
    cloudError = err instanceof Error ? err.message : "structure cloud upload error";
    console.error("[writeAndUploadStructure]", cloudError);
  }

  if (cloudError && opts.requireCloudWhenConfigured) {
    return {
      ok: false,
      structurePath: rel,
      cloudUploaded: false,
      error: cloudError,
      kind: classify(redacted),
    };
  }

  return {
    ok: true,
    structurePath: rel,
    cloudUploaded,
    error: cloudError,
    kind: classify(redacted),
  };
}
