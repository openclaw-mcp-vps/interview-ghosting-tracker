import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CheckCircle2, CircleDashed, ShieldAlert, TimerReset, TrendingUp } from "lucide-react";

export const metadata: Metadata = {
  title: "Track and Expose Companies That Ghost Candidates",
  description:
    "Interview Ghosting Tracker helps job seekers research ghosting rates and real interview experiences before committing time to a hiring process."
};

export default function HomePage() {
  const buyLink = process.env.NEXT_PUBLIC_STRIPE_PAYMENT_LINK;

  return (
    <>
      <section className="container-page py-14 sm:py-20">
        <div className="grid items-center gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <div>
            <span className="kicker">Job search intelligence</span>
            <h1 className="mt-5 text-4xl font-semibold leading-tight text-slate-100 sm:text-5xl">
              Track and expose companies that ghost candidates
            </h1>
            <p className="mt-5 max-w-2xl text-base text-slate-300 sm:text-lg">
              Interview ghosting wastes weeks of effort and emotional energy. We collect verified candidate reports,
              calculate company ghosting rates, and help you avoid hiring funnels that do not respect your time.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Link href="/search" className="btn-primary">
                Search companies
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
              <Link href="/submit-report" className="btn-secondary">
                Submit a report
              </Link>
            </div>
            <div className="mt-6 flex flex-wrap gap-2 text-xs text-slate-400">
              <span className="rounded-full border border-slate-700/90 px-3 py-1">Built for mid-to-senior professionals</span>
              <span className="rounded-full border border-slate-700/90 px-3 py-1">Useful for career changers and grads</span>
              <span className="rounded-full border border-slate-700/90 px-3 py-1">$8/month premium intel</span>
            </div>
          </div>

          <aside className="panel rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-slate-100">Why candidates use this before applying</h2>
            <ul className="mt-4 space-y-4 text-sm text-slate-300">
              <li className="flex items-start gap-3">
                <ShieldAlert className="mt-0.5 h-4 w-4 text-red-300" />
                <span>Spot companies with repeated no-response behavior across interview stages.</span>
              </li>
              <li className="flex items-start gap-3">
                <TrendingUp className="mt-0.5 h-4 w-4 text-amber-300" />
                <span>Compare ghosting rates by company, stage, and report volume.</span>
              </li>
              <li className="flex items-start gap-3">
                <TimerReset className="mt-0.5 h-4 w-4 text-emerald-300" />
                <span>Protect your calendar by prioritizing teams that follow through.</span>
              </li>
            </ul>
          </aside>
        </div>
      </section>

      <section className="container-page py-10">
        <h2 className="text-2xl font-semibold text-slate-100 sm:text-3xl">The problem</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          <article className="panel rounded-xl p-5">
            <CircleDashed className="h-5 w-5 text-red-300" />
            <h3 className="mt-3 text-lg font-semibold">Silence after final rounds</h3>
            <p className="mt-2 text-sm text-slate-300">
              Candidates invest prep time, portfolio work, and interview loops, then hear nothing for weeks.
            </p>
          </article>
          <article className="panel rounded-xl p-5">
            <CircleDashed className="h-5 w-5 text-amber-300" />
            <h3 className="mt-3 text-lg font-semibold">No hiring accountability</h3>
            <p className="mt-2 text-sm text-slate-300">
              Most companies face no downside for ghosting, so bad interview behavior repeats without visibility.
            </p>
          </article>
          <article className="panel rounded-xl p-5">
            <CircleDashed className="h-5 w-5 text-blue-300" />
            <h3 className="mt-3 text-lg font-semibold">Poor job-search decisions</h3>
            <p className="mt-2 text-sm text-slate-300">
              Without evidence, candidates keep applying to employers that routinely burn their time.
            </p>
          </article>
        </div>
      </section>

      <section className="container-page py-10">
        <h2 className="text-2xl font-semibold text-slate-100 sm:text-3xl">The solution</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <article className="panel rounded-xl p-5">
            <h3 className="text-lg font-semibold">Public company profiles</h3>
            <p className="mt-2 text-sm text-slate-300">
              Search any company and see total reports, ghosting percentage, average response wait, and timeline trends.
            </p>
          </article>
          <article className="panel rounded-xl p-5">
            <h3 className="text-lg font-semibold">Candidate-submitted experiences</h3>
            <p className="mt-2 text-sm text-slate-300">
              Read real accounts of interview loops, follow-ups, and how long candidates were left waiting.
            </p>
          </article>
          <article className="panel rounded-xl p-5">
            <h3 className="text-lg font-semibold">Premium risk dashboard</h3>
            <p className="mt-2 text-sm text-slate-300">
              Access stage-level ghosting risk, fresh incident feed, and high-risk company watchlists for smarter targeting.
            </p>
          </article>
          <article className="panel rounded-xl p-5">
            <h3 className="text-lg font-semibold">Community accountability loop</h3>
            <p className="mt-2 text-sm text-slate-300">
              Every submitted report improves transparency and helps candidates avoid repeat harm.
            </p>
          </article>
        </div>
      </section>

      <section className="container-page py-10" id="pricing">
        <div className="panel rounded-2xl p-6 sm:p-8">
          <p className="kicker">Pricing</p>
          <h2 className="mt-4 text-3xl font-semibold text-slate-100">Premium insights for $8/month</h2>
          <p className="mt-3 max-w-2xl text-sm text-slate-300 sm:text-base">
            Unlock full candidate narratives, stage-level ghosting analytics, and recent incident tracking so you can
            focus your interviews where the odds are better.
          </p>

          <ul className="mt-6 grid gap-3 text-sm text-slate-200 sm:grid-cols-2">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-300" />
              Full report details and timelines
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-300" />
              Company risk ranking dashboard
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-300" />
              Stage-by-stage ghosting trend breakdown
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-300" />
              New report feed for active job seekers
            </li>
          </ul>

          <div className="mt-7 flex flex-wrap items-center gap-3">
            <a href={buyLink} className="btn-primary">
              Buy premium access
            </a>
            <Link href="/dashboard" className="btn-secondary">
              View premium dashboard
            </Link>
          </div>
        </div>
      </section>

      <section className="container-page py-10 pb-20">
        <h2 className="text-2xl font-semibold text-slate-100 sm:text-3xl">FAQ</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <article className="panel rounded-xl p-5">
            <h3 className="text-base font-semibold">How is ghosting rate calculated?</h3>
            <p className="mt-2 text-sm text-slate-300">
              Ghosting rate is the percentage of submitted reports where candidates did not receive a response after the
              last interview touchpoint.
            </p>
          </article>
          <article className="panel rounded-xl p-5">
            <h3 className="text-base font-semibold">Can I submit anonymously?</h3>
            <p className="mt-2 text-sm text-slate-300">
              Yes. Email is optional. We only publish anonymized details and never display personally identifying data.
            </p>
          </article>
          <article className="panel rounded-xl p-5">
            <h3 className="text-base font-semibold">What does premium unlock?</h3>
            <p className="mt-2 text-sm text-slate-300">
              Premium unlocks full candidate stories and advanced analytics so you can judge whether a process is worth
              your time.
            </p>
          </article>
          <article className="panel rounded-xl p-5">
            <h3 className="text-base font-semibold">Who is this for?</h3>
            <p className="mt-2 text-sm text-slate-300">
              Mid-to-senior professionals, career changers, and recent grads who want better signal before entering
              interview loops.
            </p>
          </article>
        </div>
      </section>
    </>
  );
}
