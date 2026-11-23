"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { BlaastPreloader } from "@/components/brand/blaast-preloader";
import { Lander } from "@/components/marketing/lander";
import { useSession } from "@/lib/library/session";

/** Logged out → marketing lander. Logged in → library app. */
export default function HomePage() {
  const { loggedIn, ready } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (ready && loggedIn) router.replace("/library");
  }, [ready, loggedIn, router]);

  if (!ready) {
    return <BlaastPreloader tone="light" label="Starting Blaast" />;
  }

  if (loggedIn) {
    return <BlaastPreloader label="Opening library" />;
  }

  return <Lander />;
}
