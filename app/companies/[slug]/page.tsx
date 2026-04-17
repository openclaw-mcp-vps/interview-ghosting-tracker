import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { GhostingStats } from "@/components/GhostingStats";
import { LemonCheckoutButton } from "@/components/LemonCheckoutButton";
import { hasPaidAccess } from "@/lib/access";
import { getCompanyBySlug } from "@/lib/database";
import { getCheckoutUrl } from "@/lib/lemonsqueezy";

type CompanyPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: CompanyPageProps): Promise<Metadata> {
  const { slug } = await params;
  const company = await getCompanyBySlug(slug);

  if (!company) {
    return { title: "Company not found" };
  }

  return {
    title: `${company.name} Ghosting Profile`,
    description: `${company.name} has a ${company.ghosting_rate}% ghosting rate across ${company.report_count} candidate reports.`
  };
}

export default async function CompanyPage({ params }: CompanyPageProps) {
  const { slug } = await params;
  const company = await getCompanyBySlug(slug);
  if (!company) notFound();

  const isMember = hasPaidAccess(await cookies());
  const visibleReports = isMember ? company.reports : company.reports.slice(0, 3);

  return (
    <main className="mx-auto max-w-5xl px-4 py-12">
      <Link href="/search" className="text-sm text-[#58a6ff] hover:text-white">
        ← Back to search
      </Link>

      <div className="mt-4 rounded-xl border border-[#2d333b] bg-[#161b22] p-6">
        <h1 className="text-3xl font-bold text-white">{company.name}</h1>
        <p className="mt-2 text-sm text-[#8b949e]">
          {company.industry ?? "Industry unknown"} • {company.headquarters ?? "Location unknown"}
        </p>

        <div className="mt-6 grid gap-4 sm:grid-cols-4">
          <Stat label="Ghosting rate" value={`${company.ghosting_rate}%`} />
          <Stat label="Reports" value={String(company.report_count)} />
          <Stat label="Avg response" value={`${company.avg_response_days || "-"} days`} />
          <Stat label="Process rating" value={`${company.avg_rating || "-"}/5`} />
        </div>
      </div>

      <div className="mt-6">
        <GhostingStats ghosted={company.ghosted_count} total={company.report_count} />
      </div>

      <section className="mt-6 rounded-xl border border-[#2d333b] bg-[#161b22] p-6">
        <h2 className="text-xl font-semibold text-white">Candidate experiences</h2>
        <div className="mt-4 space-y-4">
          {visibleReports.map((report) => (
            <article key={report.id} className="rounded-lg border border-[#2d333b] bg-[#0d1117] p-4">
              <p className="text-sm text-[#8b949e]">
                {report.role_title} • {report.interview_stage} • {report.response_days} day wait
              </p>
              <p className="mt-2 text-sm text-[#c9d1d9]">{report.candidate_summary}</p>
              <p className={`mt-2 text-xs ${report.was_ghosted ? "text-[#f85149]" : "text-[#3fb950]"}`}>
                {report.was_ghosted ? "Ghosted" : "Responded"} • Process rating {report.process_rating}/5
              </p>
            </article>
          ))}
        </div>

        {!isMember && company.reports.length > visibleReports.length && (
          <div className="mt-4 rounded-lg border border-[#2d333b] bg-[#0d1117] p-4">
            <p className="text-sm text-[#c9d1d9]">
              You are seeing {visibleReports.length} of {company.reports.length} reports. Unlock full report history and trend data.
            </p>
            <LemonCheckoutButton
              checkoutUrl={getCheckoutUrl()}
              className="mt-3 inline-flex rounded-md bg-[#238636] px-4 py-2 text-sm font-medium text-white hover:bg-[#2ea043]"
            >
              Unlock full company data
            </LemonCheckoutButton>
          </div>
        )}
      </section>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-[#2d333b] bg-[#0d1117] p-3">
      <p className="text-xs text-[#8b949e]">{label}</p>
      <p className="mt-1 text-xl font-semibold text-white">{value}</p>
    </div>
  );
}
