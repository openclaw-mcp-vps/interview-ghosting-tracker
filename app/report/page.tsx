import type { Metadata } from "next";
import { GhostingReportForm } from "@/components/GhostingReportForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Submit a Report",
  description:
    "Share your interview experience so candidates can see which companies follow through."
};

export default function ReportPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-50">Report interview ghosting</h1>
        <p className="mt-2 max-w-3xl text-slate-300">
          Share what happened, when it happened, and how long you waited. Your report helps
          candidates decide where to invest effort.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Submission checklist</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-slate-300">
          <p>Use your most recent interview date and real wait time.</p>
          <p>Include follow-up attempts and whether you received closure.</p>
          <p>Keep details factual and process-focused.</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>New ghosting report</CardTitle>
        </CardHeader>
        <CardContent>
          <GhostingReportForm />
        </CardContent>
      </Card>
    </div>
  );
}
