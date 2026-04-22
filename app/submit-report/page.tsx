import type { Metadata } from "next";
import { GhostingReportForm } from "@/components/GhostingReportForm";

export const metadata: Metadata = {
  title: "Submit a Ghosting Report",
  description:
    "Share your interview ghosting experience to help other candidates make informed decisions before applying."
};

export default function SubmitReportPage() {
  return (
    <section className="container-page py-10 sm:py-14">
      <div className="max-w-3xl">
        <h1 className="text-3xl font-semibold text-slate-100 sm:text-4xl">Submit an interview ghosting report</h1>
        <p className="mt-3 text-sm text-slate-300 sm:text-base">
          Your report becomes part of a public accountability record. Include enough timeline detail so other candidates
          can evaluate whether the process was respectful and transparent.
        </p>
      </div>

      <div className="mt-6">
        <GhostingReportForm />
      </div>
    </section>
  );
}
