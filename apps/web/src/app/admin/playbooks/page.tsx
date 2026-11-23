import { AdminShell } from "@/components/admin/admin-shell";
import { CAPTURE_PLAYBOOKS } from "@/lib/admin/playbooks";

export default function PlaybooksPage() {
  return (
    <AdminShell title="Playbooks">
      <p className="max-w-2xl text-[13px] text-neutral-500">
        Standard packs so every operator is captured the same way — screens,
        chrome, and flows that feed the library grid.
      </p>
      <div className="flex flex-col gap-4">
        {CAPTURE_PLAYBOOKS.map((p) => (
          <section
            key={p.id}
            className="rounded-[20px] border border-black/[0.06] bg-white p-6"
          >
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-[16px] font-semibold">{p.title}</h2>
              <span className="text-[11px] text-neutral-400">
                {p.items.filter((i) => i.required).length} required ·{" "}
                {p.items.length} total
              </span>
            </div>
            <p className="mt-1 text-[13px] text-neutral-500">{p.description}</p>
            <ol className="mt-4 flex flex-col gap-2">
              {p.items.map((item, idx) => (
                <li key={item.id} className="text-[13px]">
                  <span className="font-medium text-neutral-900">
                    {idx + 1}. {item.label}
                  </span>
                  {!item.required && (
                    <span className="text-neutral-400"> · optional</span>
                  )}
                  <span className="block text-neutral-500">{item.hint}</span>
                </li>
              ))}
            </ol>
          </section>
        ))}
      </div>
    </AdminShell>
  );
}
