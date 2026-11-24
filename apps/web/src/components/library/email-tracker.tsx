"use client";

import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import {
  Check,
  Copy,
  ExternalLink,
  ImageIcon,
  Mail,
  Rocket,
} from "lucide-react";
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
  if (category === "verify") return "Verify email";
  if (category === "welcome") return "Welcome email";
  if (category === "bonus") return "Bonus email";
  if (category === "deposit_nudge") return "Deposit email";
  if (category === "vip") return "VIP email";
  if (category === "reactivation") return "Reactivation email";
  return category.replace(/_/g, " ");
}

function formatClock(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDay(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "Unknown date";
  return d.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
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
  /** Library tab = compact; Research = roomier detail */
  variant?: "library" | "research";
  onOpen?: (mail: CatalogEmail) => void;
};

/**
 * CRM lifecycle Email Tracker — chronological arrivals with copy / deploy.
 * Research surface reuses the same component for deeper review later.
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
  const researchHref = `/research?operator=${encodeURIComponent(slug)}`;

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
    <div className={cn("w-full", variant === "research" && "max-w-3xl")}>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={logoUrl}
                alt=""
                className="size-7 rounded-lg bg-white object-contain p-0.5"
              />
            ) : (
              <span className="flex size-7 items-center justify-center rounded-lg bg-white/10">
                <Mail className="size-3.5 text-white" />
              </span>
            )}
            <div>
              <h2 className="text-[15px] font-semibold text-white">
                Email Tracker
              </h2>
              <p className="text-[12px] text-neutral-500">
                {operatorName} · research inbox timeline
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => void copyAlias()}
            className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-white/[0.06] px-2.5 py-1 text-[11px] text-neutral-400 hover:bg-white/[0.1] hover:text-white"
            title="Copy research alias"
          >
            <Copy className="size-3" />
            {alias}
          </button>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {toast && (
            <span className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white/[0.1] px-3 text-[12px] font-medium text-white">
              <Check className="size-3.5" />
              {toast}
            </span>
          )}
          {variant === "library" ? (
            <Link
              href={researchHref}
              className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white px-4 text-[12px] font-semibold text-neutral-950 hover:bg-white/90"
            >
              <Rocket className="size-3.5" strokeWidth={1.75} />
              Deploy
            </Link>
          ) : (
            <Link
              href={`/operators/${slug}?tab=emails`}
              className="inline-flex h-9 items-center gap-1.5 rounded-full border border-white/15 px-4 text-[12px] font-medium text-white hover:bg-white/[0.06]"
            >
              <ExternalLink className="size-3.5" />
              Open in Library
            </Link>
          )}
        </div>
      </div>

      {ordered.length === 0 ? (
        <div className="rounded-[24px] border border-dashed border-white/10 bg-white/[0.02] px-6 py-14 text-center">
          <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-white/[0.06]">
            <Mail className="size-5 text-neutral-400" />
          </div>
          <p className="text-[15px] font-medium text-white">
            Waiting for research mail
          </p>
          <p className="mx-auto mt-2 max-w-md text-[13px] leading-relaxed text-neutral-500">
            Sign up on {operatorName} with{" "}
            <span className="text-neutral-300">{alias}</span>. Arrivals land on
            this timeline with time stamps. Deploy opens the fuller Research
            view.
          </p>
          <div className="relative mx-auto mt-10 max-w-sm">
            <div className="absolute top-2 bottom-2 left-[19px] w-px bg-white/10" />
            {["Sign up", "Verify email", "Welcome"].map((label, i) => (
              <div key={label} className="relative flex gap-4 pb-6 last:pb-0">
                <span className="relative z-10 mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-full border border-white/10 bg-[#1a1a1a] text-[11px] text-neutral-500">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="min-w-0 flex-1 rounded-2xl border border-white/[0.06] bg-white/[0.03] px-4 py-3">
                  <p className="text-[13px] text-neutral-400">{label}</p>
                  <p className="mt-0.5 text-[11px] text-neutral-600">
                    Pending · —:—
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          {byDay.map(([day, dayMails]) => (
            <section key={day}>
              <p className="mb-4 text-[11px] font-medium tracking-wide text-neutral-500 uppercase">
                {formatDay(dayMails[0]!.receivedAt)}
              </p>
              <ol className="relative space-y-0">
                <div className="absolute top-3 bottom-3 left-[19px] w-px bg-white/10" />
                {dayMails.map((mail, i) => (
                  <li key={mail.id} className="relative flex gap-4 pb-6 last:pb-0">
                    <div className="relative z-10 flex w-10 shrink-0 flex-col items-center">
                      <span
                        className={cn(
                          "flex size-10 items-center justify-center rounded-full border bg-[#1a1a1a] text-[10px] font-semibold tabular-nums",
                          i === dayMails.length - 1
                            ? "border-white/30 text-white"
                            : "border-white/10 text-neutral-400",
                        )}
                      >
                        {formatClock(mail.receivedAt)}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="overflow-hidden rounded-[22px] border border-white/[0.08] bg-white/[0.03]">
                        <button
                          type="button"
                          onClick={() => onOpen?.(mail)}
                          className="block w-full text-left outline-none transition hover:bg-white/[0.03]"
                        >
                          <div className="flex flex-wrap items-center gap-2 px-4 pt-3.5">
                            <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] capitalize text-neutral-200">
                              {categoryLabel(mail.category)}
                            </span>
                            <span className="text-[11px] text-neutral-600">
                              {new Date(mail.receivedAt).toLocaleString()}
                            </span>
                          </div>
                          <div className="px-4 pt-2 pb-3">
                            <p className="truncate text-[14px] font-medium text-white">
                              {mail.subject}
                            </p>
                            <p className="mt-0.5 truncate text-[12px] text-neutral-500">
                              {mail.from}
                            </p>
                            {mail.snippet && variant === "research" && (
                              <p className="mt-2 line-clamp-2 text-[12px] leading-relaxed text-neutral-400">
                                {mail.snippet.replace(/<[^>]+>/g, " ")}
                              </p>
                            )}
                          </div>
                          <div
                            className={cn(
                              "mx-4 mb-3 overflow-hidden rounded-xl bg-[#E9EAEE] ring-1 ring-white/10",
                              variant === "research"
                                ? "aspect-[16/9]"
                                : "aspect-[16/10] max-h-[200px]",
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
                              <div className="flex h-full items-center justify-center bg-neutral-900 text-[12px] text-white/40">
                                Email
                              </div>
                            )}
                          </div>
                        </button>
                        <div className="flex flex-wrap items-center gap-2 border-t border-white/[0.06] px-3 py-2.5">
                          <button
                            type="button"
                            disabled={!mail.posterUrl || busyId === mail.id}
                            onClick={() => void copyImage(mail)}
                            className="inline-flex h-8 items-center gap-1.5 rounded-full bg-white/[0.08] px-3 text-[11px] font-medium text-white hover:bg-white/[0.12] disabled:opacity-40"
                          >
                            <ImageIcon className="size-3.5" strokeWidth={1.75} />
                            {busyId === mail.id ? "Copying…" : "Copy image"}
                          </button>
                          {variant === "library" ? (
                            <Link
                              href={`${researchHref}&email=${encodeURIComponent(mail.id)}`}
                              className="inline-flex h-8 items-center gap-1.5 rounded-full bg-white px-3 text-[11px] font-semibold text-neutral-950 hover:bg-white/90"
                            >
                              <Rocket className="size-3.5" strokeWidth={1.75} />
                              Deploy
                            </Link>
                          ) : null}
                          <button
                            type="button"
                            onClick={() => onOpen?.(mail)}
                            className="ml-auto text-[11px] text-neutral-500 hover:text-white"
                          >
                            Open
                          </button>
                        </div>
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
