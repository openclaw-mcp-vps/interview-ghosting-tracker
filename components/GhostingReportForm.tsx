"use client";

import { type ReactNode, useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

const reportSchema = z.object({
  companyName: z.string().min(2, "Company name is required"),
  website: z.string().url("Use a valid URL").optional().or(z.literal("")),
  industry: z.string().max(80).optional().or(z.literal("")),
  headquarters: z.string().max(120).optional().or(z.literal("")),
  roleTitle: z.string().min(2, "Role title is required"),
  candidateSeniority: z.enum(["junior", "mid", "senior", "staff", "executive"]),
  interviewStage: z.enum([
    "recruiter-screen",
    "hiring-manager",
    "technical",
    "panel",
    "final",
    "other"
  ]),
  interviewDate: z
    .string()
    .min(1, "Interview date is required")
    .refine((value) => !Number.isNaN(Date.parse(value)), "Use a valid date"),
  daysWaited: z.coerce.number().int().min(1).max(365),
  followUpCount: z.coerce.number().int().min(0).max(25),
  outcome: z.enum(["ghosted", "replied", "rejected", "offer"]),
  narrative: z
    .string()
    .min(80, "Share enough detail for others to learn from this experience")
    .max(2400)
});

type ReportSchema = z.infer<typeof reportSchema>;

export function GhostingReportForm() {
  const [successSlug, setSuccessSlug] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const form = useForm<ReportSchema>({
    resolver: zodResolver(reportSchema),
    defaultValues: {
      companyName: "",
      website: "",
      industry: "",
      headquarters: "",
      roleTitle: "",
      candidateSeniority: "mid",
      interviewStage: "technical",
      interviewDate: "",
      daysWaited: 14,
      followUpCount: 2,
      outcome: "ghosted",
      narrative: ""
    }
  });

  const onSubmit = form.handleSubmit(async (values) => {
    setSubmitError(null);
    setSuccessSlug(null);

    const response = await fetch("/api/reports", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(values)
    });

    const payload = (await response.json()) as {
      success?: boolean;
      error?: string;
      companySlug?: string;
    };

    if (!response.ok || !payload.success) {
      setSubmitError(payload.error ?? "Failed to submit your report.");
      return;
    }

    form.reset();
    setSuccessSlug(payload.companySlug ?? null);
  });

  const {
    register,
    formState: { errors, isSubmitting }
  } = form;

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <section className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <label className="text-sm font-medium text-slate-200" htmlFor="companyName">
            Company name
          </label>
          <Input id="companyName" {...register("companyName")} />
          {errors.companyName ? (
            <p className="text-sm text-red-300">{errors.companyName.message}</p>
          ) : null}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-200" htmlFor="website">
            Company website (optional)
          </label>
          <Input id="website" placeholder="https://example.com" {...register("website")} />
          {errors.website ? (
            <p className="text-sm text-red-300">{errors.website.message}</p>
          ) : null}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-200" htmlFor="industry">
            Industry (optional)
          </label>
          <Input id="industry" placeholder="SaaS, Healthtech, Fintech" {...register("industry")} />
          {errors.industry ? (
            <p className="text-sm text-red-300">{errors.industry.message}</p>
          ) : null}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-200" htmlFor="headquarters">
            HQ location (optional)
          </label>
          <Input id="headquarters" placeholder="Remote, NYC, Berlin" {...register("headquarters")} />
          {errors.headquarters ? (
            <p className="text-sm text-red-300">{errors.headquarters.message}</p>
          ) : null}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-200" htmlFor="roleTitle">
            Role title
          </label>
          <Input id="roleTitle" placeholder="Senior Product Designer" {...register("roleTitle")} />
          {errors.roleTitle ? (
            <p className="text-sm text-red-300">{errors.roleTitle.message}</p>
          ) : null}
        </div>

        <FieldSelect label="Your level" fieldId="candidateSeniority" error={errors.candidateSeniority?.message}>
          <option value="junior">Junior</option>
          <option value="mid">Mid-level</option>
          <option value="senior">Senior</option>
          <option value="staff">Staff/Principal</option>
          <option value="executive">Executive</option>
        </FieldSelect>

        <FieldSelect label="Latest stage reached" fieldId="interviewStage" error={errors.interviewStage?.message}>
          <option value="recruiter-screen">Recruiter screen</option>
          <option value="hiring-manager">Hiring manager</option>
          <option value="technical">Technical interview</option>
          <option value="panel">Panel interview</option>
          <option value="final">Final round</option>
          <option value="other">Other</option>
        </FieldSelect>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-200" htmlFor="interviewDate">
            Date of your most recent interview
          </label>
          <Input id="interviewDate" type="date" {...register("interviewDate")} />
          {errors.interviewDate ? (
            <p className="text-sm text-red-300">{errors.interviewDate.message}</p>
          ) : null}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-200" htmlFor="daysWaited">
            Days you waited for a response
          </label>
          <Input id="daysWaited" type="number" min={1} max={365} {...register("daysWaited")} />
          {errors.daysWaited ? (
            <p className="text-sm text-red-300">{errors.daysWaited.message}</p>
          ) : null}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-200" htmlFor="followUpCount">
            Number of follow-ups sent
          </label>
          <Input id="followUpCount" type="number" min={0} max={25} {...register("followUpCount")} />
          {errors.followUpCount ? (
            <p className="text-sm text-red-300">{errors.followUpCount.message}</p>
          ) : null}
        </div>

        <FieldSelect label="Outcome" fieldId="outcome" error={errors.outcome?.message}>
          <option value="ghosted">Ghosted</option>
          <option value="replied">Replied late</option>
          <option value="rejected">Rejected with closure</option>
          <option value="offer">Offer made</option>
        </FieldSelect>
      </section>

      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-200" htmlFor="narrative">
          What happened? Include timeline, follow-up attempts, and what would have made this fair.
        </label>
        <Textarea id="narrative" {...register("narrative")} />
        {errors.narrative ? (
          <p className="text-sm text-red-300">{errors.narrative.message}</p>
        ) : null}
      </div>

      {submitError ? (
        <div className="rounded-md border border-red-500/30 bg-red-950/40 px-3 py-2 text-sm text-red-200">
          {submitError}
        </div>
      ) : null}

      {successSlug ? (
        <div className="rounded-md border border-emerald-500/30 bg-emerald-950/40 px-3 py-2 text-sm text-emerald-200">
          <div className="mb-1 flex items-center gap-2 font-medium">
            <CheckCircle2 className="h-4 w-4" />
            Report submitted.
          </div>
          <p>
            Thanks for contributing signal to the community. You can now review the updated
            company profile at <a className="underline" href={`/companies/${successSlug}`}>/companies/{successSlug}</a>.
          </p>
        </div>
      ) : null}

      <Button type="submit" disabled={isSubmitting} className="min-w-40">
        {isSubmitting ? (
          <span className="inline-flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Submitting
          </span>
        ) : (
          "Submit report"
        )}
      </Button>
    </form>
  );

  function FieldSelect({
    children,
    label,
    fieldId,
    error
  }: {
    children: ReactNode;
    label: string;
    fieldId: keyof ReportSchema;
    error?: string;
  }) {
    return (
      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-200" htmlFor={fieldId}>
          {label}
        </label>
        <select
          id={fieldId}
          {...register(fieldId)}
          className="h-10 w-full rounded-md border border-slate-700 bg-slate-950/80 px-3 text-sm text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/50"
        >
          {children}
        </select>
        {error ? <p className="text-sm text-red-300">{error}</p> : null}
      </div>
    );
  }
}
