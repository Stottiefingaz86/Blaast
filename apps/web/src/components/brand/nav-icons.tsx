import { cn } from "@/lib/utils";

/** Bookshelf — stroke only, inherits text color. */
export function LibraryIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 16 16"
      fill="none"
      className={cn("size-4 shrink-0", className)}
    >
      <path
        d="M3 2.5v11"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path
        d="M6.25 4.5v9"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path
        d="M9.5 3v10.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path
        d="M12.5 5l1.75 8.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** Path / journeys — S-curve with endpoint nodes (Scuup research). */
export function ResearchIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 16 16"
      fill="none"
      className={cn("size-4 shrink-0", className)}
    >
      <circle cx="3.25" cy="12.5" r="1.35" stroke="currentColor" strokeWidth="1.4" />
      <circle cx="12.75" cy="3.5" r="1.35" stroke="currentColor" strokeWidth="1.4" />
      <path
        d="M4.1 11.4C5.8 9.2 6.2 8.2 8 8s2.2.8 3.9-1.4"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** Phone — Library Mobile card. */
export function MobilePlatformIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      fill="none"
      className={cn("size-6 shrink-0", className)}
    >
      <rect
        x="7"
        y="2.5"
        width="10"
        height="19"
        rx="2.25"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <path
        d="M10.5 4.75h3"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** Monitor — Library Desktop card. */
export function DesktopPlatformIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      fill="none"
      className={cn("size-6 shrink-0", className)}
    >
      <rect
        x="2.5"
        y="4"
        width="19"
        height="12.5"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <path
        d="M8.5 20.5h7M12 16.5v4"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** Scales — Scuup Benchmark. */
export function BenchmarkIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      fill="none"
      className={cn("size-6 shrink-0", className)}
    >
      <path
        d="M12 3.5v14.5M7 20.5h10"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path
        d="M12 6.5h7.5L17 12.5c0 1.8-1.7 3-3.5 3-2.1 0-3.5-1.5-3.5-3.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12 6.5H4.5L7 12.5c0 1.8 1.7 3 3.5 3 2.1 0 3.5-1.5 3.5-3.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Quote bubble — Scuup Voice of Customer / Player. */
export function VocIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      fill="none"
      className={cn("size-6 shrink-0", className)}
    >
      <path
        d="M5.5 5.5h13A2.5 2.5 0 0 1 21 8v7a2.5 2.5 0 0 1-2.5 2.5H12l-4.5 3.5V17.5H5.5A2.5 2.5 0 0 1 3 15V8a2.5 2.5 0 0 1 2.5-2.5Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="M8.25 9.25v4.5M10.5 9.25c1.1 0 2 .9 2 2s-.9 2-2 2M13.75 9.25v4.5M16 9.25c1.1 0 2 .9 2 2s-.9 2-2 2"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** Megaphone — Marketing Analysis. */
export function MarketingIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      fill="none"
      className={cn("size-6 shrink-0", className)}
    >
      <path
        d="M3.5 10.5v3c0 .8.7 1.5 1.5 1.5h2.2l3.3 3.2c.6.6 1.5.2 1.5-.7V6.5c0-.9-.9-1.3-1.5-.7L7.2 9H5c-.8 0-1.5.7-1.5 1.5Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="M15.5 9.2c1 .8 1.6 2 1.6 2.8s-.6 2-1.6 2.8M18.2 7.2c1.7 1.3 2.7 3.1 2.7 4.8s-1 3.5-2.7 4.8"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path
        d="M7 15.5v2.2c0 1.2.9 2.2 2.1 2.2"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}
