"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  adminOutlineBtn,
  adminPrimaryBtn,
} from "@/components/admin/admin-shell";
import { normalizeSiteUrl } from "@/lib/admin/normalize-url";
import { suggestFromHostname } from "@/lib/admin/operator-directory";
import { cn } from "@/lib/utils";
import type {
  OperatorReferenceTier,
  OperatorVertical,
  ProductSurface,
} from "@/lib/admin/types";

const VERTICAL_OPTIONS: { id: OperatorVertical; label: string }[] = [
  { id: "crypto_casino", label: "Crypto casino" },
  { id: "traditional_sportsbook", label: "Traditional sportsbook" },
  { id: "hybrid", label: "Hybrid (sports + casino)" },
  { id: "other", label: "Other" },
];

const TIER_OPTIONS: { id: OperatorReferenceTier | ""; label: string }[] = [
  { id: "", label: "Not in reference set" },
  { id: "notable", label: "Notable (best-of shortlist)" },
  { id: "core", label: "Core reference" },
];

const PRODUCT_OPTIONS: { id: ProductSurface; label: string }[] = [
  { id: "sportsbook", label: "Sportsbook" },
  { id: "casino", label: "Casino" },
  { id: "poker", label: "Poker" },
  { id: "cashier", label: "Cashier" },
  { id: "rewards", label: "Rewards & VIP" },
  { id: "account", label: "Account" },
  { id: "promotions", label: "Promotions" },
];

const MARKET_PRESETS = [
  "UK",
  "IE",
  "US",
  "CA",
  "BR",
  "MX",
  "DE",
  "SE",
  "ES",
  "IT",
  "FR",
  "NL",
  "AU",
  "NZ",
  "ZA",
];

export function AddOperatorForm() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [markets, setMarkets] = useState<string[]>(["UK"]);
  const [customMarket, setCustomMarket] = useState("");
  const [tags, setTags] = useState("");
  const [notes, setNotes] = useState("");
  const [products, setProducts] = useState<ProductSurface[]>([
    "sportsbook",
    "casino",
    "cashier",
    "account",
  ]);
  const [vertical, setVertical] = useState<OperatorVertical>("other");
  const [referenceTier, setReferenceTier] = useState<
    OperatorReferenceTier | ""
  >("");
  const [pending, setPending] = useState(false);
  const [faviconFailed, setFaviconFailed] = useState(false);
  const [directoryHint, setDirectoryHint] = useState<string | null>(null);
  const [nameTouched, setNameTouched] = useState(false);

  const hostname = useMemo(() => {
    try {
      const n = normalizeSiteUrl(url);
      return n ? new URL(n).hostname.replace(/^www\./, "") : "";
    } catch {
      return "";
    }
  }, [url]);

  const suggestion = useMemo(
    () => (hostname ? suggestFromHostname(hostname) : null),
    [hostname],
  );

  useEffect(() => {
    setFaviconFailed(false);
    if (!suggestion) {
      setDirectoryHint(null);
      return;
    }
    if (!nameTouched && suggestion.name) {
      setName(suggestion.name);
    }
    if (suggestion.known) {
      setMarkets(suggestion.markets.length ? suggestion.markets : ["UK"]);
      setProducts(suggestion.products);
      setDirectoryHint(
        `${suggestion.operator!.alt} · ${suggestion.operator!.regions.join(", ")} · ${suggestion.operator!.verticals.join(", ")}`,
      );
    } else {
      setDirectoryHint("Not in directory — pick markets manually");
    }
  }, [hostname, suggestion, nameTouched]);

  function toggleProduct(p: ProductSurface) {
    setProducts((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p],
    );
  }

  function toggleMarket(m: string) {
    setMarkets((prev) =>
      prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m],
    );
  }

  function addCustomMarket() {
    const m = customMarket.trim().toUpperCase();
    if (!m) return;
    setMarkets((prev) => (prev.includes(m) ? prev : [...prev, m]));
    setCustomMarket("");
  }

  async function onSubmit() {
    setPending(true);
    try {
      const res = await fetch("/api/admin/operators", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          url: normalizeSiteUrl(url),
          markets,
          tags: tags
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
          products,
          notes: notes || undefined,
          vertical,
          regions: markets,
          referenceTier: referenceTier || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      toast.success("Site added — start brand coverage next");
      router.push(`/admin/operators/${data.operator.id}`);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setPending(false);
    }
  }

  const favicon = suggestion?.favicon;

  // Ensure suggested markets appear as chips even if not in presets
  const marketChips = useMemo(() => {
    const extra = markets.filter((m) => !MARKET_PRESETS.includes(m));
    return [...MARKET_PRESETS, ...extra];
  }, [markets]);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-2">
        {["Identity", "Coverage", "Ready"].map((label, i) => (
          <button
            key={label}
            type="button"
            onClick={() => {
              if (i < step) setStep(i);
            }}
            className={cn(
              "rounded-full px-3 py-1 text-[11px] font-medium transition-colors",
              i === step
                ? "bg-neutral-950 text-white"
                : i < step
                  ? "bg-neutral-200 text-neutral-700"
                  : "bg-neutral-100 text-neutral-400",
            )}
          >
            {i + 1}. {label}
          </button>
        ))}
      </div>

      {step === 0 && (
        <div className="flex flex-col gap-4">
          <Field label="Site / operator name" htmlFor="name">
            <Input
              id="name"
              value={name}
              onChange={(e) => {
                setNameTouched(true);
                setName(e.target.value);
              }}
              placeholder="Stake"
              required
              className="rounded-xl border-neutral-200"
            />
          </Field>
          <Field label="URL" htmlFor="url">
            <div className="relative">
              {favicon && !faviconFailed ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={favicon}
                  alt=""
                  width={18}
                  height={18}
                  className="pointer-events-none absolute top-1/2 left-3 size-[18px] -translate-y-1/2 rounded object-contain"
                  onError={() => setFaviconFailed(true)}
                />
              ) : (
                <span className="pointer-events-none absolute top-1/2 left-3 flex size-[18px] -translate-y-1/2 items-center justify-center rounded bg-neutral-100 text-[9px] font-bold text-neutral-400">
                  {hostname ? hostname.charAt(0).toUpperCase() : "?"}
                </span>
              )}
              <Input
                id="url"
                type="text"
                inputMode="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onBlur={() => setUrl((u) => normalizeSiteUrl(u))}
                placeholder="www.rainbet.com or https://…"
                required
                className="rounded-xl border-neutral-200 pl-10"
              />
            </div>
          </Field>
          {hostname && (
            <div className="space-y-1 text-[12px] text-neutral-500">
              <p>
                Hostname:{" "}
                <span className="font-medium text-neutral-800">{hostname}</span>
              </p>
              {directoryHint && (
                <p
                  className={cn(
                    suggestion?.known
                      ? "text-neutral-700"
                      : "text-neutral-400",
                  )}
                >
                  {suggestion?.known ? "Directory match: " : ""}
                  {directoryHint}
                </p>
              )}
              {suggestion?.known && suggestion.markets.length > 0 && (
                <p className="text-neutral-600">
                  Markets suggested:{" "}
                  <span className="font-medium">
                    {suggestion.markets.join(", ")}
                  </span>
                </p>
              )}
            </div>
          )}
          <button
            type="button"
            disabled={!name.trim() || !url.trim()}
            onClick={() => setStep(1)}
            className={adminPrimaryBtn("w-fit disabled:opacity-50")}
          >
            Next — coverage
          </button>
        </div>
      )}

      {step === 1 && (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label className="text-[12px] text-neutral-500">
              Products (unlocks taxonomy packs)
            </Label>
            <div className="flex flex-wrap gap-1.5">
              {PRODUCT_OPTIONS.map((p) => {
                const on = products.includes(p.id);
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => toggleProduct(p.id)}
                    className={cn(
                      "rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors",
                      on
                        ? "bg-neutral-950 text-white"
                        : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200",
                    )}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>
            <p className="text-[12px] text-neutral-400">
              Every brand runs the same guided queue for the products you enable
              (Place a bet, Casino lobby, Deposit, …).
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <Label className="text-[12px] text-neutral-500">
              Markets
              {suggestion?.known ? (
                <span className="ml-1 font-normal text-neutral-400">
                  (from directory)
                </span>
              ) : null}
            </Label>
            <div className="flex flex-wrap gap-1.5">
              {marketChips.map((m) => {
                const on = markets.includes(m);
                return (
                  <button
                    key={m}
                    type="button"
                    onClick={() => toggleMarket(m)}
                    className={cn(
                      "rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors",
                      on
                        ? "bg-neutral-950 text-white"
                        : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200",
                    )}
                  >
                    {m}
                  </button>
                );
              })}
            </div>
            <div className="flex gap-2">
              <Input
                value={customMarket}
                onChange={(e) => setCustomMarket(e.target.value)}
                placeholder="Other market"
                className="rounded-xl border-neutral-200"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addCustomMarket();
                  }
                }}
              />
              <button
                type="button"
                onClick={addCustomMarket}
                className={adminOutlineBtn()}
              >
                Add
              </button>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setStep(0)}
              className={adminOutlineBtn()}
            >
              Back
            </button>
            <button
              type="button"
              disabled={products.length === 0}
              onClick={() => setStep(2)}
              className={adminPrimaryBtn("disabled:opacity-50")}
            >
              Next — ready
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="flex flex-col gap-4">
          <div className="flex items-start gap-3 rounded-xl bg-neutral-50 p-4 text-[13px] text-neutral-600">
            {favicon && !faviconFailed ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={favicon}
                alt=""
                width={32}
                height={32}
                className="size-8 rounded-lg object-contain ring-1 ring-neutral-200"
              />
            ) : (
              <span className="flex size-8 items-center justify-center rounded-lg bg-neutral-200 text-[12px] font-bold text-neutral-600">
                {name.charAt(0).toUpperCase() || "?"}
              </span>
            )}
            <div>
              <p className="font-semibold text-neutral-950">{name}</p>
              <p className="mt-0.5">{hostname || url}</p>
              <p className="mt-2">
                {products.join(" · ")}
                {markets.length ? ` · ${markets.join(", ")}` : ""}
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Label className="text-[12px] text-neutral-500">Vertical</Label>
            <div className="flex flex-wrap gap-1.5">
              {VERTICAL_OPTIONS.map((v) => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => setVertical(v.id)}
                  className={cn(
                    "rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors",
                    vertical === v.id
                      ? "bg-neutral-950 text-white"
                      : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200",
                  )}
                >
                  {v.label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Label className="text-[12px] text-neutral-500">
              Reference set (for “best / notable” MCP)
            </Label>
            <div className="flex flex-wrap gap-1.5">
              {TIER_OPTIONS.map((t) => (
                <button
                  key={t.id || "none"}
                  type="button"
                  onClick={() => setReferenceTier(t.id)}
                  className={cn(
                    "rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors",
                    referenceTier === t.id
                      ? "bg-neutral-950 text-white"
                      : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200",
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
          <Field label="Tags (optional, comma-separated)" htmlFor="tags">
            <Input
              id="tags"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="crypto, high-roller"
              className="rounded-xl border-neutral-200"
            />
          </Field>
          <Field label="Notes (optional)" htmlFor="notes">
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Research account, geo tips…"
              className="min-h-[72px] rounded-xl border-neutral-200"
            />
          </Field>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setStep(1)}
              className={adminOutlineBtn()}
            >
              Back
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={onSubmit}
              className={adminPrimaryBtn("disabled:opacity-50")}
            >
              {pending ? "Saving…" : "Add site"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={htmlFor} className="text-[12px] text-neutral-500">
        {label}
      </Label>
      {children}
    </div>
  );
}
