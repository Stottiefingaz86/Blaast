import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const webRoot = path.resolve(__dirname, "..");
const apiRoot = path.join(webRoot, "src/app/api");
const handlersDir = path.join(webRoot, "src/lib/api-handlers");

const patterns = [
  ["admin", "analytics"],
  ["admin", "operators", "[id]"],
  ["admin", "operators"],
  ["admin", "patterns", "rebuild"],
  ["admin", "playbooks"],
  ["admin", "sessions", "[id]", "artifacts", "[artifactId]"],
  ["admin", "sessions", "[id]", "artifacts"],
  ["admin", "sessions", "[id]", "enrich"],
  ["admin", "sessions", "[id]"],
  ["admin", "sessions"],
  ["admin", "users"],
  ["analytics", "track"],
  ["auth", "google", "callback"],
  ["auth", "google"],
  ["auth", "login"],
  ["auth", "logout"],
  ["auth", "me"],
  ["auth", "signup"],
  ["library", "catalog"],
  ["library", "covers"],
  ["library", "media", "[sessionId]", "[artifactId]"],
  ["library", "search"],
  ["mcp"],
  ["prompts", "generate"],
  ["research", "scuup"],
];

function idFromParts(parts) {
  return parts
    .map((s) => s.replace(/^\[/, "").replace(/\]$/, ""))
    .join("_");
}

function isLit(seg) {
  return !seg.startsWith("[");
}

function paramName(seg) {
  return seg.slice(1, -1);
}

// Prefer longer / more specific routes first
patterns.sort((a, b) => b.length - a.length);

const routeEntries = patterns.map((parts) => {
  const id = idFromParts(parts);
  const checks = parts
    .map((seg, i) =>
      isLit(seg)
        ? `parts[${i}] === ${JSON.stringify(seg)}`
        : `Boolean(parts[${i}])`,
    )
    .join(" && ");
  const params = parts
    .map((seg, i) =>
      isLit(seg) ? null : `${JSON.stringify(paramName(seg))}: parts[${i}]!`,
    )
    .filter(Boolean)
    .join(", ");
  return `  {
    match: (parts) => {
      if (parts.length !== ${parts.length}) return null;
      if (!(${checks})) return null;
      return { ${params} } as Record<string, string>;
    },
    load: () => import("@/lib/api-handlers/${id}") as unknown as Promise<Handlers>,
  }`;
});

const gen = `import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<Record<string, string>> };
type Handlers = Partial<
  Record<
    "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "OPTIONS" | "HEAD",
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (req: any, ctx: any) => Promise<Response> | Response
  >
>;

type Route = {
  match: (parts: string[]) => Record<string, string> | null;
  load: () => Promise<Handlers>;
};

const routes: Route[] = [
${routeEntries.join(",\n")}
];

async function dispatch(req: NextRequest, method: keyof Handlers) {
  const url = new URL(req.url);
  const parts = url.pathname
    .replace(/^\\/api\\/?/, "")
    .split("/")
    .filter(Boolean);
  for (const route of routes) {
    const params = route.match(parts);
    if (!params) continue;
    const mod = await route.load();
    const handler = mod[method];
    if (!handler) {
      return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
    }
    return handler(req, { params: Promise.resolve(params) });
  }
  return NextResponse.json({ error: "Not found" }, { status: 404 });
}

export const GET = (req: NextRequest) => dispatch(req, "GET");
export const POST = (req: NextRequest) => dispatch(req, "POST");
export const PUT = (req: NextRequest) => dispatch(req, "PUT");
export const PATCH = (req: NextRequest) => dispatch(req, "PATCH");
export const DELETE = (req: NextRequest) => dispatch(req, "DELETE");
`;

const catchAllDir = path.join(apiRoot, "[[...path]]");
fs.mkdirSync(catchAllDir, { recursive: true });
fs.writeFileSync(path.join(catchAllDir, "route.ts"), gen);

// Delete old route.ts files (not the catch-all)
function walk(dir, base = "") {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name === "[[...path]]") continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) walk(full, path.join(base, e.name));
    else if (e.name === "route.ts") fs.unlinkSync(full);
  }
}
walk(apiRoot);

function rmEmpty(dir) {
  if (!fs.existsSync(dir) || path.basename(dir) === "[[...path]]") return;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.isDirectory()) rmEmpty(path.join(dir, e.name));
  }
  if (fs.readdirSync(dir).length === 0) fs.rmdirSync(dir);
}
rmEmpty(apiRoot);

console.log("API gateway ready at src/app/api/[[...path]]/route.ts");
console.log("handlers:", fs.readdirSync(handlersDir).length);
