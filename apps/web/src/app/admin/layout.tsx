import { redirect } from "next/navigation";
import { Toaster } from "@/components/ui/sonner";
import { requireStaff } from "@/lib/platform/auth";

export const dynamic = "force-dynamic";

/** Capture desk — owner/admin/curator. Members never reach these pages. */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const staff = await requireStaff();
  if (!staff) {
    redirect("/library?error=" + encodeURIComponent("Staff access required"));
  }

  return (
    <>
      {children}
      <Toaster />
    </>
  );
}
