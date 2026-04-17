import type { Metadata } from "next";
import { cookies } from "next/headers";
import { CompanyCard } from "@/components/CompanyCard";
import { SearchFilters } from "@/components/SearchFilters";
import { LemonCheckoutButton } from "@/components/LemonCheckoutButton";
import { hasPaidAccess } from "@/lib/access";
import { listCompanies } from "@/lib/database";
import { getCheckoutUrl } from "@/lib/lemonsqueezy";

export const metadata: Metadata = {
  title: "Search Company Ghosting Rates",
  description: "Search company interview ghosting rates and candidate-reported hiring outcomes before applying."
};

type SearchPageProps = {
  searchParams: Promise<{
    q?: string;
    industry?: string;
    minGhosting?: string;
  }>;
};

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const isMember = hasPaidAccess(await cookies());
  const minGhosting = Number(params.minGhosting);

  const companies = await listCompanies({
    query: params.q,
    industry: isMember ? params.industry : undefined,
    minGhostingRate: isMember && Number.isFinite(minGhosting) ? minGhosting : undefined,
    limit: isMember ? 60 : 8
  });

  return (
    <main className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="text-3xl font-bold text-white">Company Ghosting Search</h1>
      <p className="mt-2 text-[#8b949e]">
        Search interview ghosting patterns before committing your time. Members unlock deep filtering and full result sets.
      </p>

      <div className="mt-6">
        <SearchFilters locked={!isMember} />
      </div>

      {!isMember && (
        <div className="mt-6 rounded-xl border border-[#2d333b] bg-[#161b22] p-4 text-sm text-[#c9d1d9]">
          <p>Showing public preview data. Upgrade to unlock complete company rankings, role-level patterns, and risk alerts.</p>
          <LemonCheckoutButton
            checkoutUrl={getCheckoutUrl()}
            className="mt-3 inline-flex rounded-md bg-[#238636] px-4 py-2 font-medium text-white hover:bg-[#2ea043]"
          >
            Unlock full search for $8/month
          </LemonCheckoutButton>
        </div>
      )}

      <div className="mt-6 grid gap-4">
        {companies.length === 0 ? (
          <p className="rounded-lg border border-[#2d333b] bg-[#161b22] p-6 text-[#8b949e]">
            No matching companies yet. Try broadening your search or submit the first report.
          </p>
        ) : (
          companies.map((company) => (
            <CompanyCard key={company.id} company={company} showLockedDetails={!isMember} />
          ))
        )}
      </div>
    </main>
  );
}
