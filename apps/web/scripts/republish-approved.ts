/**
 * Re-run publish for every approved artifact (e.g. after publish hook landed).
 * Usage: npx tsx scripts/republish-approved.ts
 */
import { republishAllApproved } from "../src/lib/evidence/publish";

async function main() {
  const result = await republishAllApproved();
  console.log("done", result);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
