import { redirect, notFound } from "next/navigation";
import { headers } from "next/headers";
import { getPublishedFlow } from "@/lib/library/published-catalog";

export const dynamic = "force-dynamic";

/**
 * Deep links still resolve, but flow screens open as an in-page step carousel
 * on the operator detail — not the full-page video theater.
 */
export default async function FlowPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const h = await headers();
  const host = h.get("x-forwarded-host") || h.get("host") || "localhost:3000";
  const proto = h.get("x-forwarded-proto") || "http";
  const origin = `${proto}://${host}`;
  const hit = await getPublishedFlow(id, origin);
  if (!hit) notFound();
  redirect(
    `/operators/${hit.operator.slug}?tab=flows&flow=${encodeURIComponent(id)}`,
  );
}
