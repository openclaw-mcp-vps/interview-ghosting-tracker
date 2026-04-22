import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { format } from "date-fns";
import { Lock } from "lucide-react";
import { getAccessContext } from "@/lib/access";
import { getCompanyBySlug } from "@/lib/database";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

type CompanyPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export async function generateMetadata({ params }: CompanyPageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const company = await getCompanyBySlug(resolvedParams.slug).catch(() => null);

  if (!company) {
    return {
      title: "Company not found"
    };
  }

  return {
    title: `${company.name} ghosting profile`,
    description: `${company.name} has a ${company.ghostingRate.toFixed(
      1
    )}% ghosting rate across ${company.totalReports} candidate reports.`
  };
}

export default async function CompanyPage({ params }: CompanyPageProps) {
  const paymentLink = process.env.NEXT_PUBLIC_STRIPE_PAYMENT_LINK as string;
  const resolvedParams = await params;

  const [company, access] = await Promise.all([
    getCompanyBySlug(resolvedParams.slug).catch(() => null),
    getAccessContext()
  ]);

  if (!company) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-slate-800 bg-slate-900/70 p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-50">{company.name}</h1>
            <p className="mt-1 text-slate-300">
              {company.industry || "Industry not specified"}
              {company.headquarters ? ` • ${company.headquarters}` : ""}
            </p>
            {company.website ? (
              <a
                className="mt-2 inline-block text-sm text-cyan-300 hover:underline"
                href={company.website}
                target="_blank"
                rel="noreferrer"
              >
                {company.website}
              </a>
            ) : null}
          </div>

          <div className="grid min-w-56 grid-cols-2 gap-3 text-sm">
            <Metric label="Ghosting rate" value={`${company.ghostingRate.toFixed(1)}%`} />
            <Metric label="Reports" value={company.totalReports.toString()} />
            <Metric label="Avg wait" value={`${company.avgDaysWaited.toFixed(1)} days`} />
            <Metric
              label="Last report"
              value={company.lastReportedAt ? format(new Date(company.lastReportedAt), "MMM d") : "N/A"}
            />
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Stage breakdown</CardTitle>
            <CardDescription>Where ghosting tends to happen in this funnel</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {company.stageBreakdown.length === 0 ? (
              <p className="text-sm text-slate-400">No stage data yet.</p>
            ) : (
              company.stageBreakdown.map((stage) => (
                <div key={stage.stage} className="rounded-lg border border-slate-800 bg-slate-950/70 p-3">
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="font-medium text-slate-100">{stage.stage}</span>
                    <span className="text-slate-300">{stage.ghostingRate.toFixed(1)}% ghosted</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-800">
                    <div
                      className="h-2 rounded-full bg-cyan-400"
                      style={{ width: `${Math.min(stage.ghostingRate, 100)}%` }}
                    />
                  </div>
                  <p className="mt-1 text-xs text-slate-400">
                    {stage.ghostedCount} of {stage.reportCount} reports
                  </p>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>What this means</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-slate-300">
            <p>
              A higher ghosting rate indicates more candidates were left without closure after
              interviews.
            </p>
            <p>
              Compare this profile with similar companies before committing to lengthy processes.
            </p>
            <p>
              Add your report to increase confidence in the signal and protect other candidates.
            </p>
            <Link href="/report" className="inline-block text-cyan-300 hover:underline">
              Submit your experience
            </Link>
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Candidate experiences</CardTitle>
          <CardDescription>
            {access.hasAccess
              ? "Full reports from candidates"
              : "Detailed narratives are subscriber-only"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {!access.hasAccess ? (
            <div className="rounded-lg border border-cyan-500/30 bg-cyan-500/5 p-4">
              <p className="mb-3 flex items-center gap-2 text-sm text-cyan-200">
                <Lock className="h-4 w-4" />
                Unlock detailed timelines, follow-up behavior, and role-level context.
              </p>
              <div className="flex flex-wrap gap-3">
                <a href={paymentLink} target="_blank" rel="noreferrer">
                  <Button>Buy access for $8/mo</Button>
                </a>
                <Link href="/unlock">
                  <Button variant="outline">Already paid? Unlock access</Button>
                </Link>
              </div>
            </div>
          ) : null}

          {company.reports.map((report) => (
            <article key={report.id} className="rounded-lg border border-slate-800 bg-slate-950/70 p-3">
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                <span className="font-medium text-slate-100">{report.roleTitle}</span>
                <span className="text-slate-400">{report.candidateSeniority}</span>
                <span className="text-slate-400">{report.interviewStage}</span>
                <span className="text-slate-400">{report.daysWaited} days waited</span>
                <span className="text-slate-400">{report.followUpCount} follow-ups</span>
              </div>
              <p className="mt-2 text-sm text-slate-300">
                {access.hasAccess
                  ? report.narrative
                  : `${report.narrative.slice(0, 180)}${report.narrative.length > 180 ? "..." : ""}`}
              </p>
              <p className="mt-2 text-xs text-slate-500">
                Interview date: {format(new Date(report.interviewDate), "MMM d, yyyy")}
              </p>
            </article>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-3">
      <p className="text-xs text-slate-400">{label}</p>
      <p className="mt-1 font-semibold text-slate-100">{value}</p>
    </div>
  );
}
