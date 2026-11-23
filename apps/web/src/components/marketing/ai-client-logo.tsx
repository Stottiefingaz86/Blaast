import { cn } from "@/lib/utils";

export type McpClientId =
  | "cursor"
  | "claude"
  | "chatgpt"
  | "vscode"
  | "windsurf"
  | "codex";

const CLIENTS: {
  id: McpClientId;
  name: string;
  bg: string;
}[] = [
  { id: "cursor", name: "Cursor", bg: "#000000" },
  { id: "claude", name: "Claude", bg: "#D4A27F" },
  { id: "chatgpt", name: "ChatGPT", bg: "#10A37F" },
  { id: "vscode", name: "VS Code", bg: "#007ACC" },
  { id: "windsurf", name: "Windsurf", bg: "#0B1B2B" },
  { id: "codex", name: "Codex", bg: "#1a1a1a" },
];

export const MCP_CLIENTS = CLIENTS;

/** Brand mark for MCP client grid. */
export function AiClientLogo({
  id,
  className,
}: {
  id: McpClientId;
  className?: string;
}) {
  const cls = cn("size-8", className);
  switch (id) {
    case "cursor":
      return (
        <svg className={cls} viewBox="0 0 24 24" aria-hidden>
          <path
            fill="currentColor"
            d="M4 4h7.5L20 20h-7.5L4 4zm8.2 0H20v7.2L12.2 4z"
          />
        </svg>
      );
    case "claude":
      return (
        <svg className={cls} viewBox="0 0 24 24" aria-hidden>
          <path
            fill="currentColor"
            d="M12.4 3.2 8.9 14.1 6.6 8.7 4 9.7l3.7 9.1h3.2l5.1-15.6h-3.6zm3.3 6.2-1.7 5.1h3.1l1.1 3.3H21l-3.4-9.9h-1.9l-.1 1.5z"
          />
        </svg>
      );
    case "chatgpt":
      return (
        <svg className={cls} viewBox="0 0 24 24" aria-hidden>
          <path
            fill="currentColor"
            d="M22.3 10.1a5.4 5.4 0 0 0-.5-5.1 5.5 5.5 0 0 0-5.9-2.3 5.5 5.5 0 0 0-4.1-1.8 5.5 5.5 0 0 0-5.2 3.8A5.4 5.4 0 0 0 2.4 9a5.5 5.5 0 0 0 .7 6.9 5.4 5.4 0 0 0 .5 5.1 5.5 5.5 0 0 0 5.9 2.3 5.5 5.5 0 0 0 4.1 1.8 5.5 5.5 0 0 0 5.2-3.8 5.4 5.4 0 0 0 4.2-4.1 5.5 5.5 0 0 0-.7-6.9zm-8.1 11.2a4.1 4.1 0 0 1-2.6-.9l.1-.1 3.1-1.8a.3.3 0 0 0 .1-.2v-4.3l1.3.8v3.9a4.1 4.1 0 0 1-2 3.6zm7.1-3a4.1 4.1 0 0 1-1.9 1.2v-3.8a.3.3 0 0 0-.1-.2l-3.2-1.8v-1.6l3.2 1.8a4.1 4.1 0 0 1 2 3.6v.8zm.9-7.5-.1.1-3.1 1.8a.3.3 0 0 0-.1.2v3.6l-1.3-.8V9.9a.3.3 0 0 0-.1-.2L10.5 8v-1.6l4.5 2.6a4.1 4.1 0 0 1 2.1-3.7 4.1 4.1 0 0 1 2.1 1.1 4.1 4.1 0 0 1 1 3.4zM9.1 15.4l-1.3-.7V11a.3.3 0 0 0 .1-.2l3.1-1.8v3.5L9.1 15.4zm-.8-7.4 3.2 1.8v1.6L8.3 9.6a.3.3 0 0 0-.2 0l-3.1 1.8a4.1 4.1 0 0 1 0-7.2 4.1 4.1 0 0 1 2.1-.6 4.1 4.1 0 0 1 2.2.6v1.8zm1.9 12.5a4.1 4.1 0 0 1-2.1-.6 4.1 4.1 0 0 1-2-3.6v-.8l3.1 1.8c0 .1.1.1.2.1l3.1-1.8v1.6l-2.3 1.3zm1.1-5.2-1.3-.8V9.9l1.3-.7 1.3.7v3.5l-1.3.8z"
          />
        </svg>
      );
    case "vscode":
      return (
        <svg className={cls} viewBox="0 0 24 24" aria-hidden>
          <path
            fill="currentColor"
            d="M23.2 2.7 18.1.3a1.5 1.5 0 0 0-1.7.3L1.3 14.6a1 1 0 0 0 0 1.5l2.6 2.4a1 1 0 0 0 1.3 0l15.3-12a1 1 0 0 1 1.6.8v13.4a1 1 0 0 1-1.6.8L7 12.1l-3.4 2.7 14.8 8.6a1.5 1.5 0 0 0 1.5 0l3.3-1.6a1.5 1.5 0 0 0 .8-1.3V4a1.5 1.5 0 0 0-.8-1.3z"
          />
        </svg>
      );
    case "windsurf":
      return (
        <svg className={cls} viewBox="0 0 24 24" aria-hidden>
          <path
            fill="currentColor"
            d="M4 17.5c2.2-1.2 4.6-1.8 7-1.8s4.8.6 7 1.8l1.2-2.1C16.7 14 13.9 13.2 11 13.2S5.3 14 2.8 15.4L4 17.5zm0-5c2.2-1.2 4.6-1.8 7-1.8s4.8.6 7 1.8l1.2-2.1C16.7 9 13.9 8.2 11 8.2S5.3 9 2.8 10.4L4 12.5zm0-5C6.2 6.3 8.6 5.7 11 5.7s4.8.6 7 1.8l1.2-2.1C16.7 4 13.9 3.2 11 3.2S5.3 4 2.8 5.4L4 7.5z"
          />
        </svg>
      );
    case "codex":
      return (
        <svg className={cls} viewBox="0 0 24 24" aria-hidden>
          <path
            fill="currentColor"
            d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8zm3.6-10.9L13 12l2.6 2.9-1.5 1.3L11 12.8 8.9 16.2 7.4 14.9 10 12 7.4 9.1l1.5-1.3L11 11.2l2.1-3.4z"
          />
        </svg>
      );
    default:
      return null;
  }
}

export function AiClientCard({
  id,
  name,
  bg,
  selected,
  onSelect,
}: {
  id: McpClientId;
  name: string;
  bg: string;
  selected?: boolean;
  onSelect?: (id: McpClientId) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect?.(id)}
      aria-pressed={selected}
      className={cn(
        "flex aspect-[4/3] w-full flex-col items-center justify-center gap-2.5 rounded-2xl bg-white shadow-sm transition-all",
        "hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950/30",
        selected
          ? "ring-2 ring-neutral-950 shadow-md"
          : "ring-1 ring-transparent",
      )}
    >
      <span
        className="flex size-11 items-center justify-center rounded-2xl text-white"
        style={{ background: bg }}
        aria-hidden
      >
        <AiClientLogo id={id} className="size-6" />
      </span>
      <span className="text-[13px] font-medium text-neutral-700">{name}</span>
    </button>
  );
}
