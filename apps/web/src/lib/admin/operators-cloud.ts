import { scuupConfig } from "@/lib/scuup/client";
import type { Operator } from "@/lib/admin/types";

type CloudRow = {
  id: string;
  name: string;
  url: string;
  hostname: string;
  markets: string[] | null;
  products: string[] | null;
  tags: string[] | null;
  notes: string | null;
  vertical: string | null;
  regions: string[] | null;
  reference_tier: string | null;
  created_at: string;
  updated_at: string;
};

function rowToOperator(row: CloudRow): Operator {
  return {
    id: row.id,
    name: row.name,
    url: row.url,
    hostname: row.hostname,
    markets: row.markets ?? [],
    products: (row.products ?? []) as Operator["products"],
    tags: row.tags ?? [],
    notes: row.notes ?? undefined,
    vertical: (row.vertical as Operator["vertical"]) ?? "other",
    regions: row.regions ?? [],
    referenceTier: (row.reference_tier as Operator["referenceTier"]) ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function operatorToRow(op: Operator): Record<string, unknown> {
  return {
    id: op.id,
    name: op.name,
    url: op.url,
    hostname: op.hostname,
    markets: op.markets,
    products: op.products,
    tags: op.tags,
    notes: op.notes ?? null,
    vertical: op.vertical ?? "other",
    regions: op.regions ?? [],
    reference_tier: op.referenceTier ?? null,
    created_at: op.createdAt,
    updated_at: op.updatedAt,
  };
}

/** Persist operator so Vercel serverless can read it after create. */
export async function upsertOperatorCloud(op: Operator): Promise<void> {
  const { url, key } = scuupConfig();
  if (!url || !key) return;

  const res = await fetch(`${url}/rest/v1/blaast_operators`, {
    method: "POST",
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      Prefer: "resolution=merge-duplicates,return=minimal",
    },
    body: JSON.stringify(operatorToRow(op)),
  });
  if (!res.ok) {
    const text = await res.text();
    console.error("[blaast_operators upsert]", res.status, text);
  }
}

export async function getOperatorCloud(id: string): Promise<Operator | null> {
  const { url, key } = scuupConfig();
  if (!url || !key) return null;

  const res = await fetch(
    `${url}/rest/v1/blaast_operators?id=eq.${encodeURIComponent(id)}&select=*`,
    {
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        Accept: "application/json",
      },
      cache: "no-store",
    },
  );
  if (!res.ok) {
    console.error("[blaast_operators get]", res.status, await res.text());
    return null;
  }
  const rows = (await res.json()) as CloudRow[];
  return rows[0] ? rowToOperator(rows[0]) : null;
}

export async function listOperatorsCloud(): Promise<Operator[]> {
  const { url, key } = scuupConfig();
  if (!url || !key) return [];

  const res = await fetch(
    `${url}/rest/v1/blaast_operators?select=*&order=name.asc`,
    {
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        Accept: "application/json",
      },
      cache: "no-store",
    },
  );
  if (!res.ok) {
    console.error("[blaast_operators list]", res.status, await res.text());
    return [];
  }
  const rows = (await res.json()) as CloudRow[];
  return rows.map(rowToOperator);
}
