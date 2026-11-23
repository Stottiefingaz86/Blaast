import Link from "next/link";
import { cn } from "@/lib/utils";

const links = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/operators", label: "Sites" },
  { href: "/admin/playbooks", label: "Playbooks" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/analytics", label: "Analytics" },
];

/** Internal capture desk — not shown to library customers. */
export function AdminShell({
  children,
  title,
  action,
}: {
  children: React.ReactNode;
  title: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-950">
      <header className="border-b border-black/[0.06] bg-white">
        <div className="mx-auto flex h-12 max-w-[1400px] items-center gap-4 px-5">
          <Link href="/admin" className="text-[13px] font-semibold">
            Blaast · Capture desk
          </Link>
          <nav className="flex items-center gap-1">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="rounded-full px-3 py-1.5 text-[12px] font-medium text-neutral-600 hover:bg-neutral-100 hover:text-neutral-950"
              >
                {l.label}
              </Link>
            ))}
          </nav>
          <Link
            href="/"
            className="ml-auto text-[12px] font-medium text-neutral-500 hover:text-neutral-900"
          >
            ← Library
          </Link>
        </div>
      </header>
      <main className="mx-auto flex max-w-[1100px] flex-col gap-6 px-5 py-8">
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-[28px] font-semibold tracking-tight">{title}</h1>
          {action}
        </div>
        {children}
      </main>
    </div>
  );
}

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
