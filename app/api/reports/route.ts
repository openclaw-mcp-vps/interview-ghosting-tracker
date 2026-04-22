import { z } from "zod";
import { NextResponse } from "next/server";
import { createReport, listRecentReports } from "@/lib/database";

const reportSchema = z.object({
  companyName: z.string().min(2),
  website: z.string().url().optional().or(z.literal("")),
  industry: z.string().max(80).optional().or(z.literal("")),
  headquarters: z.string().max(120).optional().or(z.literal("")),
  roleTitle: z.string().min(2),
  candidateSeniority: z.enum(["junior", "mid", "senior", "staff", "executive"]),
  interviewStage: z.enum([
    "recruiter-screen",
    "hiring-manager",
    "technical",
    "panel",
    "final",
    "other"
  ]),
  interviewDate: z.string().refine((value) => !Number.isNaN(Date.parse(value))),
  daysWaited: z.number().int().min(1).max(365),
  followUpCount: z.number().int().min(0).max(25),
  outcome: z.enum(["ghosted", "replied", "rejected", "offer"]),
  narrative: z.string().min(80).max(2400)
});

export async function GET(request: Request) {
  const url = new URL(request.url);
  const limit = Number(url.searchParams.get("limit") ?? 20);

  try {
    const reports = await listRecentReports(
      Number.isFinite(limit) ? Math.min(Math.max(limit, 1), 100) : 20
    );

    return NextResponse.json({ reports });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load report data.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const rawBody = await request.json();
    const parsed = reportSchema.parse(rawBody);

    const result = await createReport(parsed);

    return NextResponse.json({
      success: true,
      companySlug: result.companySlug
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstIssue = error.issues[0]?.message ?? "Invalid input.";
      return NextResponse.json({ error: firstIssue }, { status: 400 });
    }

    const message =
      error instanceof Error ? error.message : "Failed to submit report.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
