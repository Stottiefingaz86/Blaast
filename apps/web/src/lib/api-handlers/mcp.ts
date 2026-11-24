import { NextRequest, NextResponse } from "next/server";
import { callMcpTool, MCP_TOOLS } from "@/lib/mcp/tools";
import {
  buildVisualSearchContent,
  hitsFromToolPayload,
} from "@/lib/mcp/visual";
import { trackEvent } from "@/lib/platform/analytics-store";
import { userIdFromRequestCookie } from "@/lib/platform/auth";
import { planAllowsMcp } from "@/lib/platform/plans";
import { getUserById, markMcpActivated } from "@/lib/platform/users-store";

/** Tools that return Mobbin-style inline screen galleries */
const VISUAL_TOOLS = new Set([
  "search_screens",
  "search_ui",
  "get_motion",
  "search_flows",
  "get_operator",
]);

const MCP_UPGRADE_MESSAGE =
  "Your plan is Free — upgrade to Pro to use MCP prompts and connect agents.";

export const runtime = "nodejs";

/**
 * Blaast MCP — Streamable HTTP JSON-RPC (Mobbin-shaped).
 * Clients: Cursor / Claude / ChatGPT custom connector → URL {origin}/api/mcp
 *
 * Demo auth: no OAuth yet. Production should gate Pro+ like Mobbin.
 * Spec reference: https://mobbin.com/mcp
 */

type JsonRpc = {
  jsonrpc?: string;
  id?: string | number | null;
  method?: string;
  params?: Record<string, unknown>;
};

function originFrom(req: NextRequest) {
  const proto = req.headers.get("x-forwarded-proto") ?? "http";
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  return host ? `${proto}://${host}` : "http://localhost:3000";
}

function rpcResult(id: JsonRpc["id"], result: unknown) {
  return NextResponse.json({ jsonrpc: "2.0", id: id ?? null, result });
}

function rpcError(id: JsonRpc["id"], code: number, message: string) {
  return NextResponse.json({
    jsonrpc: "2.0",
    id: id ?? null,
    error: { code, message },
  });
}

export async function GET(req: NextRequest) {
  const origin = originFrom(req);
  return NextResponse.json({
    name: "blaast",
    title: "Blaast MCP",
    description:
      "Search iGaming operator screens and flows for AI agents (Mobbin-shaped).",
    endpoint: `${origin}/api/mcp`,
    transport: "Streamable HTTP (JSON-RPC POST)",
    authentication: "Demo open — OAuth planned for Pro+",
    tools: MCP_TOOLS.map((t) => t.name),
    docs: `${origin}/mcp`,
  });
}

export async function POST(req: NextRequest) {
  const origin = originFrom(req);
  let body: JsonRpc;
  try {
    body = (await req.json()) as JsonRpc;
  } catch {
    return rpcError(null, -32700, "Parse error");
  }

  const { id, method, params = {} } = body;

  if (method === "initialize") {
    return rpcResult(id, {
      protocolVersion: "2024-11-05",
      capabilities: { tools: {} },
      serverInfo: { name: "blaast", version: "0.1.0" },
    });
  }

  if (method === "notifications/initialized" || method === "ping") {
    return rpcResult(id, {});
  }

  if (method === "tools/list") {
    return rpcResult(id, {
      tools: MCP_TOOLS.map((t) => ({
        name: t.name,
        description: t.description,
        inputSchema: t.inputSchema,
      })),
    });
  }

  if (method === "tools/call") {
    const name = String(params.name ?? "");
    const args = (params.arguments ?? {}) as Record<string, unknown>;

    const userId = userIdFromRequestCookie(req.headers.get("cookie"));
    let userEmail: string | undefined;
    let planAllows = false;
    if (userId) {
      const u = await getUserById(userId);
      if (u) {
        userEmail = u.email;
        planAllows = planAllowsMcp(u.plan);
      }
    }
    // Cookie session Free (or no Pro session) → upgrade message
    if (userId && !planAllows) {
      return rpcResult(id, {
        content: [{ type: "text", text: MCP_UPGRADE_MESSAGE }],
        isError: true,
      });
    }

    const data = await callMcpTool(name, args, origin);
    const isErr = data && typeof data === "object" && "error" in data;

    if (userId && planAllows) {
      await markMcpActivated(userId);
    }
    const brand =
      typeof args.slug === "string"
        ? args.slug
        : typeof args.query === "string"
          ? args.query
          : undefined;
    void trackEvent({
      kind: "mcp_call",
      userId: userId ?? undefined,
      userEmail,
      tool: name,
      brand,
      query: typeof args.query === "string" ? args.query : undefined,
    });
    if (
      name === "get_operator" ||
      name === "compare_operators" ||
      name === "get_pattern"
    ) {
      void trackEvent({
        kind: "brand_copy",
        userId: userId ?? undefined,
        userEmail,
        brand: brand ?? name,
        tool: name,
      });
    }

    if (!isErr && VISUAL_TOOLS.has(name)) {
      const hits = hitsFromToolPayload(data);
      if (hits.some((h) => h.posterUrl || h.poster_url)) {
        const content = await buildVisualSearchContent({
          tool: name,
          query: typeof args.query === "string" ? args.query : String(args.slug ?? ""),
          hits,
          payload: data,
        });
        return rpcResult(id, { content, isError: false });
      }
    }

    return rpcResult(id, {
      content: [
        {
          type: "text",
          text: JSON.stringify(data, null, 2),
        },
      ],
      isError: Boolean(isErr),
    });
  }

  return rpcError(id, -32601, `Method not found: ${method}`);
}
