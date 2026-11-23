import { Suspense } from "react";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { OperatorDetail } from "@/components/library/operator-detail";
import { RequireAuth } from "@/components/library/require-auth";
import { getPublishedOperator } from "@/lib/library/published-catalog";

export const dynamic = "force-dynamic";

export default async function OperatorPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const h = await headers();
  const host = h.get("x-forwarded-host") || h.get("host") || "localhost:3000";
  const proto = h.get("x-forwarded-proto") || "http";
  const origin = `${proto}://${host}`;
  const operator = await getPublishedOperator(slug, origin);
  if (!operator) notFound();
  return (
    <RequireAuth>
      <Suspense
        fallback={
          <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a]">
            <div className="size-8 animate-pulse rounded-full bg-white/20" />
          </div>
        }
      >
        <OperatorDetail operator={operator} />
      </Suspense>
    </RequireAuth>
  );
}
