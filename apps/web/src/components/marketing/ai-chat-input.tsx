"use client";

import { ArrowUp, Sparkles } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

/** Lander / MCP AI prompt with a clear Send control. */
export function AiChatInput({
  placeholder = "AI chat & search",
  onSend,
  className,
}: {
  placeholder?: string;
  onSend?: (value: string) => void;
  className?: string;
}) {
  const [value, setValue] = useState("");
  const canSend = value.trim().length > 0;

  function submit() {
    if (!canSend) return;
    onSend?.(value.trim());
    setValue("");
  }

  return (
    <div
      className={cn(
        "flex items-end gap-2 rounded-2xl border border-neutral-200 bg-white p-2 shadow-[0_8px_40px_rgba(0,0,0,0.06)] transition-shadow duration-300 focus-within:shadow-[0_12px_48px_rgba(0,0,0,0.1)]",
        className,
      )}
    >
      <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-neutral-100 text-neutral-500">
        <Sparkles className="size-4" />
      </div>
      <textarea
        rows={1}
        value={value}
        placeholder={placeholder}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            submit();
          }
        }}
        className="max-h-32 min-h-[36px] flex-1 resize-none bg-transparent py-2 text-[14px] text-neutral-900 outline-none placeholder:text-neutral-400"
      />
      <button
        type="button"
        aria-label="Send"
        disabled={!canSend}
        onClick={submit}
        className={cn(
          "flex size-9 shrink-0 items-center justify-center rounded-full transition-all duration-200",
          canSend
            ? "bg-neutral-950 text-white hover:scale-105 active:scale-95"
            : "bg-neutral-100 text-neutral-400",
        )}
      >
        <ArrowUp className="size-4" strokeWidth={2.25} />
      </button>
    </div>
  );
}
