"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import type { ReactNode } from "react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const reportSchema = z.object({
  companyName: z.string().min(2, "Company name is required"),
  website: z.string().url("Use a full URL").or(z.literal("")).optional(),
  industry: z.string().min(2, "Industry is required"),
  headquarters: z.string().min(2, "Headquarters is required"),
  roleTitle: z.string().min(2, "Role title is required"),
  interviewStage: z.string().min(2, "Interview stage is required"),
  interviewedAt: z.string().min(1, "Interview date is required"),
  responseDays: z.coerce.number().int().min(0).max(180),
  wasGhosted: z.enum(["true", "false"]),
  candidateSummary: z.string().min(40, "Please share enough detail to help others"),
  processRating: z.coerce.number().int().min(1).max(5)
});

type ReportSchema = z.infer<typeof reportSchema>;

export function ReportForm() {
  const [serverMessage, setServerMessage] = useState<string>("");
  const [isSuccess, setIsSuccess] = useState<boolean>(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<ReportSchema>({
    resolver: zodResolver(reportSchema),
    defaultValues: {
      wasGhosted: "true",
      processRating: 2,
      responseDays: 14
    }
  });

  const onSubmit = async (values: ReportSchema) => {
    setServerMessage("");
    setIsSuccess(false);

    const response = await fetch("/api/reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...values,
        wasGhosted: values.wasGhosted === "true"
      })
    });

    const payload = (await response.json()) as { message?: string; error?: string };

    if (!response.ok) {
      setServerMessage(payload.error ?? "Unable to submit your report.");
      return;
    }

    setIsSuccess(true);
    setServerMessage(payload.message ?? "Report submitted.");
    reset({
      wasGhosted: "true",
      processRating: 2,
      responseDays: 14,
      candidateSummary: ""
    });
  };

  return (
    <Card className="border-[#2d333b] bg-[#161b22]">
      <CardHeader>
        <CardTitle className="text-white">Share your interview experience</CardTitle>
        <CardDescription className="text-[#8b949e]">
          Reports are anonymous. We publish trends and experience details, never personal identity.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Company name" error={errors.companyName?.message}>
              <Input {...register("companyName")} className="border-[#2d333b] bg-[#0d1117]" />
            </Field>
            <Field label="Company website" error={errors.website?.message}>
              <Input {...register("website")} placeholder="https://company.com" className="border-[#2d333b] bg-[#0d1117]" />
            </Field>
            <Field label="Industry" error={errors.industry?.message}>
              <Input {...register("industry")} className="border-[#2d333b] bg-[#0d1117]" />
            </Field>
            <Field label="Headquarters" error={errors.headquarters?.message}>
              <Input {...register("headquarters")} placeholder="City, Country" className="border-[#2d333b] bg-[#0d1117]" />
            </Field>
            <Field label="Role title" error={errors.roleTitle?.message}>
              <Input {...register("roleTitle")} className="border-[#2d333b] bg-[#0d1117]" />
            </Field>
            <Field label="Interview stage" error={errors.interviewStage?.message}>
              <Input {...register("interviewStage")} placeholder="Final Round, Onsite, etc." className="border-[#2d333b] bg-[#0d1117]" />
            </Field>
            <Field label="Interview date" error={errors.interviewedAt?.message}>
              <Input type="date" {...register("interviewedAt")} className="border-[#2d333b] bg-[#0d1117]" />
            </Field>
            <Field label="Days until response" error={errors.responseDays?.message}>
              <Input type="number" min={0} max={180} {...register("responseDays")} className="border-[#2d333b] bg-[#0d1117]" />
            </Field>
            <Field label="Ghosted?" error={errors.wasGhosted?.message}>
              <select {...register("wasGhosted")} className="flex h-10 w-full rounded-md border border-[#2d333b] bg-[#0d1117] px-3 text-sm">
                <option value="true">Yes, no response after interview</option>
                <option value="false">No, they followed up</option>
              </select>
            </Field>
            <Field label="Process rating (1-5)" error={errors.processRating?.message}>
              <Input type="number" min={1} max={5} {...register("processRating")} className="border-[#2d333b] bg-[#0d1117]" />
            </Field>
          </div>

          <Field label="What happened?" error={errors.candidateSummary?.message}>
            <Textarea
              {...register("candidateSummary")}
              rows={5}
              className="border-[#2d333b] bg-[#0d1117]"
              placeholder="Describe communication quality, timelines, and how the process ended."
            />
          </Field>

          <Button type="submit" disabled={isSubmitting} className="bg-[#238636] hover:bg-[#2ea043]">
            {isSubmitting ? "Submitting..." : "Submit Anonymous Report"}
          </Button>

          {serverMessage && (
            <p className={`text-sm ${isSuccess ? "text-[#3fb950]" : "text-[#f85149]"}`}>{serverMessage}</p>
          )}
        </form>
      </CardContent>
    </Card>
  );
}

type FieldProps = {
  label: string;
  error?: string;
  children: ReactNode;
};

function Field({ label, error, children }: FieldProps) {
  return (
    <label className="grid gap-1.5 text-sm">
      <span className="text-[#c9d1d9]">{label}</span>
      {children}
      {error && <span className="text-xs text-[#f85149]">{error}</span>}
    </label>
  );
}
