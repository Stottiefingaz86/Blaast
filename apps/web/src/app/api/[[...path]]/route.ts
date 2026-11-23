import type { NextRequest } from "next/server";
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
  {
    match: (parts) => {
      if (parts.length !== 5) return null;
      if (!(parts[0] === "admin" && parts[1] === "sessions" && Boolean(parts[2]) && parts[3] === "artifacts" && Boolean(parts[4]))) return null;
      return { "id": parts[2]!, "artifactId": parts[4]! } as Record<string, string>;
    },
    load: () => import("@/lib/api-handlers/admin_sessions_id_artifacts_artifactId") as unknown as Promise<Handlers>,
  },
  {
    match: (parts) => {
      if (parts.length !== 4) return null;
      if (!(parts[0] === "admin" && parts[1] === "sessions" && Boolean(parts[2]) && parts[3] === "artifacts")) return null;
      return { "id": parts[2]! } as Record<string, string>;
    },
    load: () => import("@/lib/api-handlers/admin_sessions_id_artifacts") as unknown as Promise<Handlers>,
  },
  {
    match: (parts) => {
      if (parts.length !== 4) return null;
      if (!(parts[0] === "admin" && parts[1] === "sessions" && Boolean(parts[2]) && parts[3] === "enrich")) return null;
      return { "id": parts[2]! } as Record<string, string>;
    },
    load: () => import("@/lib/api-handlers/admin_sessions_id_enrich") as unknown as Promise<Handlers>,
  },
  {
    match: (parts) => {
      if (parts.length !== 4) return null;
      if (!(parts[0] === "library" && parts[1] === "media" && Boolean(parts[2]) && Boolean(parts[3]))) return null;
      return { "sessionId": parts[2]!, "artifactId": parts[3]! } as Record<string, string>;
    },
    load: () => import("@/lib/api-handlers/library_media_sessionId_artifactId") as unknown as Promise<Handlers>,
  },
  {
    match: (parts) => {
      if (parts.length !== 3) return null;
      if (!(parts[0] === "admin" && parts[1] === "operators" && Boolean(parts[2]))) return null;
      return { "id": parts[2]! } as Record<string, string>;
    },
    load: () => import("@/lib/api-handlers/admin_operators_id") as unknown as Promise<Handlers>,
  },
  {
    match: (parts) => {
      if (parts.length !== 3) return null;
      if (!(parts[0] === "admin" && parts[1] === "patterns" && parts[2] === "rebuild")) return null;
      return {  } as Record<string, string>;
    },
    load: () => import("@/lib/api-handlers/admin_patterns_rebuild") as unknown as Promise<Handlers>,
  },
  {
    match: (parts) => {
      if (parts.length !== 3) return null;
      if (!(parts[0] === "admin" && parts[1] === "sessions" && Boolean(parts[2]))) return null;
      return { "id": parts[2]! } as Record<string, string>;
    },
    load: () => import("@/lib/api-handlers/admin_sessions_id") as unknown as Promise<Handlers>,
  },
  {
    match: (parts) => {
      if (parts.length !== 3) return null;
      if (!(parts[0] === "auth" && parts[1] === "google" && parts[2] === "callback")) return null;
      return {  } as Record<string, string>;
    },
    load: () => import("@/lib/api-handlers/auth_google_callback") as unknown as Promise<Handlers>,
  },
  {
    match: (parts) => {
      if (parts.length !== 2) return null;
      if (!(parts[0] === "admin" && parts[1] === "analytics")) return null;
      return {  } as Record<string, string>;
    },
    load: () => import("@/lib/api-handlers/admin_analytics") as unknown as Promise<Handlers>,
  },
  {
    match: (parts) => {
      if (parts.length !== 2) return null;
      if (!(parts[0] === "admin" && parts[1] === "operators")) return null;
      return {  } as Record<string, string>;
    },
    load: () => import("@/lib/api-handlers/admin_operators") as unknown as Promise<Handlers>,
  },
  {
    match: (parts) => {
      if (parts.length !== 2) return null;
      if (!(parts[0] === "admin" && parts[1] === "playbooks")) return null;
      return {  } as Record<string, string>;
    },
    load: () => import("@/lib/api-handlers/admin_playbooks") as unknown as Promise<Handlers>,
  },
  {
    match: (parts) => {
      if (parts.length !== 2) return null;
      if (!(parts[0] === "admin" && parts[1] === "sessions")) return null;
      return {  } as Record<string, string>;
    },
    load: () => import("@/lib/api-handlers/admin_sessions") as unknown as Promise<Handlers>,
  },
  {
    match: (parts) => {
      if (parts.length !== 2) return null;
      if (!(parts[0] === "admin" && parts[1] === "users")) return null;
      return {  } as Record<string, string>;
    },
    load: () => import("@/lib/api-handlers/admin_users") as unknown as Promise<Handlers>,
  },
  {
    match: (parts) => {
      if (parts.length !== 2) return null;
      if (!(parts[0] === "analytics" && parts[1] === "track")) return null;
      return {  } as Record<string, string>;
    },
    load: () => import("@/lib/api-handlers/analytics_track") as unknown as Promise<Handlers>,
  },
  {
    match: (parts) => {
      if (parts.length !== 2) return null;
      if (!(parts[0] === "auth" && parts[1] === "google")) return null;
      return {  } as Record<string, string>;
    },
    load: () => import("@/lib/api-handlers/auth_google") as unknown as Promise<Handlers>,
  },
  {
    match: (parts) => {
      if (parts.length !== 2) return null;
      if (!(parts[0] === "auth" && parts[1] === "login")) return null;
      return {  } as Record<string, string>;
    },
    load: () => import("@/lib/api-handlers/auth_login") as unknown as Promise<Handlers>,
  },
  {
    match: (parts) => {
      if (parts.length !== 2) return null;
      if (!(parts[0] === "auth" && parts[1] === "logout")) return null;
      return {  } as Record<string, string>;
    },
    load: () => import("@/lib/api-handlers/auth_logout") as unknown as Promise<Handlers>,
  },
  {
    match: (parts) => {
      if (parts.length !== 2) return null;
      if (!(parts[0] === "auth" && parts[1] === "me")) return null;
      return {  } as Record<string, string>;
    },
    load: () => import("@/lib/api-handlers/auth_me") as unknown as Promise<Handlers>,
  },
  {
    match: (parts) => {
      if (parts.length !== 2) return null;
      if (!(parts[0] === "auth" && parts[1] === "signup")) return null;
      return {  } as Record<string, string>;
    },
    load: () => import("@/lib/api-handlers/auth_signup") as unknown as Promise<Handlers>,
  },
  {
    match: (parts) => {
      if (parts.length !== 2) return null;
      if (!(parts[0] === "library" && parts[1] === "catalog")) return null;
      return {  } as Record<string, string>;
    },
    load: () => import("@/lib/api-handlers/library_catalog") as unknown as Promise<Handlers>,
  },
  {
    match: (parts) => {
      if (parts.length !== 2) return null;
      if (!(parts[0] === "library" && parts[1] === "covers")) return null;
      return {  } as Record<string, string>;
    },
    load: () => import("@/lib/api-handlers/library_covers") as unknown as Promise<Handlers>,
  },
  {
    match: (parts) => {
      if (parts.length !== 2) return null;
      if (!(parts[0] === "library" && parts[1] === "search")) return null;
      return {  } as Record<string, string>;
    },
    load: () => import("@/lib/api-handlers/library_search") as unknown as Promise<Handlers>,
  },
  {
    match: (parts) => {
      if (parts.length !== 2) return null;
      if (!(parts[0] === "prompts" && parts[1] === "generate")) return null;
      return {  } as Record<string, string>;
    },
    load: () => import("@/lib/api-handlers/prompts_generate") as unknown as Promise<Handlers>,
  },
  {
    match: (parts) => {
      if (parts.length !== 2) return null;
      if (!(parts[0] === "research" && parts[1] === "scuup")) return null;
      return {  } as Record<string, string>;
    },
    load: () => import("@/lib/api-handlers/research_scuup") as unknown as Promise<Handlers>,
  },
  {
    match: (parts) => {
      if (parts.length !== 1) return null;
      if (!(parts[0] === "mcp")) return null;
      return {  } as Record<string, string>;
    },
    load: () => import("@/lib/api-handlers/mcp") as unknown as Promise<Handlers>,
  }
];

async function dispatch(req: NextRequest, method: keyof Handlers) {
  const url = new URL(req.url);
  const parts = url.pathname
    .replace(/^\/api\/?/, "")
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
