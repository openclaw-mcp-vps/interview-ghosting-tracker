import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createReport } from "@/lib/database";

const reportSchema = z.object({
  companyName: z.string().min(2),
  website: z.string().url().optional().or(z.literal("")),
  industry: z.string().min(2),
  headquarters: z.string().min(2),
  roleTitle: z.string().min(2),
  interviewStage: z.string().min(2),
  interviewedAt: z.string().min(1),
  responseDays: z.number().int().min(0).max(180),
  wasGhosted: z.boolean(),
  candidateSummary: z.string().min(40),
  processRating: z.number().int().min(1).max(5)
});

export async function POST(request: NextRequest) {
  try {
    const json = (await request.json()) as unknown;
    const parsed = reportSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid report payload" }, { status: 400 });
    }

    await createReport(parsed.data);
    return NextResponse.json({ message: "Thanks. Your anonymous report is now live." });
  } catch (error) {
    console.error("Failed to save report", error);
    return NextResponse.json({ error: "Unable to submit report right now" }, { status: 500 });
  }
}
