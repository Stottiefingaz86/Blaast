import type { Metadata } from "next";
import { Suspense } from "react";
import { DM_Sans, Geist, Geist_Mono } from "next/font/google";
import { RouteProgress } from "@/components/brand/route-progress";
import { SessionProvider } from "@/lib/library/session";
import { AccountProvider } from "@/lib/platform/account-store";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

/** Library UI — geometric grotesque stand-in for Mobbin’s custom M Saans (Displaay). */
const libSans = DM_Sans({
  variable: "--font-lib",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Blaast",
  description: "Operator screens, flows, and patterns for product teams",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${libSans.variable} bg-[#0a0a0a] font-sans antialiased text-white`}
      >
        <SessionProvider>
          <AccountProvider>
            <Suspense fallback={null}>
              <RouteProgress />
            </Suspense>
            {children}
          </AccountProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
