import Link from "next/link";
import { Building2, Clock3, ShieldAlert } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { CompanySummary } from "@/lib/database";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

function riskBand(ghostingRate: number) {
  if (ghostingRate >= 70) {
    return { label: "High risk", className: "border-red-500/40 text-red-300" };
  }

  if (ghostingRate >= 40) {
    return {
      label: "Moderate risk",
      className: "border-amber-500/40 text-amber-200"
    };
  }

  return { label: "Lower risk", className: "border-emerald-500/40 text-emerald-200" };
}

export function CompanyCard({ company }: { company: CompanySummary }) {
  const risk = riskBand(company.ghostingRate);

  return (
    <Link
      href={`/companies/${company.slug}`}
      className="group block h-full transition-transform hover:-translate-y-0.5"
    >
      <Card className="h-full border-slate-800/90 group-hover:border-cyan-500/40 group-hover:bg-slate-900/90">
        <CardHeader>
          <div className="mb-3 flex items-start justify-between gap-3">
            <div>
              <CardTitle className="text-slate-50">{company.name}</CardTitle>
              <p className="mt-1 text-sm text-slate-400">
                {company.industry || "Unspecified industry"}
              </p>
            </div>
            <Badge className={risk.className}>{risk.label}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-3">
              <div className="mb-1 flex items-center gap-1.5 text-slate-400">
                <ShieldAlert className="h-4 w-4" />
                Ghosting
              </div>
              <div className="text-lg font-semibold text-slate-100">
                {company.ghostingRate.toFixed(1)}%
              </div>
            </div>
            <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-3">
              <div className="mb-1 flex items-center gap-1.5 text-slate-400">
                <Building2 className="h-4 w-4" />
                Reports
              </div>
              <div className="text-lg font-semibold text-slate-100">
                {company.totalReports}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Avg wait: {company.avgDaysWaited.toFixed(1)} days</span>
            <span className="flex items-center gap-1">
              <Clock3 className="h-3.5 w-3.5" />
              {company.lastReportedAt
                ? `${formatDistanceToNow(new Date(company.lastReportedAt))} ago`
                : "No recent reports"}
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
