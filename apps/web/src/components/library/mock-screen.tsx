import { cn } from "@/lib/utils";
import type { SurfaceKind } from "@/lib/library/catalog";

export function MockScreen({
  kind,
  name,
  mobile,
  stepLabel,
  className,
}: {
  kind: SurfaceKind;
  name: string;
  mobile?: boolean;
  stepLabel?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex h-full flex-col bg-neutral-950 text-white",
        className,
      )}
    >
      <div className="flex items-center justify-between px-3 pt-2.5 pb-1.5 text-[9px] text-neutral-400">
        <span>9:41</span>
        <span className="font-medium text-neutral-200">
          {stepLabel ?? name}
        </span>
        <span>●●</span>
      </div>
      <div className="flex-1 overflow-hidden px-2.5 pb-2.5">
        {kind === "sportsbook" && <SportsUI dense={!mobile} />}
        {kind === "casino" && <CasinoUI />}
        {kind === "cashier" && <CashierUI />}
        {kind === "rewards" && <RewardsUI />}
        {kind === "account" && <AccountUI />}
      </div>
      {mobile && (
        <div className="grid grid-cols-4 gap-1 border-t border-white/10 px-2 py-2 text-center text-[8px] text-neutral-500">
          <span className="text-emerald-400">Home</span>
          <span>Sports</span>
          <span>Casino</span>
          <span>Account</span>
        </div>
      )}
    </div>
  );
}

export function avatarColor(kind: SurfaceKind) {
  switch (kind) {
    case "sportsbook":
      return "bg-emerald-700";
    case "casino":
      return "bg-violet-700";
    case "cashier":
      return "bg-amber-700";
    case "rewards":
      return "bg-rose-700";
    default:
      return "bg-neutral-700";
  }
}

function SportsUI({ dense }: { dense?: boolean }) {
  return (
    <div className="flex h-full flex-col gap-1.5">
      <div className="rounded-lg bg-emerald-600/90 px-2 py-1.5 text-[10px] font-semibold">
        Live · Prematch
      </div>
      {[1, 2, 3, dense ? 4 : 3].map((i) => (
        <div
          key={i}
          className="rounded-lg bg-white/5 px-2 py-1.5 ring-1 ring-white/10"
        >
          <div className="mb-1 text-[8px] text-neutral-400">
            Soccer · League {i}
          </div>
          <div className="mb-1.5 flex justify-between text-[9px] font-medium">
            <span>Team A</span>
            <span>Team B</span>
          </div>
          <div className="grid grid-cols-3 gap-1">
            {["1.85", "3.40", "4.20"].map((o) => (
              <div
                key={o}
                className="rounded bg-white/10 py-1 text-center text-[9px] font-semibold text-emerald-300"
              >
                {o}
              </div>
            ))}
          </div>
        </div>
      ))}
      <div className="mt-auto rounded-lg bg-emerald-500 px-2 py-2 text-center text-[10px] font-semibold text-neutral-950">
        Betslip · 2 selections
      </div>
    </div>
  );
}

function CasinoUI() {
  return (
    <div className="flex h-full flex-col gap-1.5">
      <div className="text-[10px] font-semibold">Lobby</div>
      <div className="grid grid-cols-2 gap-1.5">
        {["Slots", "Live", "Jackpot", "New"].map((t, i) => (
          <div
            key={t}
            className={cn(
              "aspect-square rounded-lg ring-1 ring-white/10",
              i % 2 === 0 ? "bg-violet-600/40" : "bg-fuchsia-600/30",
            )}
          >
            <div className="flex h-full items-end p-1.5 text-[8px] font-medium">
              {t}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CashierUI() {
  return (
    <div className="flex h-full flex-col gap-2 pt-2">
      <div className="text-[11px] font-semibold">Deposit</div>
      <div className="rounded-lg bg-white/5 p-2 ring-1 ring-white/10">
        <div className="text-[8px] text-neutral-400">Amount</div>
        <div className="text-[16px] font-semibold">$50.00</div>
      </div>
      {["Card", "Apple Pay", "Crypto"].map((m) => (
        <div
          key={m}
          className="rounded-lg bg-white/5 px-2 py-2 text-[10px] ring-1 ring-white/10"
        >
          {m}
        </div>
      ))}
      <div className="mt-auto rounded-lg bg-amber-500 py-2 text-center text-[10px] font-semibold text-neutral-950">
        Continue
      </div>
    </div>
  );
}

function RewardsUI() {
  return (
    <div className="flex h-full flex-col gap-2 pt-1">
      <div className="rounded-lg bg-gradient-to-br from-rose-600 to-orange-500 p-2">
        <div className="text-[8px] opacity-80">VIP</div>
        <div className="text-[12px] font-semibold">Gold · Level 4</div>
      </div>
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="flex items-center gap-2 rounded-lg bg-white/5 px-2 py-1.5 ring-1 ring-white/10"
        >
          <span className="size-5 rounded-full bg-rose-500/50" />
          <span className="text-[8px] text-neutral-300">
            Won $1,{i}20 · slots
          </span>
        </div>
      ))}
    </div>
  );
}

function AccountUI() {
  return (
    <div className="flex h-full flex-col gap-2 pt-2">
      <div className="flex items-center gap-2">
        <span className="size-8 rounded-full bg-neutral-700" />
        <div>
          <div className="text-[10px] font-semibold">My account</div>
          <div className="text-[8px] text-neutral-400">Verified</div>
        </div>
      </div>
      {["Wallet", "Bonuses", "Limits", "Documents"].map((row) => (
        <div
          key={row}
          className="rounded-lg bg-white/5 px-2 py-2 text-[10px] ring-1 ring-white/10"
        >
          {row}
        </div>
      ))}
    </div>
  );
}
