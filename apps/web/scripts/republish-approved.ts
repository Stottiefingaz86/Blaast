/**
 * Re-run publish for every approved artifact (e.g. after publish hook landed).
 * Usage: npx tsx scripts/republish-approved.ts
 */
import { listSessions } from "../src/lib/admin/store";
import { publishApprovedArtifact } from "../src/lib/evidence/publish";

async function main() {
  const sessions = await listSessions();
  let n = 0;
  for (const session of sessions) {
    for (const art of session.artifacts ?? []) {
      if (art.reviewStatus !== "approved") continue;
      const rec = await publishApprovedArtifact(session, art);
      n += 1;
      console.log(
        "published",
        rec.operatorHostname,
        rec.coverageStepId,
        "anns",
        (rec.annotations ?? []).length,
      );
    }
  }
  console.log("done", n);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
