import { promises as fs } from "fs";
import path from "path";
import { randomBytes } from "crypto";
import { dataDir } from "@/lib/platform/data-dir";

const analyticsPath = () => path.join(dataDir(), "platform-analytics.json");

export type AnalyticsEventKind =
  | "mcp_call"
  | "mcp_activate"
  | "brand_search"
  | "brand_copy"
  | "login"
  | "signup";

export type AnalyticsEvent = {
  id: string;
  kind: AnalyticsEventKind;
  at: string;
  userId?: string;
  userEmail?: string;
  /** Operator slug / hostname / display name */
  brand?: string;
  tool?: string;
  query?: string;
  meta?: Record<string, string | number | boolean | null>;
};

type AnalyticsFile = { events: AnalyticsEvent[] };

async function readFile(): Promise<AnalyticsFile> {
  await fs.mkdir(dataDir(), { recursive: true });
  try {
    return JSON.parse(
      await fs.readFile(analyticsPath(), "utf8"),
    ) as AnalyticsFile;
  } catch {
    return { events: [] };
  }
}

async function writeFile(data: AnalyticsFile) {
  await fs.mkdir(dataDir(), { recursive: true });
  // Cap growth for local MVP
  if (data.events.length > 20_000) {
    data.events = data.events.slice(-15_000);
  }
  await fs.writeFile(analyticsPath(), JSON.stringify(data, null, 2), "utf8");
}

export async function trackEvent(
  input: Omit<AnalyticsEvent, "id" | "at"> & { at?: string },
): Promise<AnalyticsEvent> {
  const data = await readFile();
  const event: AnalyticsEvent = {
    id: `ev_${randomBytes(6).toString("hex")}`,
    at: input.at ?? new Date().toISOString(),
    kind: input.kind,
    userId: input.userId,
    userEmail: input.userEmail,
    brand: input.brand,
    tool: input.tool,
    query: input.query,
    meta: input.meta,
  };
  data.events.push(event);
  await writeFile(data);
  return event;
}

export type AnalyticsSummary = {
  totals: {
    events: number;
    signups: number;
    logins: number;
    mcpCalls: number;
    mcpActivations: number;
    brandSearches: number;
    brandCopyIntents: number;
  };
  usersWithMcp: number;
  topSearchedBrands: { brand: string; count: number }[];
  topCopiedBrands: { brand: string; count: number }[];
  topMcpTools: { tool: string; count: number }[];
  recent: AnalyticsEvent[];
};

function topCounts(
  items: (string | undefined)[],
  limit = 10,
): { brand?: string; tool?: string; count: number }[] {
  const map = new Map<string, number>();
  for (const v of items) {
    if (!v) continue;
    const key = v.trim().toLowerCase();
    if (!key) continue;
    map.set(key, (map.get(key) ?? 0) + 1);
  }
  return [...map.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([k, count]) => ({ count, brand: k, tool: k }));
}

export async function getAnalyticsSummary(
  opts?: { sinceDays?: number },
): Promise<AnalyticsSummary> {
  const data = await readFile();
  const since =
    opts?.sinceDays != null
      ? Date.now() - opts.sinceDays * 24 * 60 * 60 * 1000
      : 0;
  const events = data.events.filter(
    (e) => new Date(e.at).getTime() >= since,
  );

  const mcpUsers = new Set(
    events
      .filter((e) => e.kind === "mcp_activate" || e.kind === "mcp_call")
      .map((e) => e.userId)
      .filter(Boolean),
  );

  const searched = topCounts(
    events.filter((e) => e.kind === "brand_search").map((e) => e.brand),
  ).map((r) => ({ brand: r.brand!, count: r.count }));

  const copied = topCounts(
    events.filter((e) => e.kind === "brand_copy").map((e) => e.brand),
  ).map((r) => ({ brand: r.brand!, count: r.count }));

  const tools = topCounts(
    events.filter((e) => e.kind === "mcp_call").map((e) => e.tool),
  ).map((r) => ({ tool: r.tool!, count: r.count }));

  return {
    totals: {
      events: events.length,
      signups: events.filter((e) => e.kind === "signup").length,
      logins: events.filter((e) => e.kind === "login").length,
      mcpCalls: events.filter((e) => e.kind === "mcp_call").length,
      mcpActivations: events.filter((e) => e.kind === "mcp_activate").length,
      brandSearches: events.filter((e) => e.kind === "brand_search").length,
      brandCopyIntents: events.filter((e) => e.kind === "brand_copy").length,
    },
    usersWithMcp: mcpUsers.size,
    topSearchedBrands: searched,
    topCopiedBrands: copied,
    topMcpTools: tools,
    recent: [...events].reverse().slice(0, 40),
  };
}
