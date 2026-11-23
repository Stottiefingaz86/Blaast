/**
 * Push local admin operators to durable cloud Storage (Vercel Sites list).
 * Usage: npx tsx scripts/sync-operators-cloud.ts
 */
import { listOperators } from "../src/lib/admin/store";
import { syncOperatorsCloud } from "../src/lib/admin/operators-cloud";

async function main() {
  const ops = await listOperators();
  console.log(
    "local operators",
    ops.map((o) => `${o.name} (${o.hostname})`),
  );
  const n = await syncOperatorsCloud(ops);
  console.log("cloud operators index size", n);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
