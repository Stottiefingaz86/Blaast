"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { BlaastPreloader } from "@/components/brand/blaast-preloader";
import { SavedPage } from "@/components/library/saved-page";
import { useSession } from "@/lib/library/session";

export default function SavedRoute() {
  const { loggedIn, ready } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (ready && !loggedIn) router.replace("/");
  }, [ready, loggedIn, router]);

  if (!ready) {
    return <BlaastPreloader label="Opening saved" />;
  }

  if (!loggedIn) {
    return <BlaastPreloader tone="light" label="Redirecting" />;
  }

  return <SavedPage />;
}
