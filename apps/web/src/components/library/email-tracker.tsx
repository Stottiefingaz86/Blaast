"use client";

import {
  useCallback,
  useMemo,
  useState,
  type MouseEvent,
} from "react";
import { Check, Copy } from "lucide-react";
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
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString(undefined, {
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
 * Email timeline — full email stills only, timestamps, hover to copy.
 */
export function EmailTracker({
  emails,
  operatorName,
  slug,
  variant = "library",
  onOpen,
}: Props) {
  const [toast, setToast] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [hoverId, setHoverId] = useState<string | null>(null);

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
    async (mail: CatalogEmail, e?: MouseEvent) => {
      e?.stopPropagation();
      if (!mail.posterUrl) {
        showToast("No image for this email");
        return;
      }
      setBusyId(mail.id);
      try {
        const result = await copyImageAsPng(
          mail.posterUrl,
          `${slug}-email.png`,
        );
        showToast(
          result === "clipboard"
            ? "Copied"
            : result === "download"
              ? "Downloaded"
              : "Couldn’t copy",
        );
      } finally {
        setBusyId(null);
      }
    },
    [showToast, slug],
  );

  if (ordered.length === 0) {
    return (
      <div className="py-20 text-center">
        <p className="text-[14px] text-neutral-500">
          No emails for {operatorName} yet
        </p>
      </div>
    );
  }

  return (
    <div className="relative mx-auto w-full max-w-2xl">
      {toast && (
        <div className="pointer-events-none fixed bottom-8 left-1/2 z-[210] -translate-x-1/2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3.5 py-2 text-[12px] font-medium text-neutral-950 shadow-lg">
            <Check className="size-3.5" strokeWidth={2} />
            {toast}
          </span>
        </div>
      )}

      <div className="space-y-12">
        {byDay.map(([day, dayMails]) => (
          <section key={day}>
            <p className="mb-5 text-center text-[12px] text-neutral-500">
              {formatDay(dayMails[0]!.receivedAt)}
            </p>
            <ol className="flex flex-col gap-10">
              {dayMails.map((mail) => {
                const hovering = hoverId === mail.id;
                return (
                  <li key={mail.id} className="flex flex-col items-center">
                    <p className="mb-3 text-[12px] tabular-nums text-neutral-500">
                      {formatClock(mail.receivedAt)}
                    </p>
                    <div
                      className="group relative w-full max-w-[440px]"
                      onMouseEnter={() => setHoverId(mail.id)}
                      onMouseLeave={() => setHoverId(null)}
                    >
                      <button
                        type="button"
                        onClick={() => onOpen?.(mail)}
                        className={cn(
                          "lib-card relative w-full overflow-hidden rounded-[28px] p-4 text-left outline-none transition sm:p-5",
                          "ring-0 hover:ring-2 hover:ring-white/20 focus-visible:ring-2 focus-visible:ring-white/40",
                        )}
                      >
                        <div
                          className={cn(
                            "overflow-hidden rounded-2xl bg-[#E9EAEE] ring-1 ring-black/5",
                            variant === "research"
                              ? "aspect-[3/4] max-h-[560px]"
                              : "aspect-[3/4] max-h-[480px]",
                          )}
                        >
                          {mail.html ? (
                            <iframe
                              title="Email"
                              sandbox=""
                              srcDoc={mail.html}
                              className="pointer-events-none h-[200%] w-[200%] origin-top-left scale-50 bg-[#E9EAEE]"
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
                            <div className="flex h-full items-center justify-center text-[12px] text-neutral-400">
                              Email
                            </div>
                          )}
                        </div>
                      </button>

                      <div
                        className={cn(
                          "pointer-events-none absolute inset-x-0 bottom-6 flex justify-center transition duration-200",
                          hovering
                            ? "translate-y-0 opacity-100"
                            : "translate-y-1 opacity-0",
                        )}
                      >
                        <button
                          type="button"
                          disabled={!mail.posterUrl || busyId === mail.id}
                          onClick={(e) => void copyImage(mail, e)}
                          className={cn(
                            "pointer-events-auto inline-flex h-10 items-center gap-2 rounded-full bg-white px-5 text-[13px] font-semibold text-neutral-950 shadow-lg",
                            "hover:bg-neutral-100 disabled:opacity-50",
                          )}
                        >
                          <Copy className="size-3.5" strokeWidth={2} />
                          {busyId === mail.id ? "Copying…" : "Copy image"}
                        </button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ol>
          </section>
        ))}
      </div>
    </div>
  );
}
