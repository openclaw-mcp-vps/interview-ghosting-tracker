import type { Metadata } from "next";
import Link from "next/link";
import { IBM_Plex_Sans, Space_Grotesk } from "next/font/google";
import type { ReactNode } from "react";
import "@/app/globals.css";

const display = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap"
});

const body = IBM_Plex_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["400", "500", "600", "700"],
  display: "swap"
});

export const metadata: Metadata = {
  metadataBase: new URL("https://interview-ghosting-tracker.com"),
  title: {
    default: "Interview Ghosting Tracker",
    template: "%s | Interview Ghosting Tracker"
  },
  description:
    "Track and expose companies that ghost candidates after interviews. Search hiring behavior before investing your time.",
  keywords: [
    "interview ghosting",
    "job search transparency",
    "candidate experience",
    "hiring accountability"
  ],
  openGraph: {
    type: "website",
    url: "/",
    title: "Interview Ghosting Tracker",
    description:
      "Community-sourced data on interview ghosting so candidates can avoid high-risk hiring pipelines.",
    siteName: "Interview Ghosting Tracker"
  },
  twitter: {
    card: "summary_large_image",
    title: "Interview Ghosting Tracker",
    description:
      "Search real ghosting rates, contribute your interview experience, and avoid repeat time-wasting processes."
  },
  robots: {
    index: true,
    follow: true
  }
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${display.variable} ${body.variable} bg-[#0d1117] text-slate-100 antialiased`}>
        <div className="grid-lines min-h-screen">
          <header className="sticky top-0 z-40 border-b border-slate-800/90 bg-[#0d1117]/90 backdrop-blur">
            <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
              <Link href="/" className="text-sm font-semibold tracking-wide text-cyan-300">
                Interview Ghosting Tracker
              </Link>

              <nav className="flex items-center gap-2 text-sm sm:gap-3">
                <Link className="rounded px-2 py-1 text-slate-300 hover:bg-slate-900" href="/search">
                  Search
                </Link>
                <Link className="rounded px-2 py-1 text-slate-300 hover:bg-slate-900" href="/report">
                  Report
                </Link>
                <Link className="rounded px-2 py-1 text-slate-300 hover:bg-slate-900" href="/dashboard">
                  Dashboard
                </Link>
                <Link className="rounded px-2 py-1 text-slate-300 hover:bg-slate-900" href="/unlock">
                  Unlock
                </Link>
              </nav>
            </div>
          </header>

          <main className="mx-auto w-full max-w-6xl px-4 pb-16 pt-8 sm:px-6">{children}</main>
        </div>
      </body>
    </html>
  );
}
