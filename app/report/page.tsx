import type { Metadata } from "next";
import { ReportForm } from "@/components/ReportForm";

export const metadata: Metadata = {
  title: "Submit an Interview Ghosting Report",
  description: "Share anonymous interview ghosting experiences to improve hiring transparency for everyone."
};

export default function ReportPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="text-3xl font-bold text-white">Report an Interview Experience</h1>
      <p className="mt-3 text-[#8b949e]">
        Your report helps other candidates avoid companies that fail to communicate. Focus on timeline, stage, and outcome.
      </p>
      <div className="mt-8">
        <ReportForm />
      </div>
    </main>
  );
}
