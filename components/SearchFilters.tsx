"use client";

import { useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search, SlidersHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function SearchFilters({
  industries
}: {
  industries: string[];
}) {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [query, setQuery] = useState(params.get("q") ?? "");
  const [industry, setIndustry] = useState(params.get("industry") ?? "");

  const hasFilters = useMemo(() => query.length > 0 || industry.length > 0, [query, industry]);

  const apply = () => {
    const next = new URLSearchParams();

    if (query.trim()) {
      next.set("q", query.trim());
    }

    if (industry) {
      next.set("industry", industry);
    }

    const queryString = next.toString();
    router.push(queryString ? `${pathname}?${queryString}` : pathname);
  };

  const clear = () => {
    setQuery("");
    setIndustry("");
    router.push(pathname);
  };

  return (
    <section className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 sm:p-5">
      <div className="mb-4 flex items-center gap-2 text-sm text-slate-300">
        <SlidersHorizontal className="h-4 w-4" />
        Search companies by name and sector
      </div>

      <div className="grid gap-3 sm:grid-cols-[1fr_220px_auto_auto]">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Company name"
            className="pl-9"
          />
        </div>

        <select
          value={industry}
          onChange={(event) => setIndustry(event.target.value)}
          className="h-10 rounded-md border border-slate-700 bg-slate-950/80 px-3 text-sm text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/50"
        >
          <option value="">All industries</option>
          {industries.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>

        <Button type="button" onClick={apply}>
          Apply
        </Button>
        <Button type="button" variant="outline" onClick={clear} disabled={!hasFilters}>
          Clear
        </Button>
      </div>
    </section>
  );
}
