"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { FormEvent } from "react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type SearchFiltersProps = {
  locked?: boolean;
};

export function SearchFilters({ locked = false }: SearchFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [industry, setIndustry] = useState(searchParams.get("industry") ?? "");
  const [minGhosting, setMinGhosting] = useState(searchParams.get("minGhosting") ?? "");

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    const params = new URLSearchParams(searchParams.toString());

    if (query) params.set("q", query);
    else params.delete("q");

    if (!locked && industry) params.set("industry", industry);
    else params.delete("industry");

    if (!locked && minGhosting) params.set("minGhosting", minGhosting);
    else params.delete("minGhosting");

    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <form onSubmit={onSubmit} className="space-y-3 rounded-xl border border-[#2d333b] bg-[#161b22] p-4">
      <p className="text-sm font-medium text-white">Search companies</p>
      <div className="grid gap-3 md:grid-cols-3">
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Company name"
          className="border-[#2d333b] bg-[#0d1117]"
        />
        <Input
          value={industry}
          onChange={(event) => setIndustry(event.target.value)}
          placeholder={locked ? "Industry filter (members)" : "Industry"}
          disabled={locked}
          className="border-[#2d333b] bg-[#0d1117]"
        />
        <Input
          type="number"
          min={0}
          max={100}
          value={minGhosting}
          onChange={(event) => setMinGhosting(event.target.value)}
          placeholder={locked ? "Min ghosting % (members)" : "Min ghosting %"}
          disabled={locked}
          className="border-[#2d333b] bg-[#0d1117]"
        />
      </div>
      <div className="flex items-center justify-between">
        <p className="text-xs text-[#8b949e]">
          {locked
            ? "Advanced filters are part of the $8/month membership."
            : "Filter by industry and ghosting threshold to avoid high-risk pipelines."}
        </p>
        <Button type="submit" className="bg-[#238636] hover:bg-[#2ea043]">
          Apply Filters
        </Button>
      </div>
    </form>
  );
}
