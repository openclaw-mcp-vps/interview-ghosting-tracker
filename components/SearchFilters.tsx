type SearchFiltersProps = {
  query?: string;
  stage?: string;
  minReports?: number;
  sort?: string;
};

const stageOptions = [
  { value: "", label: "All stages" },
  { value: "recruiter_screen", label: "Recruiter screen" },
  { value: "hiring_manager", label: "Hiring manager" },
  { value: "take_home", label: "Take-home assignment" },
  { value: "technical", label: "Technical interview" },
  { value: "onsite", label: "Onsite or panel" },
  { value: "final", label: "Final round" }
];

const sortOptions = [
  { value: "ghosting_rate", label: "Highest ghosting rate" },
  { value: "reports", label: "Most reports" },
  { value: "recent", label: "Most recently reported" },
  { value: "name", label: "Company name" }
];

export function SearchFilters({
  query = "",
  stage = "",
  minReports = 0,
  sort = "ghosting_rate"
}: SearchFiltersProps) {
  return (
    <form action="/search" method="GET" className="panel grid gap-3 rounded-xl p-4 md:grid-cols-4 md:items-end">
      <label className="text-sm text-slate-300">
        Company
        <input className="input mt-1" name="q" defaultValue={query} placeholder="Google, HubSpot, Stripe..." />
      </label>

      <label className="text-sm text-slate-300">
        Stage
        <select className="input mt-1" name="stage" defaultValue={stage}>
          {stageOptions.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>
      </label>

      <label className="text-sm text-slate-300">
        Minimum reports
        <input className="input mt-1" name="minReports" type="number" min={0} max={1000} defaultValue={minReports} />
      </label>

      <div className="flex flex-col gap-2 md:flex-row md:items-end">
        <label className="w-full text-sm text-slate-300">
          Sort by
          <select className="input mt-1" name="sort" defaultValue={sort}>
            {sortOptions.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
        <button type="submit" className="btn-primary w-full md:w-auto">
          Apply
        </button>
      </div>
    </form>
  );
}
