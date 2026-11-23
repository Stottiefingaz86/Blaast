import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginPage } from "@/components/marketing/login-page";

export const metadata: Metadata = {
  title: "Log in — Blaast",
};

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-neutral-950 text-neutral-400">
          Loading…
        </div>
      }
    >
      <LoginPage />
    </Suspense>
  );
}
