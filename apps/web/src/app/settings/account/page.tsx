"use client";

export default function AccountSettingsPage() {
  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-semibold tracking-tight">Account</h1>
      <p className="mt-2 text-[14px] text-neutral-400">
        Profile for your Blaast workspace.
      </p>
      <div className="mt-8 space-y-4">
        <Field label="Display name" value="You" />
        <Field label="Email" value="you@blaast.app" />
        <Field label="Role" value="Owner" />
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <label className="block">
      <span className="text-[12px] text-neutral-500">{label}</span>
      <input
        readOnly
        value={value}
        className="mt-1.5 h-11 w-full rounded-xl border border-white/[0.1] bg-white/[0.04] px-3 text-[14px] outline-none"
      />
    </label>
  );
}
