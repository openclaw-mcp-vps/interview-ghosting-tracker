"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertTriangle, CheckCircle2, LoaderCircle } from "lucide-react";

const optionalUrl = z
  .union([z.literal(""), z.string().url("Enter a full URL including https://")])
  .optional()
  .transform((value) => (value && value.length > 0 ? value : undefined));

const reportSchema = z.object({
  companyName: z.string().min(2, "Company name is required"),
  companyWebsite: optionalUrl,
  industry: z.string().max(80, "Industry is too long").optional(),
  roleTitle: z.string().min(2, "Role title is required"),
  candidateFunction: z.string().min(2, "Pick a function"),
  candidateLevel: z.string().min(2, "Pick a level"),
  interviewStage: z.string().min(2, "Pick a stage"),
  interviewCount: z.coerce.number().int().min(1, "Must be at least 1").max(20, "Keep it under 20"),
  daysWaited: z.coerce.number().int().min(0, "Cannot be negative").max(365, "Keep it under 365"),
  lastContactDate: z
    .string()
    .min(1, "Last contact date is required")
    .refine((value) => !Number.isNaN(new Date(value).valueOf()), "Enter a valid date"),
  location: z.string().max(120, "Location is too long").optional(),
  experience: z.string().min(80, "Add more detail (at least 80 characters)").max(4000, "Keep under 4000 characters"),
  eventualResponse: z.boolean(),
  publicConsent: z.literal(true, {
    errorMap: () => ({ message: "You must allow this report to be publicly visible." })
  }),
  reporterEmail: z
    .union([z.literal(""), z.string().email("Enter a valid email")])
    .optional()
    .transform((value) => (value && value.length > 0 ? value : undefined))
});

type ReportFormValues = z.infer<typeof reportSchema>;

type SubmitResponse = {
  companySlug: string;
  reportId: number;
};

const functionOptions = [
  "Engineering",
  "Product",
  "Design",
  "Marketing",
  "Sales",
  "Data",
  "Operations",
  "People",
  "Finance",
  "Other"
];

const levelOptions = [
  "Intern",
  "Entry level",
  "Mid-level",
  "Senior",
  "Staff/Principal",
  "Director+",
  "Executive"
];

const stageOptions = [
  { value: "recruiter_screen", label: "Recruiter screen" },
  { value: "hiring_manager", label: "Hiring manager" },
  { value: "take_home", label: "Take-home assignment" },
  { value: "technical", label: "Technical interview" },
  { value: "onsite", label: "Onsite or panel" },
  { value: "final", label: "Final round" }
];

export function GhostingReportForm() {
  const [requestError, setRequestError] = useState<string | null>(null);
  const [created, setCreated] = useState<SubmitResponse | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<ReportFormValues>({
    resolver: zodResolver(reportSchema),
    defaultValues: {
      eventualResponse: false,
      publicConsent: true,
      interviewCount: 3,
      daysWaited: 14,
      candidateFunction: "Engineering",
      candidateLevel: "Mid-level",
      interviewStage: "technical"
    }
  });

  const onSubmit = handleSubmit(async (values) => {
    setRequestError(null);
    setCreated(null);

    const response = await fetch("/api/reports", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(values)
    });

    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as { error?: string } | null;
      setRequestError(body?.error || "Could not submit report. Please try again.");
      return;
    }

    const body = (await response.json()) as SubmitResponse;
    setCreated(body);
  });

  return (
    <div className="panel rounded-2xl p-5 sm:p-7">
      {created ? (
        <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-4 text-emerald-200">
          <p className="flex items-center gap-2 text-sm font-semibold">
            <CheckCircle2 className="h-4 w-4" />
            Report submitted successfully.
          </p>
          <p className="mt-2 text-sm">
            Thank you for helping candidates make better decisions. View the company profile at{" "}
            <a className="underline underline-offset-2" href={`/companies/${created.companySlug}`}>
              /companies/{created.companySlug}
            </a>
            .
          </p>
        </div>
      ) : null}

      {requestError ? (
        <div className="mb-4 rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-red-200">
          <p className="flex items-center gap-2 text-sm font-semibold">
            <AlertTriangle className="h-4 w-4" />
            {requestError}
          </p>
        </div>
      ) : null}

      <form onSubmit={onSubmit} className="grid gap-4">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="text-sm text-slate-300">
            Company name
            <input className="input mt-1" placeholder="Example: Acme Labs" {...register("companyName")} />
            {errors.companyName ? <span className="mt-1 block text-xs text-red-300">{errors.companyName.message}</span> : null}
          </label>

          <label className="text-sm text-slate-300">
            Company website (optional)
            <input className="input mt-1" placeholder="https://company.com" {...register("companyWebsite")} />
            {errors.companyWebsite ? (
              <span className="mt-1 block text-xs text-red-300">{errors.companyWebsite.message}</span>
            ) : null}
          </label>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <label className="text-sm text-slate-300">
            Industry (optional)
            <input className="input mt-1" placeholder="B2B SaaS" {...register("industry")} />
          </label>

          <label className="text-sm text-slate-300">
            Role title
            <input className="input mt-1" placeholder="Senior Product Designer" {...register("roleTitle")} />
            {errors.roleTitle ? <span className="mt-1 block text-xs text-red-300">{errors.roleTitle.message}</span> : null}
          </label>

          <label className="text-sm text-slate-300">
            Location (optional)
            <input className="input mt-1" placeholder="Remote (US)" {...register("location")} />
          </label>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <label className="text-sm text-slate-300">
            Function
            <select className="input mt-1" {...register("candidateFunction")}>
              {functionOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>

          <label className="text-sm text-slate-300">
            Level
            <select className="input mt-1" {...register("candidateLevel")}>
              {levelOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>

          <label className="text-sm text-slate-300">
            Stage ghosted at
            <select className="input mt-1" {...register("interviewStage")}>
              {stageOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <label className="text-sm text-slate-300">
            Number of interviews
            <input className="input mt-1" type="number" min={1} max={20} {...register("interviewCount")} />
            {errors.interviewCount ? (
              <span className="mt-1 block text-xs text-red-300">{errors.interviewCount.message}</span>
            ) : null}
          </label>

          <label className="text-sm text-slate-300">
            Days waited after last contact
            <input className="input mt-1" type="number" min={0} max={365} {...register("daysWaited")} />
            {errors.daysWaited ? <span className="mt-1 block text-xs text-red-300">{errors.daysWaited.message}</span> : null}
          </label>

          <label className="text-sm text-slate-300">
            Last contact date
            <input className="input mt-1" type="date" {...register("lastContactDate")} />
            {errors.lastContactDate ? (
              <span className="mt-1 block text-xs text-red-300">{errors.lastContactDate.message}</span>
            ) : null}
          </label>
        </div>

        <label className="text-sm text-slate-300">
          What happened?
          <textarea
            className="input mt-1 min-h-32"
            placeholder="Share interview timeline, promised feedback dates, and whether you followed up."
            {...register("experience")}
          />
          {errors.experience ? <span className="mt-1 block text-xs text-red-300">{errors.experience.message}</span> : null}
        </label>

        <div className="grid gap-3 rounded-xl border border-slate-700/80 bg-slate-900/60 p-4 text-sm">
          <label className="flex items-start gap-3 text-slate-200">
            <input type="checkbox" className="mt-1" {...register("eventualResponse")} />
            <span>I eventually received a response after being ghosted.</span>
          </label>

          <label className="flex items-start gap-3 text-slate-200">
            <input type="checkbox" className="mt-1" {...register("publicConsent")} />
            <span>I consent to publishing this anonymized report publicly.</span>
          </label>
          {errors.publicConsent ? <span className="text-xs text-red-300">{errors.publicConsent.message}</span> : null}

          <label className="text-sm text-slate-300">
            Email for paid insights (optional)
            <input className="input mt-1" placeholder="you@domain.com" {...register("reporterEmail")} />
            <span className="mt-1 block text-xs text-slate-500">
              We store an irreversible hash for abuse prevention. Email is optional.
            </span>
            {errors.reporterEmail ? <span className="mt-1 block text-xs text-red-300">{errors.reporterEmail.message}</span> : null}
          </label>
        </div>

        <button type="submit" disabled={isSubmitting} className="btn-primary w-full sm:w-fit disabled:cursor-not-allowed disabled:opacity-70">
          {isSubmitting ? (
            <span className="inline-flex items-center gap-2">
              <LoaderCircle className="h-4 w-4 animate-spin" />
              Submitting...
            </span>
          ) : (
            "Submit ghosting report"
          )}
        </button>
      </form>
    </div>
  );
}
