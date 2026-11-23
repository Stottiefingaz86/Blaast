import { promises as fs } from "fs";
import path from "path";
import { randomBytes, scryptSync, timingSafeEqual } from "crypto";
import { dataDir } from "@/lib/platform/data-dir";
import type { PlanId } from "@/lib/platform/plans";

const USERS_PATH = () => path.join(dataDir(), "platform-users.json");

export type PlatformRole = "owner" | "admin" | "member";

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

async function readFile(): Promise<UsersFile> {
  await ensureDir();
  try {
    const raw = await fs.readFile(USERS_PATH(), "utf8");
    return JSON.parse(raw) as UsersFile;
  } catch {
    const seed = await seedAdmin();
    return seed;
  }
}

async function writeFile(data: UsersFile) {
  await ensureDir();
  await fs.writeFile(USERS_PATH(), JSON.stringify(data, null, 2), "utf8");
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
  const { passwordHash: _, ...rest } = u;
  return rest;
}

export async function listUsers(): Promise<PublicUser[]> {
  const data = await readFile();
  return data.users.map(toPublic);
}

export async function getUserById(id: string): Promise<PlatformUser | null> {
  const data = await readFile();
  return data.users.find((u) => u.id === id) ?? null;
}

export async function getUserByEmail(
  email: string,
): Promise<PlatformUser | null> {
  const data = await readFile();
  const key = email.trim().toLowerCase();
  return data.users.find((u) => u.email.toLowerCase() === key) ?? null;
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

/** Find-or-create from Google (or other OAuth) — no password. */
export async function upsertOAuthUser(input: {
  email: string;
  name?: string;
}): Promise<PublicUser> {
  const email = input.email.trim().toLowerCase();
  const data = await readFile();
  const existing = data.users.find((u) => u.email.toLowerCase() === email);
  const now = new Date().toISOString();
  if (existing) {
    existing.lastLoginAt = now;
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
