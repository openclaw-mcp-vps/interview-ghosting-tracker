import { NextResponse } from "next/server";
import { listCompanies } from "@/lib/database";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const q = url.searchParams.get("q")?.trim() ?? "";
  const industry = url.searchParams.get("industry")?.trim() ?? "";
  const limit = Number(url.searchParams.get("limit") ?? 24);

  try {
    const companies = await listCompanies({
      query: q,
      industry,
      limit: Number.isFinite(limit) ? Math.min(Math.max(limit, 1), 100) : 24
    });

    return NextResponse.json({ companies });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load company data.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
