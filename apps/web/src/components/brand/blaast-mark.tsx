import { cn } from "@/lib/utils";

/** Official Blaast mark — white B on dark UI, black B on light pages. */
export function BlaastMark({
  className,
  alt = "Blaast",
  tone = "onDark",
}: {
  className?: string;
  alt?: string;
  tone?: "onDark" | "onLight";
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={tone === "onLight" ? "/blaast-mark-light.png" : "/blaast-mark.png"}
      alt={alt}
      width={28}
      height={21}
      className={cn("h-7 w-auto shrink-0 object-contain", className)}
    />
  );
}
