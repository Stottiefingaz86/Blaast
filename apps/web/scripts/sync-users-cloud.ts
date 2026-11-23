/**
 * Push local platform-users.json into private durable Storage.
 * Usage: npx tsx scripts/sync-users-cloud.ts
 */
import { listUsers } from "../src/lib/platform/users-store";
import {
  fetchUsersCloud,
  uploadUsersCloud,
  usersCloudIsPrivate,
} from "../src/lib/platform/users-cloud";
import { promises as fs } from "fs";
import path from "path";
import { dataDir } from "../src/lib/platform/data-dir";

async function main() {
  // Force a write through users-store so merge+upload runs
  const publicList = await listUsers();
  console.log(
    "visible users",
    publicList.map((u) => `${u.email} (${u.role})`),
  );

  const raw = await fs.readFile(
    path.join(dataDir(), "platform-users.json"),
    "utf8",
  );
  const local = JSON.parse(raw) as { users: unknown[] };
  await uploadUsersCloud(local as { users: import("../src/lib/platform/users-store").PlatformUser[] });

  const cloud = await fetchUsersCloud();
  console.log(
    "cloud users",
    cloud.users.map((u) => `${u.email} (${u.role})`),
  );
  console.log("private bucket ok", await usersCloudIsPrivate());
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
