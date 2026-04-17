import { NextRequest, NextResponse } from "next/server";
import { getCompanyBySlug, listCompanies } from "@/lib/database";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get("slug");

  if (slug) {
    const company = await getCompanyBySlug(slug);
    if (!company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    return NextResponse.json({ company });
  }

  const query = searchParams.get("q") ?? undefined;
  const industry = searchParams.get("industry") ?? undefined;
  const minGhosting = searchParams.get("minGhosting");
  const limit = Number(searchParams.get("limit") ?? "30");

  const companies = await listCompanies({
    query,
    industry,
    minGhostingRate: minGhosting ? Number(minGhosting) : undefined,
    limit: Number.isFinite(limit) ? Math.min(Math.max(limit, 1), 100) : 30
  });

  return NextResponse.json({ companies });
}
