"use client";

import { useState } from "react";
import { useAccount } from "@/lib/platform/account-store";
import { planAllowsScim } from "@/lib/platform/plans";
import { cn } from "@/lib/utils";

export default function TeamSettingsPage() {
  const account = useAccount();
  const [email, setEmail] = useState("");
  const scimOk = planAllowsScim(account.plan);
  const canInvite = account.plan === "team" || account.plan === "enterprise";

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-semibold tracking-tight">Team</h1>
      <p className="mt-2 text-[14px] text-neutral-400">
        Members, roles, and enterprise identity (SAML & SCIM).
      </p>

      <section className="mt-8">
        <h2 className="text-[13px] font-medium text-neutral-400">Members</h2>
        <ul className="mt-3 divide-y divide-white/[0.06] rounded-2xl border border-white/[0.08]">
          {account.members.map((m) => (
            <li key={m.id} className="flex items-center gap-3 px-4 py-3">
              <span className="flex size-8 items-center justify-center rounded-full bg-white/[0.1] text-[11px] font-semibold">
                {m.name.slice(0, 1).toUpperCase()}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[14px] font-medium">{m.name}</p>
                <p className="truncate text-[12px] text-neutral-500">
                  {m.email} · {m.role}
                </p>
              </div>
              {m.role !== "owner" && (
                <button
                  type="button"
                  onClick={() => account.removeMember(m.id)}
                  className="text-[12px] text-neutral-500 hover:text-white"
                >
                  Remove
                </button>
              )}
            </li>
          ))}
        </ul>

        <form
          className="mt-4 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (!canInvite || !email.trim()) return;
            account.inviteMember(email.trim());
            setEmail("");
          }}
        >
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="teammate@company.com"
            disabled={!canInvite}
            className="h-10 flex-1 rounded-full border border-white/[0.12] bg-transparent px-4 text-[13px] outline-none placeholder:text-neutral-600 disabled:opacity-40"
          />
          <button
            type="submit"
            disabled={!canInvite}
            className={cn(
              "h-10 rounded-full px-4 text-[13px] font-medium",
              canInvite
                ? "bg-white text-neutral-950"
                : "cursor-not-allowed bg-white/[0.06] text-neutral-500",
            )}
          >
            Invite
          </button>
        </form>
        {!canInvite && (
          <p className="mt-2 text-[12px] text-neutral-500">
            Invites require Team or Enterprise.
          </p>
        )}
      </section>

      <section className="mt-12 border-t border-white/[0.08] pt-8">
        <h2 className="text-lg font-semibold">SAML & SCIM</h2>
        <p className="mt-1 text-[13px] text-neutral-500">
          Enterprise SSO and automated user provisioning via SCIM 2.0.
        </p>

        {!scimOk ? (
          <div className="mt-4 rounded-2xl border border-white/[0.08] bg-white/[0.03] px-4 py-4 text-[13px] text-neutral-400">
            Available on Enterprise.{" "}
            <a href="/pricing" className="text-white underline decoration-white/30">
              Contact sales
            </a>
          </div>
        ) : (
          <div className="mt-5 space-y-4">
            <label className="flex items-center justify-between rounded-2xl border border-white/[0.08] px-4 py-3">
              <span className="text-[13px]">Enable SCIM provisioning</span>
              <button
                type="button"
                role="switch"
                aria-checked={account.scim.enabled}
                onClick={() => account.setScimEnabled(!account.scim.enabled)}
                className={cn(
                  "relative h-6 w-11 rounded-full transition-colors",
                  account.scim.enabled ? "bg-emerald-500" : "bg-white/20",
                )}
              >
                <span
                  className={cn(
                    "absolute top-0.5 left-0.5 size-5 rounded-full bg-white transition-transform",
                    account.scim.enabled && "translate-x-5",
                  )}
                />
              </button>
            </label>
            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4 text-[12px]">
              <p className="text-neutral-500">SCIM endpoint</p>
              <code className="mt-1 block break-all text-neutral-200">
                {account.scim.endpoint}
              </code>
              <p className="mt-3 text-neutral-500">Bearer token</p>
              <code className="mt-1 block text-neutral-200">
                {account.scim.bearerHint}
              </code>
              <button
                type="button"
                onClick={() => account.rotateScimToken()}
                className="mt-3 rounded-full border border-white/[0.12] px-3 py-1.5 text-[12px] hover:bg-white/[0.06]"
              >
                Rotate token
              </button>
              {account.scim.lastSyncAt && (
                <p className="mt-3 text-neutral-500">
                  Last sync {new Date(account.scim.lastSyncAt).toLocaleString()}
                </p>
              )}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
