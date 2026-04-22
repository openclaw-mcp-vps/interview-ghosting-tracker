import Link from "next/link";
import type { Metadata } from "next";
import { Lock, TrendingDown, TrendingUp } from "lucide-react";
import { format } from "date-fns";
import { getAccessContext } from "@/lib/access";
import { getDashboardData, listRecentReports } from "@/lib/database";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Dashboard",
  description:
    "Subscriber analytics for interview ghosting trends, high-risk companies, and candidate timelines."
};

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const paymentLink = process.env.NEXT_PUBLIC_STRIPE_PAYMENT_LINK as string;

  const access = await getAccessContext();

  if (!access.hasAccess) {
    return (
      <div className="mx-auto max-w-2xl space-y-5 py-10">
        <Card className="border-cyan-500/30 bg-cyan-500/5">
          <CardHeader>
            <div className="mb-2 inline-flex h-10 w-10 items-center justify-center rounded-full bg-cyan-500/20 text-cyan-300">
              <Lock className="h-5 w-5" />
            </div>
            <CardTitle>Subscriber dashboard</CardTitle>
            <CardDescription>
              Unlock company risk rankings, timeline analytics, and interview-stage breakdowns.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <a href={paymentLink} target="_blank" rel="noreferrer">
              <Button>Buy access for $8/mo</Button>
            </a>
            <Link href="/unlock">
              <Button variant="outline">Already paid? Unlock now</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  let dashboard: Awaited<ReturnType<typeof getDashboardData>> | null = null;
  let reports: Awaited<ReturnType<typeof listRecentReports>> = [];
  let error = "";

  try {
    [dashboard, reports] = await Promise.all([getDashboardData(), listRecentReports(20)]);
  } catch {
    error = "Database connection is unavailable. Configure DATABASE_URL to view analytics.";
  }

  if (error || !dashboard) {
    return (
      <div className="rounded-lg border border-amber-500/40 bg-amber-950/30 px-4 py-3 text-sm text-amber-200">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-50">Insights dashboard</h1>
        <p className="mt-2 text-slate-300">
          Logged in as <span className="text-cyan-300">{access.email}</span>. Use this to avoid
          high-risk interview loops.
        </p>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Companies tracked" value={dashboard.totals.companiesTracked.toString()} />
        <StatCard label="Reports logged" value={dashboard.totals.reportsLogged.toString()} />
        <StatCard
          label="Overall ghosting"
          value={`${dashboard.totals.overallGhostingRate.toFixed(1)}%`}
        />
        <StatCard
          label="Avg days waiting"
          value={dashboard.totals.averageDaysWaiting.toFixed(1)}
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-red-300" />
              Highest ghosting risk
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {dashboard.highestRiskCompanies.map((company) => (
              <div key={company.slug} className="rounded-lg border border-slate-800 bg-slate-950/70 p-3 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <Link href={`/companies/${company.slug}`} className="font-medium text-slate-100 hover:underline">
                    {company.name}
                  </Link>
                  <span className="text-red-300">{company.ghostingRate.toFixed(1)}%</span>
                </div>
                <p className="mt-1 text-xs text-slate-400">
                  {company.totalReports} reports, {company.avgDaysWaited.toFixed(1)} average days waiting
                </p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-emerald-300" />
              Best responder list
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {dashboard.fastestResponders.map((company) => (
              <div key={company.slug} className="rounded-lg border border-slate-800 bg-slate-950/70 p-3 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <Link href={`/companies/${company.slug}`} className="font-medium text-slate-100 hover:underline">
                    {company.name}
                  </Link>
                  <span className="text-emerald-300">{company.ghostingRate.toFixed(1)}%</span>
                </div>
                <p className="mt-1 text-xs text-slate-400">
                  {company.totalReports} reports, {company.avgDaysWaited.toFixed(1)} average days waiting
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Recent candidate experiences</CardTitle>
          <CardDescription>Newest submissions across all companies</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {reports.map((report) => (
            <article key={report.id} className="rounded-lg border border-slate-800 bg-slate-950/70 p-3">
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                <Link
                  href={`/companies/${report.companySlug}`}
                  className="font-medium text-slate-100 hover:underline"
                >
                  {report.companyName}
                </Link>
                <span className="text-slate-400">{report.roleTitle}</span>
                <span className="text-slate-400">{report.interviewStage}</span>
                <span className="text-slate-400">{format(new Date(report.interviewDate), "MMM d, yyyy")}</span>
              </div>
              <p className="mt-2 text-sm text-slate-300">{report.narrative}</p>
            </article>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardHeader>
        <CardDescription>{label}</CardDescription>
        <CardTitle className="text-3xl text-cyan-300">{value}</CardTitle>
      </CardHeader>
    </Card>
  );
}
