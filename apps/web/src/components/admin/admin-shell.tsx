import Link from "next/link";
import {
  getSessionUser,
  isPublisherRole,
} from "@/lib/platform/auth";

export {
  adminOutlineBtn,
  adminPrimaryBtn,
} from "@/components/admin/admin-ui";

const staffLinks = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/operators", label: "Sites" },
  { href: "/admin/playbooks", label: "Playbooks" },
] as const;

const publisherLinks = [
  { href: "/admin/users", label: "Users" },
  { href: "/admin/analytics", label: "Analytics" },
] as const;

/** Internal capture desk — not shown to library customers. */
export async function AdminShell({
  children,
  title,
  action,
}: {
  children: React.ReactNode;
  title: string;
  action?: React.ReactNode;
}) {
  const user = await getSessionUser();
  const publisher = isPublisherRole(user?.role);
  const links = publisher
    ? [...staffLinks, ...publisherLinks]
    : [...staffLinks];

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
          {user?.role === "curator" && (
            <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-medium text-amber-800 ring-1 ring-amber-200/80">
              Curator · capture only
            </span>
          )}
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
