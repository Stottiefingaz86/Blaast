"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

export default function PreferencesPage() {
  const [theme, setTheme] = useState<"dark" | "system">("dark");
  const [emails, setEmails] = useState(true);

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-semibold tracking-tight">Preferences</h1>
      <p className="mt-2 text-[14px] text-neutral-400">
        Library display and notification defaults.
      </p>

      <div className="mt-8 space-y-6">
        <div>
          <p className="text-[13px] font-medium">Theme</p>
          <div className="mt-2 flex gap-2">
            {(["dark", "system"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTheme(t)}
                className={cn(
                  "rounded-full px-4 py-2 text-[13px] capitalize transition-all",
                  theme === t
                    ? "bg-white text-neutral-950"
                    : "bg-white/[0.08] text-neutral-300 hover:bg-white/[0.12]",
                )}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
        <label className="flex items-center justify-between gap-4 rounded-2xl border border-white/[0.08] px-4 py-3">
          <span className="text-[13px]">Product emails</span>
          <button
            type="button"
            role="switch"
            aria-checked={emails}
            onClick={() => setEmails((v) => !v)}
            className={cn(
              "relative h-6 w-11 rounded-full transition-colors",
              emails ? "bg-emerald-500" : "bg-white/20",
            )}
          >
            <span
              className={cn(
                "absolute top-0.5 left-0.5 size-5 rounded-full bg-white transition-transform",
                emails && "translate-x-5",
              )}
            />
          </button>
        </label>
      </div>
    </div>
  );
}
