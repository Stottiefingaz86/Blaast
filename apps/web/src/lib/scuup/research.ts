import { logoSrc } from "@/lib/marketing/operator-logos";
import type { CatalogOperator, SurfaceKind } from "@/lib/library/catalog";
import { scuupConfigured, scuupRest } from "@/lib/scuup/client";

export type ScuupBrand = {
  id: string;
  project_id: string;
  name: string;
  url: string;
  favicon?: string | null;
  role?: string | null;
  position?: number | null;
};

export type ScuupProject = {
  id: string;
  name: string;
  market?: string | null;
  products?: unknown;
  journeys?: unknown;
  status?: string | null;
  device?: string | null;
  created_at?: string;
};

export type ScuupShowcase = {
  id: string;
  brand_slug: string;
  brand_name: string;
  brand_url: string;
  favicon?: string | null;
  market?: string | null;
  month?: string | null;
  cx_score?: number | null;
  journeys_score?: number | null;
  retention_score?: number | null;
  voc_score?: number | null;
  design_score?: number | null;
  homepage?: unknown;
  project_id?: string | null;
  brand_id?: string | null;
  updated_at?: string;
};

export type ScuupResearchSummary = {
  source: "scuup_supabase";
  projectUrl: string;
  brands: ScuupBrand[];
  projects: ScuupProject[];
  showcase: ScuupShowcase[];
  researchWorkspace: {
    id: string;
    projectCount: number;
    names: string[];
  } | null;
  uniqueOperators: {
    hostname: string;
    name: string;
    url: string;
    markets: string[];
    projectCount: number;
  }[];
};

function hostnameFromUrl(raw: string) {
  try {
    return new URL(raw).hostname.replace(/^www\./, "");
  } catch {
    return raw.replace(/^https?:\/\//, "").split("/")[0] || raw;
  }
}

/** Pull brands / projects / showcase / research workspace from Scuup. */
export async function loadScuupResearch(): Promise<ScuupResearchSummary | null> {
  if (!scuupConfigured()) return null;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!.replace(/\/$/, "");

  const [brands, projects, showcase, workspace] = await Promise.all([
    scuupRest<ScuupBrand[]>("ps_brands?select=id,project_id,name,url,favicon,role,position&order=name"),
    scuupRest<ScuupProject[]>(
      "ps_projects?select=id,name,market,products,journeys,status,device,created_at&order=created_at.desc",
    ),
    scuupRest<ScuupShowcase[]>(
      "ps_showcase_snapshots?select=id,brand_slug,brand_name,brand_url,favicon,market,month,cx_score,journeys_score,retention_score,voc_score,design_score,homepage,project_id,brand_id,updated_at&order=updated_at.desc",
    ),
    scuupRest<{ id: string; projects: unknown[] }[]>(
      "research_workspace?select=id,projects&id=eq.default",
    ),
  ]);

  const projectById = new Map(projects.map((p) => [p.id, p]));
  const byHost = new Map<
    string,
    {
      hostname: string;
      name: string;
      url: string;
      markets: Set<string>;
      projectIds: Set<string>;
    }
  >();

  for (const b of brands) {
    if (!b.url) continue;
    const host = hostnameFromUrl(b.url);
    const proj = projectById.get(b.project_id);
    const cur = byHost.get(host) ?? {
      hostname: host,
      name: b.name,
      url: b.url,
      markets: new Set<string>(),
      projectIds: new Set<string>(),
    };
    cur.name = b.name || cur.name;
    cur.url = b.url || cur.url;
    if (proj?.market) cur.markets.add(String(proj.market));
    cur.projectIds.add(b.project_id);
    byHost.set(host, cur);
  }

  for (const s of showcase) {
    if (!s.brand_url) continue;
    const host = hostnameFromUrl(s.brand_url);
    const cur = byHost.get(host) ?? {
      hostname: host,
      name: s.brand_name,
      url: s.brand_url,
      markets: new Set<string>(),
      projectIds: new Set<string>(),
    };
    cur.name = s.brand_name || cur.name;
    if (s.market) cur.markets.add(String(s.market));
    if (s.project_id) cur.projectIds.add(s.project_id);
    byHost.set(host, cur);
  }

  const ws = workspace[0];
  const wsProjects = Array.isArray(ws?.projects) ? ws!.projects : [];

  return {
    source: "scuup_supabase",
    projectUrl: url,
    brands,
    projects,
    showcase,
    researchWorkspace: ws
      ? {
          id: ws.id,
          projectCount: wsProjects.length,
          names: wsProjects
            .map((p) =>
              p && typeof p === "object" && "name" in p
                ? String((p as { name?: string }).name ?? "")
                : "",
            )
            .filter(Boolean),
        }
      : null,
    uniqueOperators: [...byHost.values()]
      .map((o) => ({
        hostname: o.hostname,
        name: o.name,
        url: o.url,
        markets: [...o.markets],
        projectCount: o.projectIds.size,
      }))
      .sort((a, b) => a.name.localeCompare(b.name)),
  };
}

function kindForName(name: string): SurfaceKind {
  const n = name.toLowerCase();
  if (/casino|slot|roobet|stake/.test(n)) return "casino";
  return "sportsbook";
}

/**
 * Catalogue cards from Scuup research brands (logos via Brandfetch).
 * Captures (video) merge on top when published under the same hostname.
 */
export function catalogOperatorsFromScuup(
  research: ScuupResearchSummary,
): CatalogOperator[] {
  return research.uniqueOperators.map((op) => {
    const showcase = research.showcase.filter(
      (s) => hostnameFromUrl(s.brand_url) === op.hostname,
    );
    const markets = op.markets.length ? op.markets.join(", ") : "Research";
    const kind = kindForName(op.name);
    return {
      slug: op.hostname.replace(/\./g, "-"),
      name: op.name,
      tagline: `${markets} · ${op.projectCount} Scuup project${op.projectCount === 1 ? "" : "s"}`,
      category: kind === "casino" ? "Casino" : "Sportsbook",
      rating: showcase[0]?.cx_score
        ? Math.min(5, Math.max(1, Number(showcase[0].cx_score) / 20))
        : 4.5,
      ratingCount: Math.max(1, showcase.length || op.projectCount),
      badge: "Updated" as const,
      platform: "web" as const,
      kind,
      hasVideo: false,
      logoUrl: logoSrc(op.hostname, 64),
      screens: [
        {
          id: `${op.hostname}-home`,
          title: "Home / research",
          kind,
        },
        ...showcase.slice(0, 4).map((s) => ({
          id: s.id,
          title: s.month ? `Showcase ${s.month}` : "Showcase",
          kind,
        })),
      ],
      uiElements: [],
      flows: [
        {
          id: `${op.hostname}-scuup`,
          name: "Scuup research coverage",
          group: "Research",
          actions: ["Benchmark", "Teardown"],
          hasVideo: false,
          steps: [
            {
              id: `${op.hostname}-overview`,
              label: op.name,
              kind,
            },
          ],
        },
      ],
    };
  });
}

/** Merge Scuup research operators under published captures (captures win). */
export function mergeCatalog(
  published: CatalogOperator[],
  research: CatalogOperator[],
): CatalogOperator[] {
  const bySlug = new Map<string, CatalogOperator>();
  for (const r of research) bySlug.set(r.slug, r);
  for (const p of published) {
    const prev = bySlug.get(p.slug);
    bySlug.set(
      p.slug,
      prev
        ? {
            ...prev,
            ...p,
            tagline: p.tagline || prev.tagline,
            logoUrl: p.logoUrl || prev.logoUrl,
            hasVideo: p.hasVideo || prev.hasVideo,
            posterUrl: p.posterUrl || prev.posterUrl,
            videoUrl: p.videoUrl || prev.videoUrl,
            screens: p.screens.length ? p.screens : prev.screens,
            uiElements: p.uiElements.length ? p.uiElements : prev.uiElements,
            flows: p.flows.length ? p.flows : prev.flows,
            badge: p.hasVideo ? "New" : prev.badge,
          }
        : p,
    );
  }
  return [...bySlug.values()].sort((a, b) => {
    if (a.hasVideo !== b.hasVideo) return a.hasVideo ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
}
