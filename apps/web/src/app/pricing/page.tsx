import type { Metadata } from "next";
import { PricingLanding } from "@/components/marketing/pricing-landing";

export const metadata: Metadata = {
  title: "Pricing — Blaast",
  description: "Plans for product teams using Blaast’s iGaming reference library.",
};

export default function PricingPage() {
  return <PricingLanding />;
}
