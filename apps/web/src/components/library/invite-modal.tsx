"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, Copy } from "lucide-react";
import {
  LibraryOverlay,
  OverlayFaq,
  OverlayStepCards,
} from "@/components/library/library-overlay";
import { useSession } from "@/lib/library/session";

const STEPS = [
  {
    title: "Copy and share link",
    body: "Send your unique invite link to a teammate or collaborator.",
  },
  {
    title: "They join Blaast",
    body: "When they sign up with your link, they get library access under your plan rules.",
  },
  {
    title: "Earn rewards",
    body: "Unlock credits toward Pro as invites convert — details in billing.",
  },
];

const FAQ = [
  {
    q: "What are the referral terms?",
    a: "Rewards apply to new paid seats that stay active past the trial window. Self-invites and duplicate accounts do not count.",
  },
  {
    q: "When do credits appear?",
    a: "After the invited account upgrades. Credits apply automatically on your next invoice.",
  },
  {
    q: "Can I invite outside my company?",
    a: "Yes for independent researchers and agencies. Shared collections and comments are a Pro+ feature.",
  },
];

export function InviteModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { user } = useSession();
  const [link, setLink] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!open || typeof window === "undefined") return;
    const code = user?.id?.slice(0, 8) || "preview";
    setLink(`${window.location.origin}/login?ref=${code}`);
    setCopied(false);
  }, [open, user?.id]);

  const copy = useCallback(async () => {
    if (!link) return;
    await navigator.clipboard.writeText(link);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }, [link]);

  return (
    <LibraryOverlay
      open={open}
      onClose={onClose}
      size="wide"
      title="Invite friends and earn rewards"
      subtitle="Share Blaast with your team"
    >
      <div className="space-y-8 pb-2">
        <p className="max-w-xl text-[14px] leading-relaxed text-[#a3a3a3]">
          Bring designers and researchers into the library. You keep credit when
          they upgrade.
        </p>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <input
            readOnly
            value={link}
            className="h-11 min-w-0 flex-1 rounded-full border-0 bg-white/[0.06] px-4 text-[13px] text-white outline-none"
          />
          <button
            type="button"
            onClick={() => void copy()}
            className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-full bg-white px-5 text-[13px] font-semibold text-[#111]"
          >
            {copied ? (
              <Check className="size-3.5" strokeWidth={2} />
            ) : (
              <Copy className="size-3.5" strokeWidth={1.75} />
            )}
            {copied ? "Copied" : "Copy link"}
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
          {[
            { n: 1, label: "$15 credits", need: "1 invite" },
            { n: 2, label: "Pro week", need: "3 invites" },
            { n: 3, label: "MCP boost", need: "5 invites" },
            { n: 4, label: "Team seat", need: "8 invites" },
            { n: 5, label: "Studio preview", need: "12 invites" },
          ].map((r) => (
            <div
              key={r.n}
              className="rounded-2xl bg-white/[0.04] px-3 py-4 text-center"
            >
              <span className="mx-auto flex size-6 items-center justify-center rounded-full bg-black text-[11px] font-semibold text-white">
                {r.n}
              </span>
              <p className="mt-3 text-[12px] font-semibold text-white">
                {r.label}
              </p>
              <p className="mt-0.5 text-[11px] text-[#636363]">{r.need}</p>
            </div>
          ))}
        </div>

        <OverlayStepCards steps={STEPS} />
        <OverlayFaq items={FAQ} />
      </div>
    </LibraryOverlay>
  );
}
