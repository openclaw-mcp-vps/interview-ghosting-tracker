import { Suspense } from "react";
import type { Metadata } from "next";
import { CompanyCard } from "@/components/CompanyCard";
import { SearchFilters } from "@/components/SearchFilters";
import { listCompanies, listIndustries } from "@/lib/database";

export const metadata: Metadata = {
  title: "Search Companies",
  description:
    "Search companies by ghosting rate and candidate-reported interview experience."
};

export const dynamic = "force-dynamic";

type SearchPageProps = {
  searchParams?: Promise<{
    q?: string;
    industry?: string;
  }>;
};

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const query = resolvedSearchParams?.q?.trim() || "";
  const industry = resolvedSearchParams?.industry?.trim() || "";

  let companies = [] as Awaited<ReturnType<typeof listCompanies>>;
  let industries = [] as string[];
  let error = "";

  try {
    [companies, industries] = await Promise.all([
      listCompanies({ query, industry }),
      listIndustries()
    ]);
  } catch {
    error = "Database connection is unavailable. Configure DATABASE_URL to use live data.";
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-50">Company Search</h1>
        <p className="mt-2 max-w-3xl text-slate-300">
          Look up hiring behavior before applying. Use ghosting rate and average wait time to
          prioritize employers that close the loop with candidates.
        </p>
      </div>

      <Suspense>
        <SearchFilters industries={industries} />
      </Suspense>

      {error ? (
        <div className="rounded-lg border border-amber-500/40 bg-amber-950/30 px-4 py-3 text-sm text-amber-200">
          {error}
        </div>
      ) : null}

      {!error && companies.length === 0 ? (
        <div className="rounded-lg border border-slate-800 bg-slate-900/70 px-4 py-8 text-center text-slate-300">
          No companies match your filters yet. Submit a report to add signal for other candidates.
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {companies.map((company) => (
          <CompanyCard key={company.slug} company={company} />
        ))}
      </div>
    </div>
  );
}
