import { scuupConfig } from "@/lib/scuup/client";
import type { PlatformUser } from "@/lib/platform/users-store";

/** Private bucket — never expose password hashes via /object/public. */
const BUCKET = "blaast-private";
const OBJECT_PATH = "platform-users.json";

type UsersFile = { users: PlatformUser[] };

function empty(): UsersFile {
  return { users: [] };
}

export function mergeUsersFiles(...files: UsersFile[]): UsersFile {
  const byId = new Map<string, PlatformUser>();
  const byEmail = new Map<string, string>(); // email → id

  for (const file of files) {
    for (const u of file.users ?? []) {
      if (!u?.id || !u?.email) continue;
      const email = u.email.trim().toLowerCase();
      const existingId = byEmail.get(email);
      const prev = existingId ? byId.get(existingId) : byId.get(u.id);

      if (!prev) {
        byId.set(u.id, { ...u, email });
        byEmail.set(email, u.id);
        continue;
      }

      // Prefer whichever was more recently active / created
      const prevTouch = prev.lastLoginAt || prev.createdAt || "";
      const nextTouch = u.lastLoginAt || u.createdAt || "";
      const newer = nextTouch >= prevTouch ? u : prev;
      const older = newer === u ? prev : u;

      const merged: PlatformUser = {
        ...older,
        ...newer,
        email,
        // Keep a real password hash if the newer OAuth stub overwrote it empty-style
        passwordHash: newer.passwordHash || older.passwordHash,
        mcpActivatedAt: newer.mcpActivatedAt || older.mcpActivatedAt,
        mcpConnectionCount: Math.max(
          newer.mcpConnectionCount ?? 0,
          older.mcpConnectionCount ?? 0,
        ),
        createdAt:
          (older.createdAt || "") <= (newer.createdAt || "")
            ? older.createdAt || newer.createdAt
            : newer.createdAt || older.createdAt,
      };

      // Drop duplicate id if email collided across ids
      if (prev.id !== u.id) {
        byId.delete(prev.id);
      }
      byId.set(merged.id, merged);
      byEmail.set(email, merged.id);
    }
  }

  return {
    users: [...byId.values()].sort((a, b) =>
      (b.createdAt || "").localeCompare(a.createdAt || ""),
    ),
  };
}

export async function fetchUsersCloud(): Promise<UsersFile> {
  const { url, key } = scuupConfig();
  if (!url || !key) return empty();
  try {
    const res = await fetch(
      `${url}/storage/v1/object/${BUCKET}/${OBJECT_PATH}`,
      {
        headers: {
          apikey: key,
          Authorization: `Bearer ${key}`,
        },
        cache: "no-store",
      },
    );
    if (res.status === 404) return empty();
    const text = await res.text();
    if (!res.ok) {
      // Empty private object often returns 400 NoSuchKey
      if (res.status === 400 && /NoSuchKey|not_found/i.test(text)) {
        return empty();
      }
      console.error("[users-cloud fetch]", res.status, text.slice(0, 200));
      return empty();
    }
    const parsed = JSON.parse(text) as UsersFile;
    if (!parsed || !Array.isArray(parsed.users)) return empty();
    return parsed;
  } catch (err) {
    console.error("[users-cloud fetch]", err);
    return empty();
  }
}

export async function uploadUsersCloud(data: UsersFile): Promise<void> {
  const { url, key } = scuupConfig();
  if (!url || !key) return;
  const body = JSON.stringify({ users: data.users ?? [] });
  const res = await fetch(
    `${url}/storage/v1/object/${BUCKET}/${OBJECT_PATH}`,
    {
      method: "POST",
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        "x-upsert": "true",
      },
      body,
    },
  );
  if (!res.ok) {
    console.error(
      "[users-cloud upload]",
      res.status,
      (await res.text()).slice(0, 200),
    );
  }
}

/** Confirm private object is not publicly readable. */
export async function usersCloudIsPrivate(): Promise<boolean> {
  const { url } = scuupConfig();
  if (!url) return true;
  try {
    const res = await fetch(
      `${url}/storage/v1/object/public/${BUCKET}/${OBJECT_PATH}`,
      { cache: "no-store" },
    );
    return res.status === 400 || res.status === 404 || !res.ok;
  } catch {
    return true;
  }
}
