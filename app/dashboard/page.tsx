import { cookies } from "next/headers";
import Link from "next/link";
import { LemonCheckoutButton } from "@/components/LemonCheckoutButton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ACCESS_COOKIE, hasPaidAccess } from "@/lib/access";
import { getDashboardSnapshot } from "@/lib/database";
import { getCheckoutUrl } from "@/lib/lemonsqueezy";

type DashboardPageProps = {
  searchParams: Promise<{ unlock?: string }>;
};

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const cookieStore = await cookies();
  const isMember = hasPaidAccess(cookieStore);
  const params = await searchParams;

  if (!isMember) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-12">
        <Card className="border-[#2d333b] bg-[#161b22]">
          <CardHeader>
            <CardTitle className="text-white">Member dashboard is locked</CardTitle>
            <CardDescription className="text-[#8b949e]">
              Purchase the $8/month membership, then unlock this browser with your purchase email.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {params.unlock === "not-found" && (
              <p className="rounded-md border border-[#f85149]/40 bg-[#f85149]/10 p-3 text-sm text-[#f85149]">
                We could not find an active subscription for that email yet. Wait for webhook confirmation, then retry.
              </p>
            )}
            {params.unlock === "success" && (
              <p className="rounded-md border border-[#3fb950]/40 bg-[#3fb950]/10 p-3 text-sm text-[#3fb950]">
                Browser unlocked successfully. Reload if this page does not update immediately.
              </p>
            )}

            <LemonCheckoutButton
              checkoutUrl={getCheckoutUrl()}
              className="inline-flex rounded-md bg-[#238636] px-4 py-2 text-sm font-medium text-white hover:bg-[#2ea043]"
            >
              Buy membership
            </LemonCheckoutButton>

            <form action="/api/access" method="post" className="space-y-3 rounded-lg border border-[#2d333b] bg-[#0d1117] p-4">
              <p className="text-sm text-[#c9d1d9]">Already purchased? Enter your checkout email:</p>
              <input
                type="email"
                name="email"
                required
                placeholder="you@company.com"
                className="h-10 w-full rounded-md border border-[#2d333b] bg-[#161b22] px-3 text-sm"
              />
              <Button type="submit" className="bg-[#1f6feb] hover:bg-[#388bfd]">
                Unlock this browser
              </Button>
            </form>

            <p className="text-xs text-[#8b949e]">Access is stored in the `{ACCESS_COOKIE}` cookie after verification.</p>
          </CardContent>
        </Card>
      </main>
    );
  }

  const snapshot = await getDashboardSnapshot();

  return (
    <main className="mx-auto max-w-6xl px-4 py-12">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white">Member Dashboard</h1>
        <Link href="/report" className="rounded-md border border-[#2d333b] bg-[#161b22] px-3 py-2 text-sm text-[#c9d1d9] hover:text-white">
          Submit new report
        </Link>
      </div>

      <section className="mt-6 rounded-xl border border-[#2d333b] bg-[#161b22] p-6">
        <h2 className="text-xl font-semibold text-white">Highest ghosting risk companies</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[620px] text-left text-sm">
            <thead className="text-[#8b949e]">
              <tr>
                <th className="pb-2">Company</th>
                <th className="pb-2">Ghosting rate</th>
                <th className="pb-2">Reports</th>
                <th className="pb-2">Avg response days</th>
                <th className="pb-2">Avg rating</th>
              </tr>
            </thead>
            <tbody>
              {snapshot.companies.map((company) => (
                <tr key={company.id} className="border-t border-[#2d333b] text-[#c9d1d9]">
                  <td className="py-3">
                    <Link className="hover:text-[#58a6ff]" href={`/companies/${company.slug}`}>
                      {company.name}
                    </Link>
                  </td>
                  <td className="py-3">{company.ghosting_rate}%</td>
                  <td className="py-3">{company.report_count}</td>
                  <td className="py-3">{company.avg_response_days || "-"}</td>
                  <td className="py-3">{company.avg_rating || "-"}/5</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-6 rounded-xl border border-[#2d333b] bg-[#161b22] p-6">
        <h2 className="text-xl font-semibold text-white">Latest interview outcomes</h2>
        <ul className="mt-4 space-y-3">
          {snapshot.latestReports.map((report, index) => (
            <li key={`${report.company_slug}-${index}`} className="rounded-md border border-[#2d333b] bg-[#0d1117] p-3 text-sm text-[#c9d1d9]">
              <Link className="font-medium text-[#58a6ff] hover:text-white" href={`/companies/${report.company_slug}`}>
                {report.company_name}
              </Link>{" "}
              • {report.role_title} ({report.interview_stage}) • {report.response_days} days • {report.was_ghosted ? "Ghosted" : "Responded"}
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
