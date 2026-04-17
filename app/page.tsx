import Link from "next/link";
import { AlertTriangle, CheckCircle2, Clock3, Search, ShieldAlert } from "lucide-react";
import { LemonCheckoutButton } from "@/components/LemonCheckoutButton";
import { getCheckoutUrl } from "@/lib/lemonsqueezy";

const faq = [
  {
    question: "How is ghosting rate calculated?",
    answer:
      "Ghosting rate is the percentage of submitted interview reports where candidates did not receive any final follow-up after a completed interview stage."
  },
  {
    question: "Are reports anonymous?",
    answer:
      "Yes. We never collect candidate names or personal contact info in reports. We only store interview process details and company-level trends."
  },
  {
    question: "What do paid members get?",
    answer:
      "Members unlock detailed role-level reports, advanced filters, ghosting trend insights, and full company comparison tables for $8/month."
  },
  {
    question: "Can companies dispute inaccurate claims?",
    answer:
      "Yes. Companies can request a moderation review, and we remove reports that violate evidence, tone, or factual consistency standards."
  }
];

export default function HomePage() {
  const checkoutUrl = getCheckoutUrl();

  return (
    <main>
      <section className="mx-auto grid max-w-6xl gap-10 px-4 pb-12 pt-16 md:grid-cols-2 md:items-center">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full border border-[#2d333b] bg-[#161b22] px-3 py-1 text-xs text-[#8b949e]">
            <ShieldAlert className="h-3.5 w-3.5" />
            Hiring transparency for job seekers
          </p>
          <h1 className="mt-4 text-4xl font-bold tracking-tight text-white md:text-5xl">
            Track and expose companies that ghost candidates
          </h1>
          <p className="mt-4 max-w-xl text-[#c9d1d9]">
            Interview Ghosting Tracker helps professionals stop wasting weeks on companies that disappear after interviews.
            Search ghosting rates before you apply, and contribute anonymous reports that hold hiring teams accountable.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/search" className="rounded-md bg-[#238636] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#2ea043]">
              Check a company now
            </Link>
            <LemonCheckoutButton
              checkoutUrl={checkoutUrl}
              className="rounded-md border border-[#2d333b] bg-[#161b22] px-4 py-2.5 text-sm font-medium text-[#c9d1d9] hover:border-[#58a6ff] hover:text-white"
            >
              Unlock full data for $8/month
            </LemonCheckoutButton>
          </div>
        </div>

        <div className="rounded-2xl border border-[#2d333b] bg-[#161b22] p-6">
          <h2 className="text-lg font-semibold text-white">What candidates are fighting</h2>
          <ul className="mt-4 space-y-4 text-sm text-[#c9d1d9]">
            <li className="flex gap-3">
              <Clock3 className="mt-0.5 h-4 w-4 text-[#f85149]" />
              Multi-week interview loops ending in silence after final rounds.
            </li>
            <li className="flex gap-3">
              <AlertTriangle className="mt-0.5 h-4 w-4 text-[#f0b72f]" />
              Recruiters requesting unpaid take-homes with no follow-up or closure.
            </li>
            <li className="flex gap-3">
              <Search className="mt-0.5 h-4 w-4 text-[#58a6ff]" />
              Zero public visibility into which companies repeatedly ghost candidates.
            </li>
          </ul>
        </div>
      </section>

      <section className="border-y border-[#2d333b] bg-[#0f1520]">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 py-12 md:grid-cols-3">
          <Feature title="Search before applying" body="Check company ghosting history and average response times before investing your effort." />
          <Feature title="Anonymous incident reports" body="Contribute your experience without exposing your identity or compromising your career." />
          <Feature title="Decision-grade insights" body="Compare hiring behavior across industries, roles, and process stages with member analytics." />
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14">
        <h2 className="text-2xl font-bold text-white">Pricing</h2>
        <p className="mt-2 text-[#8b949e]">Simple pricing designed for active job seekers.</p>

        <div className="mt-6 max-w-md rounded-2xl border border-[#2d333b] bg-[#161b22] p-6">
          <p className="text-sm text-[#8b949e]">Pro Membership</p>
          <p className="mt-2 text-4xl font-bold text-white">$8<span className="text-base text-[#8b949e]">/month</span></p>
          <ul className="mt-4 space-y-2 text-sm text-[#c9d1d9]">
            <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-[#3fb950]" /> Full company report timelines</li>
            <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-[#3fb950]" /> Advanced search and risk filters</li>
            <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-[#3fb950]" /> Ghosting trend dashboard</li>
            <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-[#3fb950]" /> Weekly high-risk company alerts</li>
          </ul>
          <LemonCheckoutButton
            checkoutUrl={checkoutUrl}
            className="mt-6 inline-flex w-full items-center justify-center rounded-md bg-[#238636] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#2ea043]"
          >
            Start membership
          </LemonCheckoutButton>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-20">
        <h2 className="text-2xl font-bold text-white">FAQ</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {faq.map((item) => (
            <article key={item.question} className="rounded-xl border border-[#2d333b] bg-[#161b22] p-4">
              <h3 className="font-medium text-white">{item.question}</h3>
              <p className="mt-2 text-sm text-[#8b949e]">{item.answer}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}

function Feature({ title, body }: { title: string; body: string }) {
  return (
    <article className="rounded-xl border border-[#2d333b] bg-[#161b22] p-5">
      <h3 className="text-lg font-semibold text-white">{title}</h3>
      <p className="mt-2 text-sm text-[#8b949e]">{body}</p>
    </article>
  );
}
