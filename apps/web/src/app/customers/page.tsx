import type { Metadata } from "next";
import { CustomersLanding } from "@/components/marketing/customers-landing";

export const metadata: Metadata = {
  title: "Customers — Blaast",
};

export default function Page() {
  return <CustomersLanding />;
}
