import Link from "next/link";
import { ArrowRight, CheckCircle2, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function HomePage() {
  const paymentLink = process.env.NEXT_PUBLIC_STRIPE_PAYMENT_LINK as string;

  return (
    <div className="space-y-16">
      <section className="reveal rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900/90 via-slate-900/70 to-slate-950/80 p-6 sm:p-10">
        <div className="max-w-3xl space-y-6">
          <p className="inline-flex rounded-full border border-cyan-500/40 bg-cyan-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-cyan-300">
            Hiring transparency for candidates
          </p>
          <h1 className="text-3xl font-bold leading-tight text-slate-50 sm:text-5xl">
            Track and expose companies that ghost candidates after interviews.
          </h1>
          <p className="text-base leading-relaxed text-slate-300 sm:text-lg">
            Interview Ghosting Tracker helps job seekers avoid repeat time sinks by showing
            company-level ghosting rates, response timelines, and verified candidate experiences.
          </p>

          <div className="flex flex-wrap gap-3">
            <Link href="/search">
              <Button className="gap-2">
                Explore company data
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <a href={paymentLink} target="_blank" rel="noreferrer">
              <Button variant="outline">Get full insights for $8/mo</Button>
            </a>
          </div>
        </div>
      </section>

      <section className="reveal reveal-delay-1 grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl text-cyan-300">Role + stage context</CardTitle>
            <CardDescription>
              Compare ghosting patterns by interview stage, seniority, and response timeline.
            </CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl text-cyan-300">Search before applying</CardTitle>
            <CardDescription>
              Review company behavior before spending weeks on prep and interviews.
            </CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-4xl text-cyan-300">$8/mo</CardTitle>
            <CardDescription>for full filters, stage-level trends, and detailed timelines</CardDescription>
          </CardHeader>
        </Card>
      </section>

      <section id="problem" className="reveal reveal-delay-2 grid gap-6 rounded-2xl border border-slate-800 bg-slate-900/70 p-6 sm:grid-cols-2 sm:p-8">
        <div>
          <h2 className="text-2xl font-semibold text-slate-50">The problem</h2>
          <p className="mt-3 text-slate-300">
            Interview loops now stretch across multiple rounds and weeks of prep. When a
            company disappears, candidates lose momentum, confidence, and time they could
            have invested in better opportunities.
          </p>
        </div>
        <ul className="space-y-3 text-slate-300">
          <li className="flex gap-2">
            <TriangleAlert className="mt-0.5 h-4 w-4 text-red-300" />
            No shared record of which companies repeatedly ghost after specific interview stages.
          </li>
          <li className="flex gap-2">
            <TriangleAlert className="mt-0.5 h-4 w-4 text-red-300" />
            Candidates often discover bad hiring behavior only after investing hours in take-homes.
          </li>
          <li className="flex gap-2">
            <TriangleAlert className="mt-0.5 h-4 w-4 text-red-300" />
            Recruiters and hiring managers rarely face accountability for unclosed interview loops.
          </li>
        </ul>
      </section>

      <section id="solution" className="reveal reveal-delay-3 grid gap-6 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>What you get</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-slate-300">
            <p className="flex gap-2">
              <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-300" />
              Public company pages with ghosting rate, average wait time, and role-specific context.
            </p>
            <p className="flex gap-2">
              <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-300" />
              Structured report submissions so timelines are comparable across candidates.
            </p>
            <p className="flex gap-2">
              <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-300" />
              Subscriber dashboard for high-risk company watchlists and trend breakdowns.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Who uses this</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-slate-300">
            <p>Mid-to-senior candidates avoiding repeat ghosting from known offenders.</p>
            <p>Career changers evaluating hiring-process quality before investing in prep.</p>
            <p>Recent grads prioritizing opportunities with higher response accountability.</p>
          </CardContent>
        </Card>
      </section>

      <section id="pricing" className="rounded-2xl border border-cyan-500/30 bg-cyan-500/5 p-6 sm:p-8">
        <h2 className="text-2xl font-semibold text-slate-50">Simple pricing</h2>
        <p className="mt-2 max-w-2xl text-slate-300">
          Get full-stage breakdowns, detailed candidate narratives, and monthly trend tracking for
          less than the cost of one coffee run.
        </p>

        <div className="mt-6 max-w-lg rounded-xl border border-slate-700 bg-slate-950/80 p-6">
          <p className="text-sm uppercase tracking-wide text-cyan-300">Pro access</p>
          <p className="mt-2 text-4xl font-bold text-slate-50">$8<span className="text-lg text-slate-400">/mo</span></p>
          <ul className="mt-4 space-y-2 text-sm text-slate-300">
            <li>Unlimited company lookups</li>
            <li>Detailed incident timelines and stage trends</li>
            <li>High-risk shortlist and rapid-response filters</li>
            <li>Access on desktop and mobile</li>
          </ul>

          <div className="mt-5 flex flex-wrap gap-3">
            <a href={paymentLink} target="_blank" rel="noreferrer">
              <Button>Buy now</Button>
            </a>
            <Link href="/unlock">
              <Button variant="outline">Already purchased? Unlock access</Button>
            </Link>
          </div>
        </div>
      </section>

      <section id="faq" className="space-y-4">
        <h2 className="text-2xl font-semibold text-slate-50">FAQ</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <FaqItem
            question="How is data quality handled?"
            answer="Reports are structured with interview stage, wait time, follow-up count, and written timeline. Patterns emerge across repeated submissions, not one-off anecdotes."
          />
          <FaqItem
            question="Can companies see who submitted a report?"
            answer="No personal identifiers are published. Reports focus on process behavior, not candidate identity."
          />
          <FaqItem
            question="How do paid insights unlock?"
            answer="After checkout, the Stripe webhook marks your subscription active. You then unlock with your purchase email to set secure access cookies."
          />
          <FaqItem
            question="Can I cancel anytime?"
            answer="Yes. Access remains until the end of your current billing period, then expires automatically."
          />
        </div>
      </section>
    </div>
  );
}

function FaqItem({ question, answer }: { question: string; answer: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{question}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-slate-300">{answer}</p>
      </CardContent>
    </Card>
  );
}
