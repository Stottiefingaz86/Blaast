import { redirect } from "next/navigation";
import { Toaster } from "@/components/ui/sonner";
import { requireAdmin } from "@/lib/platform/auth";

export const dynamic = "force-dynamic";

/** Capture desk + ops — owner/admin only. Members never reach these pages. */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await requireAdmin();
  if (!admin) {
    redirect("/library?error=" + encodeURIComponent("Admin access required"));
  }

  return (
    <>
      {children}
      <Toaster />
    </>
  );
}
