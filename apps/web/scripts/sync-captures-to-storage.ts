/**
 * Upload local published clips (video + poster) to Supabase Storage
 * and rewrite published-clips.json with public URLs.
 *
 *   cd apps/web && npx tsx scripts/sync-captures-to-storage.ts
 */
import { promises as fs } from "fs";
import path from "path";
import { dataDir } from "../src/lib/platform/data-dir";
import { uploadPublishedMedia } from "../src/lib/storage/captures";
import type { PublishedClipRecord } from "../src/lib/evidence/publish";

async function main() {
  const publishPath = path.join(dataDir(), "published-clips.json");
  const raw = await fs.readFile(publishPath, "utf8");
  const rows = JSON.parse(raw) as PublishedClipRecord[];
  let updated = 0;

  for (const rec of rows) {
    if (rec.videoUrl && rec.posterUrl) continue;
    const urls = await uploadPublishedMedia({
      sessionId: rec.sessionId,
      artifactId: rec.artifactId,
      videoPath: rec.videoPath,
      posterPath: rec.posterPath,
    });
    if (urls.videoUrl) {
      rec.videoUrl = urls.videoUrl;
      updated++;
    }
    if (urls.posterUrl) rec.posterUrl = urls.posterUrl;
    console.log(
      rec.artifactId.slice(0, 8),
      urls.videoUrl ? "video✓" : "video✗",
      urls.posterUrl ? "poster✓" : "poster✗",
    );
  }

  await fs.writeFile(publishPath, JSON.stringify(rows, null, 2), "utf8");
  console.log(`Done. Updated ${updated} clips → ${publishPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
