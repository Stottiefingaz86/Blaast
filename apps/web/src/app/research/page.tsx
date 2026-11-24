"use client";

import Link from "next/link";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { X } from "lucide-react";
import { SiteHeader } from "@/components/library/site-header";
import { EmailTracker } from "@/components/library/email-tracker";
import type { CatalogEmail, CatalogOperator } from "@/lib/library/catalog";
import { useSession } from "@/lib/library/session";

function ResearchBody() {
  const { loggedIn, ready } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const operatorSlug = searchParams.get("operator");
  const emailId = searchParams.get("email");
  const [catalog, setCatalog] = useState<CatalogOperator[]>([]);
  const [loading, setLoading] = useState(Boolean(operatorSlug));
  const [emailOpen, setEmailOpen] = useState<CatalogEmail | null>(null);

  useEffect(() => {
    if (ready && !loggedIn) router.replace("/");
  }, [ready, loggedIn, router]);

  useEffect(() => {
    if (!operatorSlug) {
      setCatalog([]);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const res = await fetch("/api/library/catalog");
        const data = (await res.json()) as { operators?: CatalogOperator[] };
        if (!cancelled) setCatalog(data.operators ?? []);
      } catch {
        if (!cancelled) setCatalog([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [operatorSlug]);

  const operator = useMemo(
    () => catalog.find((o) => o.slug === operatorSlug) ?? null,
    [catalog, operatorSlug],
  );

  useEffect(() => {
    if (!operator || !emailId) return;
    const hit = (operator.emails ?? []).find((e) => e.id === emailId);
    if (hit) setEmailOpen(hit);
  }, [operator, emailId]);

  if (!ready || !loggedIn) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a]">
        <div className="size-8 animate-pulse rounded-full bg-white/20" />
      </div>
    );
  }

  return (
    <div className="lib-surface min-h-screen">
      <div className="lib-chrome lib-hairline sticky top-0 z-[100] border-b">
        <SiteHeader tab="research" searchPlaceholder="Search research…" />
      </div>
      <div className="mx-auto max-w-[1400px] px-5 py-10">
        {!operatorSlug ? (
          <div className="mx-auto flex max-w-lg flex-col items-center py-16 text-center">
            <p className="text-[12px] font-medium tracking-[0.12em] text-neutral-500 uppercase">
              Research
            </p>
            <h1 className="mt-3 text-[28px] font-semibold tracking-tight text-white">
              Email Tracker &amp; audits
            </h1>
            <p className="mt-3 text-[15px] leading-relaxed text-neutral-400">
              Deploy from a brand&apos;s Emails tab to review the lifecycle
              timeline here in more detail. Journey audits and CX benchmarks
              land next.
            </p>
            <Link
              href="/library"
              className="mt-8 inline-flex h-10 items-center rounded-full bg-white px-5 text-[13px] font-medium text-neutral-950"
            >
              Back to Library
            </Link>
          </div>
        ) : loading ? (
          <div className="flex justify-center py-24">
            <div className="size-8 animate-pulse rounded-full bg-white/20" />
          </div>
        ) : !operator ? (
          <div className="py-16 text-center">
            <p className="text-[15px] text-white">Operator not found</p>
            <Link
              href="/library"
              className="mt-4 inline-flex text-[13px] text-neutral-400 hover:text-white"
            >
              Back to library
            </Link>
          </div>
        ) : (
          <EmailTracker
            emails={operator.emails ?? []}
            operatorName={operator.name}
            slug={operator.slug}
            hostname={operator.hostname}
            logoUrl={operator.logoUrl}
            variant="research"
            onOpen={setEmailOpen}
          />
        )}
      </div>

      {emailOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            aria-label="Close"
            onClick={() => setEmailOpen(null)}
          />
          <div className="relative z-10 flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-neutral-950 shadow-2xl">
            <div className="flex items-start gap-3 border-b border-white/10 px-4 py-3">
              <div className="min-w-0 flex-1">
                <p className="text-[11px] capitalize text-white/45">
                  {emailOpen.category.replace(/_/g, " ")} · {emailOpen.from}
                </p>
                <h2 className="truncate text-[15px] font-semibold text-white">
                  {emailOpen.subject}
                </h2>
                <p className="text-[11px] text-neutral-500">
                  {new Date(emailOpen.receivedAt).toLocaleString()}
                </p>
              </div>
              <button
                type="button"
                aria-label="Close"
                onClick={() => setEmailOpen(null)}
                className="flex size-9 shrink-0 items-center justify-center rounded-full text-neutral-400 hover:bg-white/[0.06] hover:text-white"
              >
                <X className="size-4" />
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-auto bg-[#E9EAEE]">
              {emailOpen.html ? (
                <iframe
                  title={emailOpen.subject}
                  sandbox=""
                  srcDoc={emailOpen.html}
                  className="h-[70vh] w-full bg-white"
                />
              ) : (
                <p className="p-6 text-[13px] text-neutral-700 whitespace-pre-wrap">
                  {emailOpen.snippet || "No preview"}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/** Research — email tracker detail now; audits/CX later. */
export default function ResearchPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a]">
          <div className="size-8 animate-pulse rounded-full bg-white/20" />
        </div>
      }
    >
      <ResearchBody />
    </Suspense>
  );
}
