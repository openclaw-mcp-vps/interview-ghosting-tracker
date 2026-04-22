import type { Metadata, Viewport } from "next";
import Link from "next/link";
import "./globals.css";

const siteUrl = "https://interview-ghosting-tracker.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Interview Ghosting Tracker",
    template: "%s | Interview Ghosting Tracker"
  },
  description:
    "Track companies that ghost candidates after interviews. Search ghosting rates, read candidate experiences, and avoid time-wasting hiring funnels.",
  keywords: [
    "interview ghosting",
    "company hiring transparency",
    "job search research",
    "candidate experiences",
    "ghosting database"
  ],
  openGraph: {
    title: "Interview Ghosting Tracker",
    description:
      "Know how companies treat candidates before you spend weeks interviewing.",
    url: siteUrl,
    siteName: "Interview Ghosting Tracker",
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: "Interview Ghosting Tracker",
    description:
      "Public hiring-behavior intelligence for candidates who are done getting ghosted."
  },
  alternates: {
    canonical: "/"
  },
  robots: {
    index: true,
    follow: true
  }
};

export const viewport: Viewport = {
  colorScheme: "dark",
  themeColor: "#0d1117"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <header className="sticky top-0 z-50 border-b border-slate-800/80 bg-slate-950/85 backdrop-blur">
          <div className="container-page flex items-center justify-between gap-3 py-4">
            <Link href="/" className="text-sm font-semibold tracking-wide text-slate-100">
              Interview Ghosting Tracker
            </Link>
            <nav className="flex items-center gap-1 text-sm text-slate-300">
              <Link href="/search" className="rounded-md px-3 py-2 hover:bg-slate-800">
                Search
              </Link>
              <Link href="/submit-report" className="rounded-md px-3 py-2 hover:bg-slate-800">
                Submit Report
              </Link>
              <Link href="/dashboard" className="rounded-md px-3 py-2 hover:bg-slate-800">
                Premium
              </Link>
            </nav>
          </div>
        </header>
        <main>{children}</main>
        <footer className="border-t border-slate-800/80 py-8">
          <div className="container-page flex flex-col gap-3 text-sm text-slate-400 sm:flex-row sm:items-center sm:justify-between">
            <p>Built for candidates who want hiring transparency.</p>
            <p>Independent and candidate-first.</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
