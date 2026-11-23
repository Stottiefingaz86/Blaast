"use client";

import { Suspense, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  BlaastPreloader,
  LibrarySkeleton,
} from "@/components/brand/blaast-preloader";
import { DiscoverPage } from "@/components/library/discover-page";
import { useSession } from "@/lib/library/session";

/** Product library — requires login (Mobbin Apps/Sites). */
export default function LibraryPage() {
  const { loggedIn, ready } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (ready && !loggedIn) router.replace("/");
  }, [ready, loggedIn, router]);

  if (!ready) {
    return <BlaastPreloader label="Opening library" />;
  }

  if (!loggedIn) {
    return <BlaastPreloader tone="light" label="Redirecting" />;
  }

  return (
    <Suspense fallback={<LibrarySkeleton />}>
      <DiscoverPage />
    </Suspense>
  );
}
