const BUCKET = "blaast-captures";

/**
 * Client-safe public CDN URL for a capture object path.
 * Prefer over `/api/admin/.../artifacts?file=` (avoids Vercel proxy lag).
 */
export function artifactPublicUrl(
  objectPath?: string | null,
): string | undefined {
  if (!objectPath) return undefined;
  if (/^https?:\/\//i.test(objectPath)) return objectPath;
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  if (!base) return undefined;
  return `${base}/storage/v1/object/public/${BUCKET}/${objectPath.replace(/^\//, "")}`;
}
