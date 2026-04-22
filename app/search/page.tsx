import type { Metadata } from "next";
import { CompanyCard } from "@/components/CompanyCard";
import { SearchFilters } from "@/components/SearchFilters";
import { getCompanySummaries, isDatabaseConfigured, type SortMode } from "@/lib/database";

export const metadata: Metadata = {
  title: "Search Company Ghosting Rates",
  description:
    "Search companies by name, interview stage, and report volume to see which hiring processes are most likely to ghost candidates."
};

export const dynamic = "force-dynamic";

type SearchPageProps = {
  searchParams: Promise<{
    q?: string;
    stage?: string;
    minReports?: string;
    sort?: string;
  }>;
};

const sortModes: SortMode[] = ["ghosting_rate", "reports", "recent", "name"];

function toSortMode(value: string | undefined): SortMode {
  if (value && sortModes.includes(value as SortMode)) {
    return value as SortMode;
  }

  return "ghosting_rate";
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;

  const query = params.q?.trim() || "";
  const stage = params.stage?.trim() || "";
  const minReports = Math.max(0, Number(params.minReports || "0") || 0);
  const sort = toSortMode(params.sort);

  const companies = await getCompanySummaries({
    query,
    stage,
    minReports,
    sort,
    limit: 80
  });

  return (
    <section className="container-page py-10 sm:py-14">
      <div className="mb-6">
        <h1 className="text-3xl font-semibold text-slate-100 sm:text-4xl">Search hiring behavior by company</h1>
        <p className="mt-2 max-w-3xl text-sm text-slate-300 sm:text-base">
          Filter by stage and report count to find companies with consistent follow-through and avoid ghost-heavy
          interview loops.
        </p>
      </div>

      <SearchFilters query={query} stage={stage} minReports={minReports} sort={sort} />

      {!isDatabaseConfigured() ? (
        <div className="panel mt-6 rounded-xl p-5 text-sm text-slate-300">
          DATABASE_URL is not configured yet, so search results are unavailable. Add DATABASE_URL and submit reports to
          populate company profiles.
        </div>
      ) : null}

      <div className="mt-6 flex items-center justify-between text-sm text-slate-400">
        <p>
          Showing <span className="font-semibold text-slate-200">{companies.length}</span> companies
        </p>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        {companies.map((company) => (
          <CompanyCard key={company.id} company={company} />
        ))}
      </div>

      {isDatabaseConfigured() && companies.length === 0 ? (
        <div className="panel mt-4 rounded-xl p-5 text-sm text-slate-300">
          No companies match these filters yet. Try broadening your search or submit the first report.
        </div>
      ) : null}
    </section>
  );
}
