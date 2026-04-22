import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import type { CompanySummary } from "@/lib/database";

type CompanyCardProps = {
  company: CompanySummary;
};

function formatLastReported(value: string | null): string {
  if (!value) {
    return "No reports yet";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.valueOf())) {
    return "No reports yet";
  }

  return formatDistanceToNow(parsed, { addSuffix: true });
}

function ghostingRateClass(rate: number): string {
  if (rate >= 70) return "value-danger";
  if (rate >= 40) return "value-warn";
  return "value-ok";
}

export function CompanyCard({ company }: CompanyCardProps) {
  return (
    <article className="panel rounded-xl p-5 transition hover:border-slate-600/90">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-100">{company.name}</h3>
          <p className="mt-1 text-sm text-slate-400">{company.industry || "Industry not specified"}</p>
        </div>
        <div className="text-right">
          <p className={`text-2xl font-bold ${ghostingRateClass(company.ghostingRate)}`}>
            {company.ghostingRate.toFixed(1)}%
          </p>
          <p className="text-xs uppercase tracking-wide text-slate-500">ghosting rate</p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
        <div className="metric">
          <div className="text-slate-400">Reports</div>
          <div className="mt-1 text-base font-semibold text-slate-100">{company.totalReports}</div>
        </div>
        <div className="metric">
          <div className="text-slate-400">Avg wait</div>
          <div className="mt-1 text-base font-semibold text-slate-100">{company.avgDaysWaited.toFixed(1)} days</div>
        </div>
        <div className="metric">
          <div className="text-slate-400">Latest</div>
          <div className="mt-1 text-sm font-semibold text-slate-100">{formatLastReported(company.lastReportedAt)}</div>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-sm">
        <Link href={`/companies/${company.slug}`} className="btn-primary">
          View profile
        </Link>
        {company.website ? (
          <a
            href={company.website}
            target="_blank"
            rel="noreferrer"
            className="text-blue-300 underline underline-offset-2 hover:text-blue-200"
          >
            Visit website
          </a>
        ) : (
          <span className="text-slate-500">Website unavailable</span>
        )}
      </div>
    </article>
  );
}
