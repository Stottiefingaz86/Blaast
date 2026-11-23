"use client";

import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

/**
 * Thin top progress bar on client navigations so large library/admin
 * transitions feel instant even before the next RSC payload arrives.
 */
export function RouteProgress() {
  const pathname = usePathname();
  const search = useSearchParams();
  const [active, setActive] = useState(false);
  const [key, setKey] = useState(0);

  useEffect(() => {
    setActive(true);
    setKey((k) => k + 1);
    const done = window.setTimeout(() => setActive(false), 450);
    return () => window.clearTimeout(done);
  }, [pathname, search]);

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-x-0 top-0 z-[100] h-0.5 overflow-hidden"
    >
      <div
        key={key}
        className={cn(
          "h-full w-full origin-left bg-white transition-transform duration-500 ease-out",
          active ? "animate-[blaast-route-progress_0.45s_ease-out]" : "scale-x-0",
        )}
      />
    </div>
  );
}
