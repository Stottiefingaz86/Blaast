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

const BUCKET = "blaast-captures";
const INDEX_PATH = "operators-index.json";

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

function operatorToRow(op: Operator): CloudRow {
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

function mergeOperators(...lists: Operator[][]): Operator[] {
  const byId = new Map<string, Operator>();
  for (const list of lists) {
    for (const op of list) {
      if (!op?.id) continue;
      const prev = byId.get(op.id);
      if (!prev || (op.updatedAt || "") >= (prev.updatedAt || "")) {
        byId.set(op.id, op);
      }
    }
  }
  return [...byId.values()].sort((a, b) => a.name.localeCompare(b.name));
}

async function fetchOperatorsIndex(): Promise<Operator[]> {
  const { url, key } = scuupConfig();
  if (!url || !key) return [];
  try {
    const res = await fetch(
      `${url}/storage/v1/object/public/${BUCKET}/${INDEX_PATH}?t=${Date.now()}`,
      { cache: "no-store" },
    );
    if (!res.ok) return [];
    const rows = (await res.json()) as CloudRow[];
    if (!Array.isArray(rows)) return [];
    return rows.map(rowToOperator);
  } catch {
    return [];
  }
}

async function uploadOperatorsIndex(ops: Operator[]): Promise<void> {
  const { url, key } = scuupConfig();
  if (!url || !key) return;
  const body = JSON.stringify(ops.map(operatorToRow));
  const res = await fetch(
    `${url}/storage/v1/object/${BUCKET}/${INDEX_PATH}`,
    {
      method: "POST",
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        "x-upsert": "true",
      },
      body,
    },
  );
  if (!res.ok) {
    console.error(
      "[operators-index upload]",
      res.status,
      (await res.text()).slice(0, 200),
    );
  }
}

async function listOperatorsTable(): Promise<Operator[]> {
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
    // Table may not exist yet on Scuup — Storage index is the durable path
    if (res.status !== 404) {
      console.error("[blaast_operators list]", res.status, await res.text());
    }
    return [];
  }
  const rows = (await res.json()) as CloudRow[];
  return rows.map(rowToOperator);
}

async function upsertOperatorTable(op: Operator): Promise<void> {
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
  if (!res.ok && res.status !== 404) {
    const text = await res.text();
    console.error("[blaast_operators upsert]", res.status, text);
  }
}

/** Persist operator so Vercel serverless can read it after create. */
export async function upsertOperatorCloud(op: Operator): Promise<void> {
  const existing = await listOperatorsCloud();
  const next = mergeOperators(existing, [op]);
  await uploadOperatorsIndex(next);
  await upsertOperatorTable(op);
}

export async function getOperatorCloud(id: string): Promise<Operator | null> {
  const all = await listOperatorsCloud();
  return all.find((o) => o.id === id) ?? null;
}

/**
 * Durable Sites list: Storage operators-index.json (+ Postgres when migrated).
 * Vercel /tmp local JSON is empty — cloud is the source of truth in prod.
 */
export async function listOperatorsCloud(): Promise<Operator[]> {
  const [table, index] = await Promise.all([
    listOperatorsTable(),
    fetchOperatorsIndex(),
  ]);
  return mergeOperators(table, index);
}

/** Seed / replace cloud index from a known operator list (local sync). */
export async function syncOperatorsCloud(ops: Operator[]): Promise<number> {
  const existing = await listOperatorsCloud();
  const next = mergeOperators(existing, ops);
  await uploadOperatorsIndex(next);
  for (const op of ops) {
    await upsertOperatorTable(op);
  }
  return next.length;
}
