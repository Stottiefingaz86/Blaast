import { AdminShell } from "@/components/admin/admin-shell";
import { AdminUsersClient } from "@/components/admin/admin-users-client";
import { requireAdmin } from "@/lib/platform/auth";
import { listUsers } from "@/lib/platform/users-store";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const admin = await requireAdmin();
  if (!admin) redirect("/login");
  const users = await listUsers();

  return (
    <AdminShell title="Users & plans">
      <p className="max-w-2xl text-[13px] text-neutral-500">
        Signups land on Free. Change plans here manually — there is no
        self-serve upgrade for customers.
      </p>
      <AdminUsersClient initialUsers={users} />
    </AdminShell>
  );
}
