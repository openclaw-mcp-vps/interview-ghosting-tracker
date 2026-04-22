import Link from "next/link";

export default function NotFoundPage() {
  return (
    <section className="container-page py-16 text-center">
      <p className="kicker">Not found</p>
      <h1 className="mt-4 text-3xl font-semibold text-slate-100">Company profile not found</h1>
      <p className="mt-3 text-sm text-slate-300">Try searching for another company or submit a new report.</p>
      <div className="mt-6 flex justify-center gap-3">
        <Link href="/search" className="btn-primary">
          Search companies
        </Link>
        <Link href="/submit-report" className="btn-secondary">
          Submit report
        </Link>
      </div>
    </section>
  );
}
