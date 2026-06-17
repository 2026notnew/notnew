import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { SiteHeader } from "@/components/SiteHeader";
import { CookieNotice } from "@/components/CookieNotice";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "NotNew — Curated vintage finds",
  description:
    "Hand-picked vintage and collectible finds worth knowing about. Rock posters, automotive, petroliana, tools, motorcycles, and watches.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html
        lang="en"
        className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      >
        <body className="min-h-full flex flex-col bg-zinc-50 text-zinc-900 dark:bg-black dark:text-zinc-100">
          <SiteHeader />
          <div className="flex-1">{children}</div>
          <CookieNotice />
          <footer className="border-t border-zinc-200 py-8 dark:border-zinc-800">
            <div className="mx-auto flex max-w-6xl flex-col items-center gap-3 px-4 text-sm text-zinc-500">
              <nav className="flex flex-wrap justify-center gap-x-5 gap-y-2">
                <a href="/about" className="hover:text-zinc-900 dark:hover:text-zinc-200">
                  About
                </a>
                <a href="/guidelines" className="hover:text-zinc-900 dark:hover:text-zinc-200">
                  Community Guidelines
                </a>
                <a href="/terms" className="hover:text-zinc-900 dark:hover:text-zinc-200">
                  Terms
                </a>
                <a href="/privacy" className="hover:text-zinc-900 dark:hover:text-zinc-200">
                  Privacy
                </a>
                <a href="/dmca" className="hover:text-zinc-900 dark:hover:text-zinc-200">
                  Copyright / DMCA
                </a>
              </nav>
              <p>NotNew · Curated, never commodity.</p>
            </div>
          </footer>
        </body>
      </html>
    </ClerkProvider>
  );
}
