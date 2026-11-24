import { promises as fs } from "fs";
import path from "path";
import { capturesDir } from "@/lib/platform/data-dir";

const BUCKET = "blaast-captures";

function supabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) return null;
  return { url, key };
}

export function storagePublicUrl(objectPath: string): string | null {
  const cfg = supabaseConfig();
  if (!cfg) return null;
  return `${cfg.url}/storage/v1/object/public/${BUCKET}/${objectPath.replace(/^\//, "")}`;
}

export { artifactPublicUrl } from "@/lib/storage/public-url";

/**
 * Upload bytes to Supabase Storage. Returns the object path on success.
 */
export async function uploadCaptureBuffer(opts: {
  objectPath: string;
  body: Buffer | Uint8Array;
  contentType: string;
}): Promise<string | null> {
  const cfg = supabaseConfig();
  if (!cfg) return null;
  const objectPath = opts.objectPath.replace(/^\//, "");
  const res = await fetch(
    `${cfg.url}/storage/v1/object/${BUCKET}/${objectPath}`,
    {
      method: "POST",
      headers: {
        apikey: cfg.key,
        Authorization: `Bearer ${cfg.key}`,
        "Content-Type": opts.contentType,
        "x-upsert": "true",
      },
      body: new Uint8Array(opts.body),
    },
  );
  if (!res.ok) {
    const text = await res.text();
    console.error("[storage upload]", res.status, objectPath, text.slice(0, 200));
    return null;
  }
  return objectPath;
}

/**
 * Upload a local capture file to Supabase Storage.
 * Returns the object path (relative) on success.
 */
export async function uploadCaptureObject(opts: {
  objectPath: string;
  absolutePath: string;
  contentType: string;
}): Promise<string | null> {
  let body: Buffer;
  try {
    body = await fs.readFile(opts.absolutePath);
  } catch {
    return null;
  }
  return uploadCaptureBuffer({
    objectPath: opts.objectPath,
    body,
    contentType: opts.contentType,
  });
}

/**
 * Mint a short-lived signed upload URL so the browser can PUT video
 * directly to Storage (bypasses Vercel’s ~4.5MB request body limit).
 */
export async function createSignedCaptureUpload(opts: {
  objectPath: string;
}): Promise<{ path: string; signedUrl: string; token: string } | null> {
  const cfg = supabaseConfig();
  if (!cfg) return null;
  const objectPath = opts.objectPath.replace(/^\//, "");
  const res = await fetch(
    `${cfg.url}/storage/v1/object/upload/sign/${BUCKET}/${objectPath}`,
    {
      method: "POST",
      headers: {
        apikey: cfg.key,
        Authorization: `Bearer ${cfg.key}`,
        "Content-Type": "application/json",
      },
      body: "{}",
    },
  );
  if (!res.ok) {
    console.error(
      "[storage sign upload]",
      res.status,
      objectPath,
      (await res.text()).slice(0, 200),
    );
    return null;
  }
  const data = (await res.json()) as {
    url?: string;
    Url?: string;
    signedUrl?: string;
    token?: string;
    Token?: string;
  };
  const rawUrl = data.url || data.Url || data.signedUrl;
  const token = data.token || data.Token;
  if (!rawUrl || !token) return null;
  const signedUrl = rawUrl.startsWith("http")
    ? rawUrl
    : `${cfg.url}/storage/v1${rawUrl.startsWith("/") ? "" : "/"}${rawUrl}`;
  return { path: objectPath, signedUrl, token };
}

/** Upload video + poster for a published artifact; returns public URLs. */
export async function uploadPublishedMedia(opts: {
  sessionId: string;
  artifactId: string;
  videoPath?: string;
  posterPath?: string;
}): Promise<{ videoUrl?: string; posterUrl?: string }> {
  const root = capturesDir();
  const out: { videoUrl?: string; posterUrl?: string } = {};

  if (opts.videoPath) {
    const abs = path.join(root, opts.videoPath);
    const ext = opts.videoPath.endsWith(".mp4") ? "mp4" : "webm";
    const objectPath = `${opts.sessionId}/${opts.artifactId}.${ext}`;
    const uploaded = await uploadCaptureObject({
      objectPath,
      absolutePath: abs,
      contentType: ext === "mp4" ? "video/mp4" : "video/webm",
    });
    if (uploaded) {
      const url = storagePublicUrl(uploaded);
      if (url) out.videoUrl = url;
    }
  }

  if (opts.posterPath) {
    const abs = path.join(root, opts.posterPath);
    const ext = opts.posterPath.endsWith(".jpg") ? "jpg" : "png";
    const objectPath = `${opts.sessionId}/${opts.artifactId}.${ext}`;
    const uploaded = await uploadCaptureObject({
      objectPath,
      absolutePath: abs,
      contentType: ext === "jpg" ? "image/jpeg" : "image/png",
    });
    if (uploaded) {
      const url = storagePublicUrl(uploaded);
      if (url) out.posterUrl = url;
    }
  }

  return out;
}

export function isHttpUrl(value?: string | null): boolean {
  return Boolean(value && /^https?:\/\//i.test(value));
}
