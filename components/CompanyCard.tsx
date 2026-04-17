import Link from "next/link";
import { Building2, MapPin, Timer } from "lucide-react";
import type { CompanySummary } from "@/lib/database";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type CompanyCardProps = {
  company: CompanySummary;
  showLockedDetails?: boolean;
};

export function CompanyCard({ company, showLockedDetails = false }: CompanyCardProps) {
  const ghostingClass =
    company.ghosting_rate >= 60 ? "bg-red-500/20 text-red-300" : company.ghosting_rate >= 30 ? "bg-amber-500/20 text-amber-300" : "bg-green-500/20 text-green-300";

  return (
    <Card className="border-[#2d333b] bg-[#161b22]">
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="text-lg text-white">
              <Link href={`/companies/${company.slug}`} className="hover:text-[#58a6ff]">
                {company.name}
              </Link>
            </CardTitle>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-[#8b949e]">
              {company.industry && (
                <span className="inline-flex items-center gap-1">
                  <Building2 className="h-3.5 w-3.5" />
                  {company.industry}
                </span>
              )}
              {company.headquarters && (
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  {company.headquarters}
                </span>
              )}
            </div>
          </div>
          <Badge className={ghostingClass}>{company.ghosting_rate}% ghosting</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
          <div>
            <p className="text-[#8b949e]">Reports</p>
            <p className="font-semibold text-white">{company.report_count}</p>
          </div>
          <div>
            <p className="text-[#8b949e]">Ghosted</p>
            <p className="font-semibold text-white">{company.ghosted_count}</p>
          </div>
          <div>
            <p className="text-[#8b949e]">Avg rating</p>
            <p className="font-semibold text-white">{company.avg_rating || "-"}/5</p>
          </div>
          <div>
            <p className="inline-flex items-center gap-1 text-[#8b949e]">
              <Timer className="h-3.5 w-3.5" />
              Avg wait
            </p>
            <p className="font-semibold text-white">{company.avg_response_days || "-"} days</p>
          </div>
        </div>
        {showLockedDetails && (
          <p className="mt-3 rounded-md border border-[#2d333b] bg-[#0d1117] p-2 text-xs text-[#8b949e]">
            Detailed timeline and role-level trend analysis are unlocked for members.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
