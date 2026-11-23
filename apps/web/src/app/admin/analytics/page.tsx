import { AdminShell } from "@/components/admin/admin-shell";
import { getAnalyticsSummary } from "@/lib/platform/analytics-store";
import { requireAdmin } from "@/lib/platform/auth";
import { listUsers } from "@/lib/platform/users-store";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AdminAnalyticsPage() {
  const admin = await requireAdmin();
  if (!admin) redirect("/login");

  const [summary, users] = await Promise.all([
    getAnalyticsSummary({ sinceDays: 90 }),
    listUsers(),
  ]);
  const mcpActivatedUsers = users.filter((u) => u.mcpActivatedAt).length;

  return (
    <AdminShell title="Data & analytics">
      <p className="max-w-2xl text-[13px] text-neutral-500">
        Last 90 days · MCP calls, activations, brand search & copy intent from
        library + MCP usage.
      </p>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Users" value={users.length} />
        <Stat label="MCP activated" value={mcpActivatedUsers} />
        <Stat label="MCP calls" value={summary.totals.mcpCalls} />
        <Stat
          label="Brand copy intents"
          value={summary.totals.brandCopyIntents}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <RankCard
          title="Most searched brands"
          empty="No brand searches yet"
          rows={summary.topSearchedBrands.map((r) => ({
            label: r.brand,
            count: r.count,
          }))}
        />
        <RankCard
          title="Brands people try to copy"
          empty="No copy intents yet (MCP prompt / get_operator)"
          rows={summary.topCopiedBrands.map((r) => ({
            label: r.brand,
            count: r.count,
          }))}
        />
        <RankCard
          title="Top MCP tools"
          empty="No MCP tool calls yet"
          rows={summary.topMcpTools.map((r) => ({
            label: r.tool,
            count: r.count,
          }))}
        />
        <div className="rounded-[20px] border border-black/[0.06] bg-white p-5">
          <h2 className="text-[14px] font-semibold">Plans</h2>
          <ul className="mt-3 space-y-2 text-[13px] text-neutral-600">
            {(["free", "pro", "team", "enterprise"] as const).map((p) => (
              <li key={p} className="flex justify-between">
                <span className="capitalize">{p}</span>
                <span className="font-medium text-neutral-900">
                  {users.filter((u) => u.plan === p).length}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <section className="rounded-[20px] border border-black/[0.06] bg-white p-5">
        <h2 className="text-[14px] font-semibold">Recent activity</h2>
        <ul className="mt-3 max-h-[420px] space-y-2 overflow-auto text-[12px]">
          {summary.recent.length === 0 && (
            <li className="text-neutral-400">No events yet</li>
          )}
          {summary.recent.map((e) => (
            <li
              key={e.id}
              className="flex flex-wrap items-baseline gap-x-2 border-b border-black/[0.04] py-2 last:border-0"
            >
              <span className="font-medium text-neutral-900">{e.kind}</span>
              {e.brand && (
                <span className="text-neutral-600">{e.brand}</span>
              )}
              {e.tool && (
                <span className="text-neutral-500">{e.tool}</span>
              )}
              {e.userEmail && (
                <span className="text-neutral-400">{e.userEmail}</span>
              )}
              <span className="ml-auto text-neutral-400">
                {new Date(e.at).toLocaleString()}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </AdminShell>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-[20px] border border-black/[0.06] bg-white p-5">
      <p className="text-[12px] text-neutral-400">{label}</p>
      <p className="mt-1 text-[28px] font-semibold tracking-tight">{value}</p>
    </div>
  );
}

function RankCard({
  title,
  rows,
  empty,
}: {
  title: string;
  rows: { label: string; count: number }[];
  empty: string;
}) {
  return (
    <div className="rounded-[20px] border border-black/[0.06] bg-white p-5">
      <h2 className="text-[14px] font-semibold">{title}</h2>
      {rows.length === 0 ? (
        <p className="mt-3 text-[12px] text-neutral-400">{empty}</p>
      ) : (
        <ol className="mt-3 space-y-2">
          {rows.map((r, i) => (
            <li
              key={r.label}
              className="flex items-center justify-between text-[13px]"
            >
              <span className="text-neutral-700">
                <span className="mr-2 text-neutral-400">{i + 1}.</span>
                {r.label}
              </span>
              <span className="font-medium">{r.count}</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
