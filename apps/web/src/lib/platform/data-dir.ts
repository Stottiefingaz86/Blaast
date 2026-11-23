import path from "path";

/**
 * Local: `apps/web/.data`.
 * Vercel/serverless: `/tmp/blaast-data` (only writable path).
 * Override with BLAAST_DATA_DIR when using durable disk/R2 mounts later.
 */
export function dataDir(): string {
  if (process.env.BLAAST_DATA_DIR?.trim()) {
    return process.env.BLAAST_DATA_DIR.trim();
  }
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    return "/tmp/blaast-data";
  }
  return path.join(process.cwd(), ".data");
}

export function capturesDir(): string {
  return path.join(dataDir(), "captures");
}
