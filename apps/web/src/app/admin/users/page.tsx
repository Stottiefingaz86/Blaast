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
        All email / Google signups are stored durably and listed here (
        {users.length} account{users.length === 1 ? "" : "s"}). New accounts
        land on Free. Promote capture staff to Curator — they create content;
        only you Approve &amp; publish.
      </p>
      <AdminUsersClient initialUsers={users} />
    </AdminShell>
  );
}
