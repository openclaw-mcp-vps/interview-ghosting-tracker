import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { format } from "date-fns";
import { getCompanyProfileBySlug, getReportsByCompanyId } from "@/lib/database";
import { ACCESS_COOKIE_NAME, readAccessCookieValue } from "@/lib/lemonsqueezy";

export const dynamic = "force-dynamic";

type CompanyPageProps = {
  params: Promise<{ slug: string }>;
};

const stageLabels: Record<string, string> = {
  recruiter_screen: "Recruiter screen",
  hiring_manager: "Hiring manager",
  take_home: "Take-home assignment",
  technical: "Technical interview",
  onsite: "Onsite / panel",
  final: "Final round"
};

function formatStage(stage: string): string {
  return stageLabels[stage] || stage.replace(/_/g, " ");
}

function formatDate(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.valueOf())) {
    return "Unknown date";
  }

  return format(parsed, "MMM d, yyyy");
}

function ghostingRateClass(rate: number): string {
  if (rate >= 70) return "value-danger";
  if (rate >= 40) return "value-warn";
  return "value-ok";
}

export async function generateMetadata({ params }: CompanyPageProps): Promise<Metadata> {
  const { slug } = await params;
  const company = await getCompanyProfileBySlug(slug);

  if (!company) {
    return {
      title: "Company profile not found"
    };
  }

  return {
    title: `${company.name} ghosting profile`,
    description: `${company.name} has ${company.totalReports} reports and a ${company.ghostingRate.toFixed(1)}% ghosting rate.`
  };
}

export default async function CompanyProfilePage({ params }: CompanyPageProps) {
  const { slug } = await params;
  const company = await getCompanyProfileBySlug(slug);

  if (!company) {
    notFound();
  }

  const reports = await getReportsByCompanyId(company.id, 100);

  const cookieStore = await cookies();
  const access = readAccessCookieValue(cookieStore.get(ACCESS_COOKIE_NAME)?.value);
  const hasPremium = Boolean(access);

  const visibleReports = hasPremium ? reports : reports.slice(0, 3);
  const hiddenCount = Math.max(0, reports.length - visibleReports.length);
  const buyLink = process.env.NEXT_PUBLIC_STRIPE_PAYMENT_LINK;

  return (
    <section className="container-page py-10 sm:py-14">
      <div className="panel rounded-2xl p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <span className="kicker">Company profile</span>
            <h1 className="mt-3 text-3xl font-semibold text-slate-100 sm:text-4xl">{company.name}</h1>
            <p className="mt-2 text-sm text-slate-300">
              {company.industry || "Industry unspecified"}
              {company.website ? (
                <>
                  {" · "}
                  <a href={company.website} target="_blank" rel="noreferrer" className="text-blue-300 underline underline-offset-2">
                    Website
                  </a>
                </>
              ) : null}
            </p>
          </div>
          <div className="text-right">
            <p className={`text-3xl font-bold ${ghostingRateClass(company.ghostingRate)}`}>{company.ghostingRate.toFixed(1)}%</p>
            <p className="text-xs uppercase tracking-wide text-slate-400">ghosting rate</p>
          </div>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <div className="metric">
            <p className="text-xs uppercase tracking-wide text-slate-400">Total reports</p>
            <p className="mt-1 text-2xl font-semibold text-slate-100">{company.totalReports}</p>
          </div>
          <div className="metric">
            <p className="text-xs uppercase tracking-wide text-slate-400">Average wait</p>
            <p className="mt-1 text-2xl font-semibold text-slate-100">{company.avgDaysWaited.toFixed(1)} days</p>
          </div>
          <div className="metric">
            <p className="text-xs uppercase tracking-wide text-slate-400">Last report</p>
            <p className="mt-1 text-lg font-semibold text-slate-100">
              {company.lastReportedAt ? formatDate(company.lastReportedAt) : "No reports yet"}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-8 flex items-center justify-between gap-4">
        <h2 className="text-2xl font-semibold text-slate-100">Candidate experiences</h2>
        <Link href="/search" className="text-sm text-blue-300 underline underline-offset-2">
          Back to search
        </Link>
      </div>

      {!hasPremium ? (
        <div className="panel mt-4 rounded-xl border-blue-700/70 p-4 text-sm text-slate-200">
          Full candidate narratives are premium. You are viewing a limited preview.
          {hiddenCount > 0 ? ` ${hiddenCount} additional reports are locked.` : ""}
          <div className="mt-3 flex flex-wrap gap-2">
            <a href={buyLink} className="btn-primary">
              Buy premium access
            </a>
            <Link href="/dashboard" className="btn-secondary">
              Activate access
            </Link>
          </div>
        </div>
      ) : null}

      <div className="mt-4 grid gap-4">
        {visibleReports.map((report) => (
          <article key={report.id} className="panel rounded-xl p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-slate-100">{report.roleTitle}</h3>
                <p className="mt-1 text-sm text-slate-400">
                  {report.candidateFunction} · {report.candidateLevel} · {formatStage(report.interviewStage)}
                </p>
              </div>
              <div className="text-sm text-slate-300">
                <p>{report.interviewCount} interviews</p>
                <p>{report.daysWaited} days waited</p>
              </div>
            </div>

            <div className="mt-3 rounded-lg border border-slate-700 bg-slate-900/50 p-4">
              {hasPremium ? (
                <p className="whitespace-pre-line text-sm leading-relaxed text-slate-200">{report.experience}</p>
              ) : (
                <p className="text-sm leading-relaxed text-slate-300">
                  {report.experience.slice(0, 180)}
                  {report.experience.length > 180 ? "..." : ""}
                </p>
              )}
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-400">
              <span>Last contact: {formatDate(report.lastContactDate)}</span>
              <span>Reported: {formatDate(report.createdAt)}</span>
              <span>{report.eventualResponse ? "Eventually received a response" : "No response received"}</span>
            </div>
          </article>
        ))}
      </div>

      {reports.length === 0 ? (
        <div className="panel mt-4 rounded-xl p-5 text-sm text-slate-300">
          No public reports yet for this company.
          <Link href="/submit-report" className="ml-2 text-blue-300 underline underline-offset-2">
            Submit the first report
          </Link>
          .
        </div>
      ) : null}
    </section>
  );
}
