"use client";

import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import { Check, Copy, ImageIcon } from "lucide-react";
import type { CatalogEmail } from "@/lib/library/catalog";
import { copyImageAsPng } from "@/lib/library/media-actions";
import { cn } from "@/lib/utils";

export function researchAliasFor(slug: string, hostname?: string) {
  const base =
    (hostname ?? slug)
      .toLowerCase()
      .replace(/^www\./, "")
      .split(".")[0] ?? slug;
  const key = base.replace(/[^a-z0-9]+/gi, "");
  return `scuup678+rs${key}@gmail.com`;
}

function categoryLabel(category: string) {
  if (category === "verify") return "Verify";
  if (category === "welcome") return "Welcome";
  if (category === "bonus") return "Bonus";
  if (category === "deposit_nudge") return "Deposit";
  if (category === "vip") return "VIP";
  if (category === "reactivation") return "Reactivation";
  return category.replace(/_/g, " ");
}

function formatClock(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatDay(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "Unknown date";
  return d.toLocaleDateString(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
}

function dayKey(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "unknown";
  return d.toISOString().slice(0, 10);
}

type Props = {
  emails: CatalogEmail[];
  operatorName: string;
  slug: string;
  hostname?: string;
  logoUrl?: string;
  variant?: "library" | "research";
  onOpen?: (mail: CatalogEmail) => void;
};

/**
 * Lifecycle email timeline — arrivals by time, preview + copy image.
 * Fuller CRM review lives under Research (quiet link, not a fake “Deploy”).
 */
export function EmailTracker({
  emails,
  operatorName,
  slug,
  hostname,
  logoUrl,
  variant = "library",
  onOpen,
}: Props) {
  const [toast, setToast] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const alias = researchAliasFor(slug, hostname);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2200);
  }, []);

  const ordered = useMemo(
    () =>
      [...emails].sort(
        (a, b) =>
          new Date(a.receivedAt).getTime() - new Date(b.receivedAt).getTime(),
      ),
    [emails],
  );

  const byDay = useMemo(() => {
    const map = new Map<string, CatalogEmail[]>();
    for (const mail of ordered) {
      const key = dayKey(mail.receivedAt);
      const list = map.get(key) ?? [];
      list.push(mail);
      map.set(key, list);
    }
    return [...map.entries()];
  }, [ordered]);

  const copyImage = useCallback(
    async (mail: CatalogEmail) => {
      if (!mail.posterUrl) {
        showToast("No image for this email");
        return;
      }
      setBusyId(mail.id);
      try {
        const result = await copyImageAsPng(
          mail.posterUrl,
          `${slug}-${mail.category || "email"}.png`,
        );
        showToast(
          result === "clipboard"
            ? "Image copied"
            : result === "download"
              ? "Image downloaded"
              : "Couldn’t copy image",
        );
      } finally {
        setBusyId(null);
      }
    },
    [showToast, slug],
  );

  const copyAlias = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(alias);
      showToast("Alias copied");
    } catch {
      showToast("Couldn’t copy alias");
    }
  }, [alias, showToast]);

  return (
    <div
      className={cn(
        "mx-auto w-full",
        variant === "research" ? "max-w-2xl" : "max-w-3xl",
      )}
    >
      <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[12px] text-neutral-500">
            {ordered.length} email{ordered.length === 1 ? "" : "s"} · {operatorName}
          </p>
          <button
            type="button"
            onClick={() => void copyAlias()}
            className="mt-1.5 inline-flex max-w-full items-center gap-1.5 text-[12px] text-neutral-400 transition hover:text-white"
            title="Copy research alias"
          >
            <Copy className="size-3 shrink-0 opacity-60" />
            <span className="truncate">{alias}</span>
          </button>
        </div>
        <div className="flex items-center gap-3">
          {toast && (
            <span className="inline-flex items-center gap-1.5 text-[12px] text-neutral-300">
              <Check className="size-3.5" />
              {toast}
            </span>
          )}
          {variant === "library" ? (
            <Link
              href={`/research?operator=${encodeURIComponent(slug)}`}
              className="text-[12px] text-neutral-500 underline-offset-2 hover:text-white hover:underline"
            >
              Open in Research
            </Link>
          ) : (
            <Link
              href={`/operators/${slug}?tab=emails`}
              className="text-[12px] text-neutral-500 underline-offset-2 hover:text-white hover:underline"
            >
              Back to Library
            </Link>
          )}
        </div>
      </div>

      {ordered.length === 0 ? (
        <div className="py-16 text-center">
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={logoUrl}
              alt=""
              className="mx-auto size-10 rounded-xl bg-white object-contain p-1"
            />
          ) : null}
          <p className="mt-4 text-[15px] font-medium text-white">
            No emails yet
          </p>
          <p className="mx-auto mt-2 max-w-sm text-[13px] leading-relaxed text-neutral-500">
            Sign up on {operatorName} with the research alias. Messages show
            here in order with the time they arrived.
          </p>
        </div>
      ) : (
        <div className="space-y-10">
          {byDay.map(([day, dayMails]) => (
            <section key={day}>
              <p className="mb-5 text-[12px] text-neutral-500">
                {formatDay(dayMails[0]!.receivedAt)}
              </p>
              <ol className="relative">
                <div
                  aria-hidden
                  className="absolute top-2 bottom-2 left-[5px] w-px bg-white/[0.08]"
                />
                {dayMails.map((mail) => (
                  <li key={mail.id} className="relative flex gap-5 pb-8 last:pb-0">
                    <div className="relative z-10 mt-1.5 flex w-3 shrink-0 justify-center">
                      <span className="size-2.5 rounded-full bg-white ring-4 ring-[#111]" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="mb-2.5 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                        <span className="text-[13px] font-medium tabular-nums text-white">
                          {formatClock(mail.receivedAt)}
                        </span>
                        <span className="text-[12px] text-neutral-500">
                          {categoryLabel(mail.category)}
                        </span>
                        <span className="truncate text-[12px] text-neutral-600">
                          {mail.from}
                        </span>
                      </div>
                      <p className="mb-3 text-[14px] font-medium text-neutral-200">
                        {mail.subject}
                      </p>
                      <button
                        type="button"
                        onClick={() => onOpen?.(mail)}
                        className="group block w-full overflow-hidden rounded-2xl bg-[#E9EAEE] text-left ring-1 ring-white/10 transition hover:ring-white/25"
                      >
                        <div
                          className={cn(
                            "overflow-hidden",
                            variant === "research"
                              ? "aspect-[16/10]"
                              : "aspect-[16/10] max-h-[220px]",
                          )}
                        >
                          {mail.html ? (
                            <iframe
                              title={mail.subject}
                              sandbox=""
                              srcDoc={mail.html}
                              className="pointer-events-none h-[200%] w-[200%] origin-top-left scale-50 bg-white"
                            />
                          ) : mail.posterUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              alt=""
                              src={mail.posterUrl}
                              loading="lazy"
                              className="h-full w-full object-cover object-top"
                            />
                          ) : (
                            <div className="flex h-full min-h-[120px] items-center justify-center bg-neutral-200 text-[12px] text-neutral-500">
                              No preview
                            </div>
                          )}
                        </div>
                      </button>
                      <div className="mt-2.5 flex items-center gap-3">
                        <button
                          type="button"
                          disabled={!mail.posterUrl || busyId === mail.id}
                          onClick={() => void copyImage(mail)}
                          className="inline-flex items-center gap-1.5 text-[12px] text-neutral-400 transition hover:text-white disabled:opacity-40"
                        >
                          <ImageIcon className="size-3.5" strokeWidth={1.75} />
                          {busyId === mail.id ? "Copying…" : "Copy image"}
                        </button>
                        <button
                          type="button"
                          onClick={() => onOpen?.(mail)}
                          className="text-[12px] text-neutral-400 transition hover:text-white"
                        >
                          Open
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ol>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
