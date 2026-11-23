"use client";

import { useState } from "react";
import type { PlanId } from "@/lib/platform/plans";
import type { PlatformRole, PublicUser } from "@/lib/platform/users-store";

export function AdminUsersClient({
  initialUsers,
}: {
  initialUsers: PublicUser[];
}) {
  const [users, setUsers] = useState(initialUsers);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function patchUser(
    userId: string,
    body: { plan?: PlanId; role?: PlatformRole },
  ) {
    setBusyId(userId);
    setError(null);
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ userId, ...body }),
      });
      const data = (await res.json()) as { user?: PublicUser; error?: string };
      if (!res.ok) {
        setError(data.error ?? "Update failed");
        return;
      }
      if (data.user) {
        setUsers((list) =>
          list.map((u) => (u.id === data.user!.id ? data.user! : u)),
        );
      }
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="overflow-hidden rounded-[20px] border border-black/[0.06] bg-white">
      {error && (
        <p className="border-b border-red-100 bg-red-50 px-4 py-2 text-[12px] text-red-700">
          {error}
        </p>
      )}
      <p className="border-b border-black/[0.04] bg-neutral-50 px-4 py-2.5 text-[12px] text-neutral-500">
        Curators can capture and annotate. Only you (owner/admin) can Approve
        &amp; publish to the library.
      </p>
      <table className="w-full text-left text-[13px]">
        <thead className="border-b border-black/[0.06] text-[11px] tracking-wide text-neutral-400 uppercase">
          <tr>
            <th className="px-4 py-3 font-medium">User</th>
            <th className="px-4 py-3 font-medium">Signed up</th>
            <th className="px-4 py-3 font-medium">Plan</th>
            <th className="px-4 py-3 font-medium">Role</th>
            <th className="px-4 py-3 font-medium">MCP</th>
            <th className="px-4 py-3 font-medium">Last login</th>
          </tr>
        </thead>
        <tbody>
          {users.length === 0 && (
            <tr>
              <td
                colSpan={6}
                className="px-4 py-8 text-center text-neutral-400"
              >
                No accounts yet — signups will show here.
              </td>
            </tr>
          )}
          {users.map((u) => (
            <tr
              key={u.id}
              className="border-b border-black/[0.04] last:border-0"
            >
              <td className="px-4 py-3">
                <p className="font-medium text-neutral-900">{u.name}</p>
                <p className="text-[12px] text-neutral-500">{u.email}</p>
              </td>
              <td className="px-4 py-3 text-[12px] text-neutral-500">
                {u.createdAt
                  ? new Date(u.createdAt).toLocaleString(undefined, {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })
                  : "—"}
              </td>
              <td className="px-4 py-3">
                <select
                  value={u.plan}
                  disabled={busyId === u.id}
                  onChange={(e) =>
                    void patchUser(u.id, { plan: e.target.value as PlanId })
                  }
                  className="h-8 rounded-lg border border-neutral-200 bg-white px-2 text-[12px]"
                >
                  <option value="free">Free</option>
                  <option value="pro">Pro</option>
                  <option value="team">Team</option>
                  <option value="enterprise">Enterprise</option>
                </select>
              </td>
              <td className="px-4 py-3">
                <select
                  value={u.role}
                  disabled={busyId === u.id || u.role === "owner"}
                  onChange={(e) =>
                    void patchUser(u.id, {
                      role: e.target.value as PlatformRole,
                    })
                  }
                  className="h-8 rounded-lg border border-neutral-200 bg-white px-2 text-[12px] capitalize"
                  title={
                    u.role === "owner"
                      ? "Owner is fixed to the allowlisted account"
                      : undefined
                  }
                >
                  <option value="member">Member</option>
                  <option value="curator">Curator</option>
                  <option value="admin">Admin</option>
                  {u.role === "owner" && (
                    <option value="owner">Owner</option>
                  )}
                </select>
              </td>
              <td className="px-4 py-3 text-neutral-600">
                {u.mcpActivatedAt ? (
                  <span title={u.mcpActivatedAt}>
                    On · {u.mcpConnectionCount}
                  </span>
                ) : (
                  <span className="text-neutral-400">—</span>
                )}
              </td>
              <td className="px-4 py-3 text-neutral-500">
                {u.lastLoginAt
                  ? new Date(u.lastLoginAt).toLocaleString()
                  : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
