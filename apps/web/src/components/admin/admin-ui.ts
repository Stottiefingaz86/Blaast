import { cn } from "@/lib/utils";

export function adminPrimaryBtn(className?: string) {
  return cn(
    "inline-flex h-9 items-center justify-center rounded-full bg-neutral-950 px-4 text-[13px] font-medium text-white hover:bg-neutral-800",
    className,
  );
}

export function adminOutlineBtn(className?: string) {
  return cn(
    "inline-flex h-9 items-center justify-center rounded-full border border-neutral-200 bg-white px-4 text-[13px] font-medium text-neutral-900 hover:bg-neutral-50",
    className,
  );
}
