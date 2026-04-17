import type { Metadata } from "next";
import Link from "next/link";
import { Space_Grotesk } from "next/font/google";
import type { ReactNode } from "react";
import "@/app/globals.css";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-ui"
});

export const metadata: Metadata = {
  metadataBase: new URL("https://interview-ghosting-tracker.com"),
  title: {
    default: "Interview Ghosting Tracker",
    template: "%s | Interview Ghosting Tracker"
  },
  description:
    "Track company interview ghosting patterns before you apply. Compare ghosting rates, response timelines, and candidate experiences.",
  openGraph: {
    title: "Interview Ghosting Tracker",
    description:
      "A transparency platform exposing interview ghosting rates so candidates can avoid companies that waste their time.",
    type: "website",
    url: "https://interview-ghosting-tracker.com"
  },
  twitter: {
    card: "summary_large_image",
    title: "Interview Ghosting Tracker",
    description:
      "Search company ghosting rates, share interview experiences, and make informed job-search decisions."
  },
  keywords: [
    "interview ghosting",
    "job search",
    "company reviews",
    "candidate experience",
    "hiring transparency"
  ]
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={spaceGrotesk.variable}>
      <body className="min-h-screen bg-[#0d1117] font-[family-name:var(--font-ui)] text-[#e6edf3] antialiased">
        <header className="sticky top-0 z-40 border-b border-[#2d333b] bg-[#0d1117]/90 backdrop-blur">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
            <Link href="/" className="font-semibold tracking-tight text-[#58a6ff]">
              Interview Ghosting Tracker
            </Link>
            <nav className="flex items-center gap-4 text-sm text-[#c9d1d9]">
              <Link href="/search" className="hover:text-white">
                Search
              </Link>
              <Link href="/report" className="hover:text-white">
                Report
              </Link>
              <Link href="/dashboard" className="rounded-md bg-[#238636] px-3 py-1.5 text-white hover:bg-[#2ea043]">
                Member Access
              </Link>
            </nav>
          </div>
        </header>
        {children}
      </body>
    </html>
  );
}
