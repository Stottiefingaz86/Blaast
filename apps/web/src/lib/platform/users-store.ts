import { promises as fs } from "fs";
import path from "path";
import { randomBytes, scryptSync, timingSafeEqual } from "crypto";
import { dataDir } from "@/lib/platform/data-dir";
import type { PlanId } from "@/lib/platform/plans";

const USERS_PATH = () => path.join(dataDir(), "platform-users.json");

/** owner/admin = full ops + approve. curator = capture only (no publish). */
export type PlatformRole = "owner" | "admin" | "curator" | "member";

/** Only these emails may hold owner/admin. Curators are assigned in Admin → Users. */
export function elevatedEmailAllowlist(): Set<string> {
  const raw = [
    process.env.BLAAST_OWNER_EMAIL ?? "",
    process.env.BLAAST_ADMIN_EMAILS ?? "",
  ]
    .join(",")
    .split(/[,;\s]+/)
    .map((s) => s.trim().toLowerCase())
    .filter((s) => s.includes("@"));
  return new Set(raw);
}

function canElevate(email: string): boolean {
  const allow = elevatedEmailAllowlist();
  // No allowlist configured → do not lock out the founder (dev / unset prod).
  if (allow.size === 0) return true;
  return allow.has(email.trim().toLowerCase());
}

/**
 * Strip stolen owner/admin from non-allowlisted accounts.
 * Curator is intentional (assigned by owner) — leave it alone.
 * When BLAAST_OWNER_EMAIL / BLAAST_ADMIN_EMAILS are unset, roles are left alone.
 */
export function enforceRolePolicy(user: PlatformUser): PlatformUser {
  if (user.role === "member" || user.role === "curator") return user;
  const allow = elevatedEmailAllowlist();
  if (allow.size === 0) return user;
  if (canElevate(user.email)) return user;
  return { ...user, role: "member" };
}

export type PlatformUser = {
  id: string;
  email: string;
  name: string;
  /** scrypt hash — never return to client */
  passwordHash: string;
  plan: PlanId;
  role: PlatformRole;
  createdAt: string;
  lastLoginAt: string | null;
  /** First time they connected / activated MCP */
  mcpActivatedAt: string | null;
  mcpConnectionCount: number;
};

type UsersFile = { users: PlatformUser[] };

async function ensureDir() {
  await fs.mkdir(dataDir(), { recursive: true });
}

function hashPassword(password: string, salt?: string): string {
  const s = salt ?? randomBytes(16).toString("hex");
  const hash = scryptSync(password, s, 64).toString("hex");
  return `${s}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const next = scryptSync(password, salt, 64);
  const prev = Buffer.from(hash, "hex");
  if (prev.length !== next.length) return false;
  return timingSafeEqual(prev, next);
}

async function readLocalFile(): Promise<UsersFile | null> {
  try {
    const raw = await fs.readFile(USERS_PATH(), "utf8");
    const parsed = JSON.parse(raw) as UsersFile;
    if (!parsed || !Array.isArray(parsed.users)) return null;
    return parsed;
  } catch {
    return null;
  }
}

async function readFile(): Promise<UsersFile> {
  await ensureDir();
  const { fetchUsersCloud, mergeUsersFiles } = await import(
    "@/lib/platform/users-cloud"
  );
  const [local, cloud] = await Promise.all([
    readLocalFile(),
    fetchUsersCloud(),
  ]);

  // Vercel /tmp is empty on cold start — restore from durable cloud first
  if (!local && cloud.users.length > 0) {
    await fs.writeFile(USERS_PATH(), JSON.stringify(cloud, null, 2), "utf8");
    return cloud;
  }
  if (!local) {
    return seedAdmin();
  }

  const merged = mergeUsersFiles(cloud, local);
  // Keep local warm cache in sync when cloud has extra signups
  if (merged.users.length !== local.users.length) {
    await fs.writeFile(USERS_PATH(), JSON.stringify(merged, null, 2), "utf8");
  }
  return merged;
}

async function writeFile(data: UsersFile) {
  await ensureDir();
  const { fetchUsersCloud, mergeUsersFiles, uploadUsersCloud } = await import(
    "@/lib/platform/users-cloud"
  );
  // Merge with cloud so one serverless instance cannot wipe another signup
  const cloud = await fetchUsersCloud();
  const merged = mergeUsersFiles(cloud, data);
  await fs.writeFile(USERS_PATH(), JSON.stringify(merged, null, 2), "utf8");
  await uploadUsersCloud(merged);
}

async function seedAdmin(): Promise<UsersFile> {
  const now = new Date().toISOString();
  const email = (
    process.env.BLAAST_OWNER_EMAIL ||
    "you@blaast.app"
  )
    .trim()
    .toLowerCase();
  const password =
    process.env.BLAAST_OWNER_PASSWORD?.trim() || "blaast-admin";
  const name = process.env.BLAAST_OWNER_NAME?.trim() || "Chris";
  const admin: PlatformUser = {
    id: "usr_admin",
    email,
    name,
    passwordHash: hashPassword(password),
    plan: "pro",
    role: "owner",
    createdAt: now,
    lastLoginAt: null,
    mcpActivatedAt: now,
    mcpConnectionCount: 1,
  };
  const data = { users: [admin] };
  await writeFile(data);
  return data;
}

export type PublicUser = Omit<PlatformUser, "passwordHash">;

export function toPublic(u: PlatformUser): PublicUser {
  const safe = enforceRolePolicy(u);
  const { passwordHash: _, ...rest } = safe;
  return rest;
}

async function persistRoleDemotions(data: UsersFile): Promise<UsersFile> {
  const allow = elevatedEmailAllowlist();
  // Unset allowlist must not wipe owner/admin (that caused founder lockout).
  if (allow.size === 0) return data;
  let dirty = false;
  for (const u of data.users) {
    if (
      (u.role === "owner" || u.role === "admin") &&
      !canElevate(u.email)
    ) {
      u.role = "member";
      dirty = true;
    }
  }
  if (dirty) await writeFile(data);
  return data;
}

export async function updateUserRole(
  userId: string,
  role: PlatformRole,
): Promise<PublicUser | null> {
  if (!["owner", "admin", "curator", "member"].includes(role)) return null;
  const data = await readFile();
  const row = data.users.find((u) => u.id === userId);
  if (!row) return null;
  if (role === "owner" || role === "admin") {
    if (!canElevate(row.email)) {
      throw new Error(
        "Only allowlisted emails can be owner/admin — use Curator for capture staff",
      );
    }
  }
  row.role = role;
  await writeFile(data);
  return toPublic(row);
}

export async function listUsers(): Promise<PublicUser[]> {
  const data = await persistRoleDemotions(await readFile());
  return data.users.map(toPublic);
}

export async function getUserById(id: string): Promise<PlatformUser | null> {
  const data = await persistRoleDemotions(await readFile());
  const user = data.users.find((u) => u.id === id) ?? null;
  return user ? enforceRolePolicy(user) : null;
}

export async function getUserByEmail(
  email: string,
): Promise<PlatformUser | null> {
  const data = await persistRoleDemotions(await readFile());
  const key = email.trim().toLowerCase();
  const user = data.users.find((u) => u.email.toLowerCase() === key) ?? null;
  return user ? enforceRolePolicy(user) : null;
}

export async function createUser(input: {
  email: string;
  password: string;
  name?: string;
}): Promise<PublicUser> {
  const email = input.email.trim().toLowerCase();
  if (!email.includes("@")) throw new Error("Invalid email");
  if (input.password.length < 8) {
    throw new Error("Password must be at least 8 characters");
  }
  const data = await readFile();
  if (data.users.some((u) => u.email.toLowerCase() === email)) {
    throw new Error("Email already registered");
  }
  const now = new Date().toISOString();
  const user: PlatformUser = {
    id: `usr_${randomBytes(8).toString("hex")}`,
    email,
    name:
      input.name?.trim() ||
      email.split("@")[0] ||
      "Member",
    passwordHash: hashPassword(input.password),
    plan: "free",
    role: "member",
    createdAt: now,
    lastLoginAt: now,
    mcpActivatedAt: null,
    mcpConnectionCount: 0,
  };
  data.users.push(user);
  await writeFile(data);
  return toPublic(user);
}

export async function authenticate(
  email: string,
  password: string,
): Promise<PublicUser | null> {
  const user = await getUserByEmail(email);
  if (!user) return null;
  if (!verifyPassword(password, user.passwordHash)) return null;
  try {
    const data = await readFile();
    const row = data.users.find((u) => u.id === user.id);
    if (row) {
      row.lastLoginAt = new Date().toISOString();
      await writeFile(data);
    }
  } catch {
    /* ephemeral FS — login still succeeds */
  }
  return toPublic(user);
}

export async function updateUserPlan(
  userId: string,
  plan: PlanId,
): Promise<PublicUser | null> {
  const data = await readFile();
  const row = data.users.find((u) => u.id === userId);
  if (!row) return null;
  row.plan = plan;
  await writeFile(data);
  return toPublic(row);
}

export async function markMcpActivated(userId: string): Promise<void> {
  const data = await readFile();
  const row = data.users.find((u) => u.id === userId);
  if (!row) return;
  if (!row.mcpActivatedAt) {
    row.mcpActivatedAt = new Date().toISOString();
  }
  row.mcpConnectionCount = Math.max(1, row.mcpConnectionCount);
  await writeFile(data);
}

export async function bumpMcpConnection(userId: string): Promise<void> {
  const data = await readFile();
  const row = data.users.find((u) => u.id === userId);
  if (!row) return;
  row.mcpConnectionCount += 1;
  if (!row.mcpActivatedAt) {
    row.mcpActivatedAt = new Date().toISOString();
  }
  await writeFile(data);
}

/** Create or promote an owner admin (manual ops — not self-serve). */
export async function upsertOwnerAdmin(input: {
  email: string;
  password: string;
  name?: string;
  plan?: PlanId;
}): Promise<PublicUser> {
  const email = input.email.trim().toLowerCase();
  if (!canElevate(email)) {
    throw new Error(
      "Email is not on BLAAST_OWNER_EMAIL / BLAAST_ADMIN_EMAILS allowlist",
    );
  }
  const data = await readFile();
  const existing = data.users.find((u) => u.email.toLowerCase() === email);
  const now = new Date().toISOString();
  if (existing) {
    existing.passwordHash = hashPassword(input.password);
    existing.role = "owner";
    existing.plan = input.plan ?? "pro";
    if (input.name?.trim()) existing.name = input.name.trim();
    existing.lastLoginAt = now;
    await writeFile(data);
    return toPublic(existing);
  }
  const user: PlatformUser = {
    id: `usr_${randomBytes(8).toString("hex")}`,
    email,
    name: input.name?.trim() || email.split("@")[0] || "Admin",
    passwordHash: hashPassword(input.password),
    plan: input.plan ?? "pro",
    role: "owner",
    createdAt: now,
    lastLoginAt: now,
    mcpActivatedAt: now,
    mcpConnectionCount: 1,
  };
  data.users.push(user);
  await writeFile(data);
  return toPublic(user);
}

function oauthBootstrapRole(email: string): PlatformRole {
  const owner = (process.env.BLAAST_OWNER_EMAIL ?? "").trim().toLowerCase();
  if (owner && email === owner) return "owner";
  const admins = elevatedEmailAllowlist();
  if (admins.size > 0 && admins.has(email)) {
    return email === owner ? "owner" : "admin";
  }
  return "member";
}

/** Find-or-create from Google (or other OAuth) — no password. */
export async function upsertOAuthUser(input: {
  email: string;
  name?: string;
}): Promise<PublicUser> {
  const email = input.email.trim().toLowerCase();
  const data = await readFile();
  const existing = data.users.find((u) => u.email.toLowerCase() === email);
  const now = new Date().toISOString();
  const bootRole = oauthBootstrapRole(email);
  if (existing) {
    existing.lastLoginAt = now;
    const allow = elevatedEmailAllowlist();
    if (
      allow.size > 0 &&
      (existing.role === "owner" || existing.role === "admin") &&
      !canElevate(existing.email)
    ) {
      existing.role = "member";
    }
    // Restore founder / allowlisted staff after accidental demotion
    if (bootRole === "owner" || bootRole === "admin") {
      existing.role = bootRole;
      if (existing.plan === "free") existing.plan = "pro";
    }
    if (input.name?.trim() && existing.name === existing.email.split("@")[0]) {
      existing.name = input.name.trim();
    }
    await writeFile(data);
    return toPublic(existing);
  }
  const user: PlatformUser = {
    id: `usr_${randomBytes(8).toString("hex")}`,
    email,
    name: input.name?.trim() || email.split("@")[0] || "Member",
    passwordHash: hashPassword(randomBytes(24).toString("hex")),
    plan: bootRole === "member" ? "free" : "pro",
    role: bootRole,
    createdAt: now,
    lastLoginAt: now,
    mcpActivatedAt: null,
    mcpConnectionCount: 0,
  };
  data.users.push(user);
  await writeFile(data);
  return toPublic(user);
}
