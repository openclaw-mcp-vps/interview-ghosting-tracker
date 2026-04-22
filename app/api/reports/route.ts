import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createGhostingReport, getCompanyProfileBySlug, getReportsByCompanyId } from "@/lib/database";
import { ACCESS_COOKIE_NAME, readAccessCookieValue } from "@/lib/lemonsqueezy";

export const runtime = "nodejs";

const reportSchema = z.object({
  companyName: z.string().min(2),
  companyWebsite: z.union([z.literal(""), z.string().url()]).optional(),
  industry: z.string().max(80).optional(),
  roleTitle: z.string().min(2),
  candidateFunction: z.string().min(2),
  candidateLevel: z.string().min(2),
  interviewStage: z.string().min(2),
  interviewCount: z.number().int().min(1).max(20),
  daysWaited: z.number().int().min(0).max(365),
  lastContactDate: z.string().min(1),
  location: z.string().max(120).optional(),
  experience: z.string().min(80).max(4000),
  eventualResponse: z.boolean(),
  publicConsent: z.boolean(),
  reporterEmail: z.union([z.literal(""), z.string().email()]).optional()
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = reportSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid report payload",
          details: parsed.error.flatten()
        },
        { status: 400 }
      );
    }

    if (!parsed.data.publicConsent) {
      return NextResponse.json(
        {
          error: "Public consent is required to publish this report"
        },
        { status: 400 }
      );
    }

    const report = await createGhostingReport({
      ...parsed.data,
      companyWebsite: parsed.data.companyWebsite || undefined,
      reporterEmail: parsed.data.reporterEmail || undefined
    });

    return NextResponse.json(report, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create report";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get("slug");

  if (!slug) {
    return NextResponse.json({ error: "Missing slug query parameter" }, { status: 400 });
  }

  const company = await getCompanyProfileBySlug(slug);

  if (!company) {
    return NextResponse.json({ error: "Company not found" }, { status: 404 });
  }

  const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") || "50") || 50));

  const access = readAccessCookieValue(request.cookies.get(ACCESS_COOKIE_NAME)?.value);
  const hasPremium = Boolean(access);

  const reports = await getReportsByCompanyId(company.id, limit);

  return NextResponse.json({
    company,
    premium: hasPremium,
    reports: hasPremium
      ? reports
      : reports.map((report) => ({
          ...report,
          experience:
            report.experience.length > 180 ? `${report.experience.slice(0, 180)}...` : report.experience
        }))
  });
}
