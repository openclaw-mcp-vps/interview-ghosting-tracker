import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { formatDistanceToNow } from "date-fns";
import { ACCESS_COOKIE_NAME, readAccessCookieValue } from "@/lib/lemonsqueezy";
import { getDashboardMetrics, getRecentReports, getStageInsights, isDatabaseConfigured } from "@/lib/database";

export const metadata: Metadata = {
  title: "Premium Ghosting Dashboard",
  description:
    "Premium analytics for interview ghosting trends, high-risk companies, and recent candidate experiences."
};

export const dynamic = "force-dynamic";

type DashboardPageProps = {
  searchParams: Promise<{ status?: string }>;
};

function ghostingRateClass(rate: number): string {
  if (rate >= 70) return "value-danger";
  if (rate >= 40) return "value-warn";
  return "value-ok";
}

function toRelativeDate(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.valueOf())) {
    return "unknown time";
  }

  return formatDistanceToNow(parsed, { addSuffix: true });
}

function renderStatusMessage(status: string | undefined): string | null {
  if (status === "unlocked") {
    return "Premium access confirmed for your email. You can now view full reports and analytics.";
  }

  if (status === "not-found") {
    return "No paid subscription found for that email yet. Complete checkout, then try activation again.";
  }

  if (status === "invalid-email") {
    return "Please enter a valid email address to activate access.";
  }

  return null;
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const params = await searchParams;
  const cookieStore = await cookies();
  const access = readAccessCookieValue(cookieStore.get(ACCESS_COOKIE_NAME)?.value);
  const hasPremium = Boolean(access);

  const buyLink = process.env.NEXT_PUBLIC_STRIPE_PAYMENT_LINK;
  const statusMessage = renderStatusMessage(params.status);

  if (!hasPremium) {
    return (
      <section className="container-page py-10 sm:py-14">
        <div className="mx-auto max-w-3xl panel rounded-2xl p-6 sm:p-8">
          <span className="kicker">Premium required</span>
          <h1 className="mt-4 text-3xl font-semibold text-slate-100 sm:text-4xl">Unlock the ghosting intelligence dashboard</h1>
          <p className="mt-3 text-sm text-slate-300 sm:text-base">
            Premium gives you the full candidate narratives, stage risk trends, and company watchlist used to avoid
            high-friction hiring funnels.
          </p>

          <ul className="mt-5 grid gap-2 text-sm text-slate-200">
            <li>• Full report details behind each company profile</li>
            <li>• Stage-level ghosting risk and wait-time analytics</li>
            <li>• Fresh report feed to track current hiring behavior</li>
            <li>• High-risk company leaderboard from verified submissions</li>
          </ul>

          <div className="mt-6 flex flex-wrap gap-3">
            <a href={buyLink} className="btn-primary">
              Buy premium for $8/month
            </a>
            <Link href="/search" className="btn-secondary">
              Continue with free search
            </Link>
          </div>

          <div className="mt-8 rounded-xl border border-slate-700 bg-slate-900/60 p-4">
            <h2 className="text-base font-semibold text-slate-100">Already purchased?</h2>
            <p className="mt-1 text-sm text-slate-300">Enter the same email you used at checkout to activate this browser.</p>

            {statusMessage ? (
              <p className="mt-3 rounded-md border border-slate-600 bg-slate-800/60 px-3 py-2 text-sm text-slate-200">
                {statusMessage}
              </p>
            ) : null}

            <form action="/api/access/activate" method="POST" className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto]">
              <input type="hidden" name="redirectTo" value="/dashboard" />
              <input name="email" type="email" required className="input" placeholder="you@domain.com" />
              <button type="submit" className="btn-primary">
                Activate access
              </button>
            </form>
          </div>
        </div>
      </section>
    );
  }

  const [metrics, stageInsights, recentReports] = await Promise.all([
    getDashboardMetrics(),
    getStageInsights(8),
    getRecentReports(12)
  ]);

  return (
    <section className="container-page py-10 sm:py-14">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="kicker">Premium dashboard</span>
          <h1 className="mt-3 text-3xl font-semibold text-slate-100 sm:text-4xl">Ghosting risk intelligence</h1>
          <p className="mt-2 text-sm text-slate-300 sm:text-base">Use this as a shortlist filter before you start interview loops.</p>
        </div>
      </div>

      {!isDatabaseConfigured() ? (
        <div className="panel rounded-xl p-5 text-sm text-slate-300">
          DATABASE_URL is not configured, so live premium analytics are unavailable.
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="metric">
          <p className="text-xs uppercase tracking-wide text-slate-400">Companies tracked</p>
          <p className="mt-1 text-3xl font-semibold text-slate-100">{metrics.totalCompanies}</p>
        </div>
        <div className="metric">
          <p className="text-xs uppercase tracking-wide text-slate-400">Reports collected</p>
          <p className="mt-1 text-3xl font-semibold text-slate-100">{metrics.totalReports}</p>
        </div>
        <div className="metric">
          <p className="text-xs uppercase tracking-wide text-slate-400">Overall ghosting rate</p>
          <p className={`mt-1 text-3xl font-semibold ${ghostingRateClass(metrics.overallGhostingRate)}`}>
            {metrics.overallGhostingRate.toFixed(1)}%
          </p>
        </div>
        <div className="metric">
          <p className="text-xs uppercase tracking-wide text-slate-400">Median wait</p>
          <p className="mt-1 text-3xl font-semibold text-slate-100">{metrics.medianWaitDays.toFixed(1)}d</p>
        </div>
      </div>

      <div className="mt-7 grid gap-6 lg:grid-cols-2">
        <article className="panel rounded-xl p-5">
          <h2 className="text-lg font-semibold text-slate-100">Highest-risk companies</h2>
          <div className="mt-4 space-y-3">
            {metrics.worstCompanies.map((company) => (
              <div key={company.id} className="rounded-lg border border-slate-700/90 bg-slate-900/60 p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <Link href={`/companies/${company.slug}`} className="font-semibold text-slate-100 hover:text-blue-300">
                      {company.name}
                    </Link>
                    <p className="text-xs text-slate-400">{company.totalReports} reports</p>
                  </div>
                  <p className={`text-lg font-semibold ${ghostingRateClass(company.ghostingRate)}`}>
                    {company.ghostingRate.toFixed(1)}%
                  </p>
                </div>
              </div>
            ))}
            {metrics.worstCompanies.length === 0 ? <p className="text-sm text-slate-400">No data yet.</p> : null}
          </div>
        </article>

        <article className="panel rounded-xl p-5">
          <h2 className="text-lg font-semibold text-slate-100">Ghosting risk by stage</h2>
          <div className="mt-4 space-y-3">
            {stageInsights.map((insight) => (
              <div key={insight.stage} className="rounded-lg border border-slate-700/90 bg-slate-900/60 p-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-medium text-slate-200">{insight.stage.replace(/_/g, " ")}</p>
                    <p className="text-xs text-slate-400">{insight.reports} reports · avg wait {insight.avgDaysWaited.toFixed(1)} days</p>
                  </div>
                  <p className={`text-lg font-semibold ${ghostingRateClass(insight.ghostingRate)}`}>
                    {insight.ghostingRate.toFixed(1)}%
                  </p>
                </div>
              </div>
            ))}
            {stageInsights.length === 0 ? <p className="text-sm text-slate-400">No stage data yet.</p> : null}
          </div>
        </article>
      </div>

      <article className="panel mt-6 rounded-xl p-5">
        <h2 className="text-lg font-semibold text-slate-100">Recent candidate reports</h2>
        <div className="mt-4 grid gap-3">
          {recentReports.map((report) => (
            <div key={report.id} className="rounded-lg border border-slate-700/90 bg-slate-900/60 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <Link href={`/companies/${report.companySlug}`} className="font-semibold text-slate-100 hover:text-blue-300">
                    {report.companyName}
                  </Link>
                  <p className="text-xs text-slate-400">
                    {report.roleTitle} · {report.candidateLevel} · {report.interviewStage.replace(/_/g, " ")}
                  </p>
                </div>
                <p className="text-xs text-slate-400">{toRelativeDate(report.createdAt)}</p>
              </div>
              <p className="mt-2 line-clamp-3 text-sm text-slate-200">{report.experience}</p>
            </div>
          ))}
          {recentReports.length === 0 ? <p className="text-sm text-slate-400">No reports yet.</p> : null}
        </div>
      </article>
    </section>
  );
}
