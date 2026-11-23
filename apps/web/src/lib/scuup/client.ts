/**
 * Read-only client for the shared Scuup / Surchly Supabase project.
 * Credentials: NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SECRET_KEY (or service role).
 */

export function scuupConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  const key =
    process.env.SUPABASE_SECRET_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY;
  return { url, key };
}

export function scuupConfigured() {
  const { url, key } = scuupConfig();
  return Boolean(url && key);
}

export async function scuupRest<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const { url, key } = scuupConfig();
  if (!url || !key) {
    throw new Error("Scuup Supabase env not configured");
  }
  const res = await fetch(`${url}/rest/v1/${path.replace(/^\//, "")}`, {
    ...init,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      Accept: "application/json",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Scuup REST ${res.status}: ${text.slice(0, 240)}`);
  }
  return (await res.json()) as T;
}
