import { NextRequest, NextResponse } from "next/server";
import { getCompanySummaries, isDatabaseConfigured, type SortMode } from "@/lib/database";

export const runtime = "nodejs";

const sortModes: SortMode[] = ["ghosting_rate", "reports", "recent", "name"];

function toSort(value: string | null): SortMode {
  if (value && sortModes.includes(value as SortMode)) {
    return value as SortMode;
  }

  return "ghosting_rate";
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const query = searchParams.get("q")?.trim() || undefined;
  const stage = searchParams.get("stage")?.trim() || undefined;
  const minReports = Math.max(0, Number(searchParams.get("minReports") || "0") || 0);
  const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") || "50") || 50));
  const sort = toSort(searchParams.get("sort"));

  const companies = await getCompanySummaries({
    query,
    stage,
    minReports,
    sort,
    limit
  });

  return NextResponse.json({
    companies,
    dbConfigured: isDatabaseConfigured()
  });
}
