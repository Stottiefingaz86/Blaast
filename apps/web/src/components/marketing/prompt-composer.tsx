"use client";

import { ArrowUp, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

import { SCENARIO_PROMPTS } from "@/lib/marketing/operator-logos";

export const DESIGN_PROMPTS = SCENARIO_PROMPTS;

/** Design brief composer — rotating operator prompts, not a library search. */
export function PromptComposer({
  onSend,
  className,
  size = "lg",
}: {
  onSend?: (value: string) => void;
  className?: string;
  size?: "lg" | "md";
}) {
  const [value, setValue] = useState("");
  const [promptIdx, setPromptIdx] = useState(0);
  const [fade, setFade] = useState(true);
  const canSend = value.trim().length > 0;
  const rotating = DESIGN_PROMPTS[promptIdx];

  useEffect(() => {
    if (value) return;
    const id = window.setInterval(() => {
      setFade(false);
      window.setTimeout(() => {
        setPromptIdx((i) => (i + 1) % DESIGN_PROMPTS.length);
        setFade(true);
      }, 220);
    }, 3200);
    return () => window.clearInterval(id);
  }, [value]);

  function submit(next?: string) {
    const text = (next ?? value).trim();
    if (!text) return;
    onSend?.(text);
    setValue("");
  }

  return (
    <div className={cn("w-full", className)}>
      <div
        className={cn(
          "flex items-end gap-2 border border-neutral-200 bg-white shadow-[0_12px_48px_rgba(0,0,0,0.08)] transition-shadow duration-300 focus-within:shadow-[0_16px_56px_rgba(0,0,0,0.12)]",
          size === "lg" ? "rounded-[22px] p-2.5" : "rounded-2xl p-2",
        )}
      >
        <div
          className={cn(
            "flex shrink-0 items-center justify-center rounded-xl bg-neutral-100 text-neutral-500",
            size === "lg" ? "size-11" : "size-9",
          )}
        >
          <Sparkles className={size === "lg" ? "size-5" : "size-4"} />
        </div>
        <div className="relative min-h-[44px] flex-1">
          <textarea
            rows={1}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                submit();
              }
            }}
            aria-label="Design brief"
            className={cn(
              "relative z-10 w-full resize-none bg-transparent text-neutral-950 outline-none",
              size === "lg"
                ? "min-h-[44px] py-3 text-[15px] sm:text-[16px]"
                : "min-h-[36px] py-2 text-[14px]",
            )}
          />
          {!value && (
            <span
              aria-hidden
              className={cn(
                "pointer-events-none absolute inset-0 flex items-center text-neutral-400 transition-opacity duration-200",
                size === "lg"
                  ? "py-3 text-[15px] sm:text-[16px]"
                  : "py-2 text-[14px]",
                fade ? "opacity-100" : "opacity-0",
              )}
            >
              {rotating}
            </span>
          )}
        </div>
        <button
          type="button"
          aria-label="Send brief"
          disabled={!canSend}
          onClick={() => submit()}
          className={cn(
            "flex shrink-0 items-center justify-center rounded-full transition-all duration-200",
            size === "lg" ? "size-11" : "size-9",
            canSend
              ? "bg-neutral-950 text-white hover:scale-105 active:scale-95"
              : "bg-neutral-100 text-neutral-400",
          )}
        >
          <ArrowUp className="size-4" strokeWidth={2.25} />
        </button>
      </div>

      <div className="mt-4 flex flex-wrap justify-center gap-2">
        {DESIGN_PROMPTS.slice(0, 6).map((prompt) => (
          <button
            key={prompt}
            type="button"
            onClick={() => submit(prompt)}
            className="rounded-full border border-neutral-200 bg-white px-3.5 py-2 text-left text-[12px] font-medium text-neutral-600 transition-colors hover:border-neutral-300 hover:bg-neutral-50 hover:text-neutral-950 sm:text-[13px]"
          >
            {prompt}
          </button>
        ))}
      </div>
    </div>
  );
}
