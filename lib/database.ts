import { Pool } from "pg";
import { slugifyCompany } from "@/lib/slugs";

type ReportRow = {
  id: number;
  company_id: number;
  role_title: string;
  interview_stage: string;
  interviewed_at: string;
  response_days: number;
  was_ghosted: boolean;
  candidate_summary: string;
  process_rating: number;
  created_at: string;
};

type CompanyRow = {
  id: number;
  name: string;
  slug: string;
  website: string | null;
  industry: string | null;
  headquarters: string | null;
  created_at: string;
};

type SubscriptionRow = {
  email: string;
  status: string;
  lemonsqueezy_order_id?: string;
};

export type CompanySummary = {
  id: number;
  name: string;
  slug: string;
  website: string | null;
  industry: string | null;
  headquarters: string | null;
  report_count: number;
  ghosted_count: number;
  ghosting_rate: number;
  avg_response_days: number;
  avg_rating: number;
};

export type CompanyDetail = CompanySummary & {
  reports: Array<{
    id: number;
    role_title: string;
    interview_stage: string;
    response_days: number;
    was_ghosted: boolean;
    candidate_summary: string;
    process_rating: number;
    interviewed_at: string;
    created_at: string;
  }>;
};

export type ReportInput = {
  companyName: string;
  website?: string;
  industry?: string;
  headquarters?: string;
  roleTitle: string;
  interviewStage: string;
  interviewedAt: string;
  responseDays: number;
  wasGhosted: boolean;
  candidateSummary: string;
  processRating: number;
};

const seedCompanies: CompanyRow[] = [
  {
    id: 1,
    name: "Northstar Analytics",
    slug: "northstar-analytics",
    website: "https://northstaranalytics.com",
    industry: "B2B SaaS",
    headquarters: "Austin, TX",
    created_at: new Date().toISOString()
  },
  {
    id: 2,
    name: "Beacon Commerce",
    slug: "beacon-commerce",
    website: "https://beaconcommerce.com",
    industry: "E-commerce",
    headquarters: "Seattle, WA",
    created_at: new Date().toISOString()
  },
  {
    id: 3,
    name: "Atlas Health Systems",
    slug: "atlas-health-systems",
    website: "https://atlashealthsystems.com",
    industry: "HealthTech",
    headquarters: "Chicago, IL",
    created_at: new Date().toISOString()
  },
  {
    id: 4,
    name: "Summit Cloud Labs",
    slug: "summit-cloud-labs",
    website: "https://summitcloudlabs.com",
    industry: "Cloud Infrastructure",
    headquarters: "San Francisco, CA",
    created_at: new Date().toISOString()
  }
];

const seedReports: ReportRow[] = [
  {
    id: 1,
    company_id: 1,
    role_title: "Senior Data Analyst",
    interview_stage: "Final Round",
    interviewed_at: new Date(Date.now() - 42 * 86400000).toISOString().slice(0, 10),
    response_days: 21,
    was_ghosted: true,
    candidate_summary:
      "Completed a take-home assignment and final panel. Recruiter promised a decision within one week but stopped replying entirely.",
    process_rating: 2,
    created_at: new Date(Date.now() - 40 * 86400000).toISOString()
  },
  {
    id: 2,
    company_id: 1,
    role_title: "Growth Analyst",
    interview_stage: "Hiring Manager Screen",
    interviewed_at: new Date(Date.now() - 18 * 86400000).toISOString().slice(0, 10),
    response_days: 7,
    was_ghosted: false,
    candidate_summary: "Received a timely rejection with helpful feedback after first-round interview.",
    process_rating: 4,
    created_at: new Date(Date.now() - 16 * 86400000).toISOString()
  },
  {
    id: 3,
    company_id: 2,
    role_title: "Product Marketing Manager",
    interview_stage: "Onsite",
    interviewed_at: new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10),
    response_days: 16,
    was_ghosted: true,
    candidate_summary:
      "Five interview loop ended with silence despite two follow-ups. No closure message was ever sent.",
    process_rating: 1,
    created_at: new Date(Date.now() - 28 * 86400000).toISOString()
  },
  {
    id: 4,
    company_id: 3,
    role_title: "UX Researcher",
    interview_stage: "Technical Interview",
    interviewed_at: new Date(Date.now() - 25 * 86400000).toISOString().slice(0, 10),
    response_days: 5,
    was_ghosted: false,
    candidate_summary: "Process was organized and recruiter gave regular updates after each stage.",
    process_rating: 5,
    created_at: new Date(Date.now() - 24 * 86400000).toISOString()
  },
  {
    id: 5,
    company_id: 4,
    role_title: "Staff Backend Engineer",
    interview_stage: "Final Round",
    interviewed_at: new Date(Date.now() - 35 * 86400000).toISOString().slice(0, 10),
    response_days: 12,
    was_ghosted: true,
    candidate_summary:
      "Met with VP and team. Position was later closed but no candidate communication happened.",
    process_rating: 2,
    created_at: new Date(Date.now() - 34 * 86400000).toISOString()
  }
];

const memory = {
  companies: [...seedCompanies],
  reports: [...seedReports],
  subscriptions: new Map<string, SubscriptionRow>()
};

const globalForPg = globalThis as unknown as {
  pool: Pool | undefined;
  initialized: Promise<void> | undefined;
};

function getPool(): Pool | null {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) return null;

  if (!globalForPg.pool) {
    globalForPg.pool = new Pool({
      connectionString,
      ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false
    });
  }

  return globalForPg.pool;
}

function round(value: number): number {
  return Math.round(value * 10) / 10;
}

function buildCompanySummary(company: CompanyRow, reports: ReportRow[]): CompanySummary {
  const reportCount = reports.length;
  const ghostedCount = reports.filter((r) => r.was_ghosted).length;
  const ghostingRate = reportCount ? round((ghostedCount / reportCount) * 100) : 0;
  const avgResponseDays = reportCount ? round(reports.reduce((sum, r) => sum + r.response_days, 0) / reportCount) : 0;
  const avgRating = reportCount ? round(reports.reduce((sum, r) => sum + r.process_rating, 0) / reportCount) : 0;

  return {
    id: company.id,
    name: company.name,
    slug: company.slug,
    website: company.website,
    industry: company.industry,
    headquarters: company.headquarters,
    report_count: reportCount,
    ghosted_count: ghostedCount,
    ghosting_rate: ghostingRate,
    avg_response_days: avgResponseDays,
    avg_rating: avgRating
  };
}

function listCompaniesFromMemory(search?: {
  query?: string;
  industry?: string;
  minGhostingRate?: number;
  limit?: number;
}): CompanySummary[] {
  const query = search?.query?.trim().toLowerCase() ?? "";
  const industryFilter = search?.industry?.trim().toLowerCase() ?? "";

  const rows = memory.companies
    .filter((company) => {
      if (query && !company.name.toLowerCase().includes(query) && !company.slug.toLowerCase().includes(query)) {
        return false;
      }
      if (industryFilter && !(company.industry ?? "").toLowerCase().includes(industryFilter)) {
        return false;
      }
      return true;
    })
    .map((company) => buildCompanySummary(company, memory.reports.filter((report) => report.company_id === company.id)))
    .filter((summary) =>
      typeof search?.minGhostingRate === "number" ? summary.ghosting_rate >= search.minGhostingRate : true
    )
    .sort((a, b) => b.ghosting_rate - a.ghosting_rate || b.report_count - a.report_count || a.name.localeCompare(b.name));

  return rows.slice(0, search?.limit ?? 30);
}

export async function initDatabase(): Promise<void> {
  const pool = getPool();
  if (!pool) {
    return;
  }

  if (!globalForPg.initialized) {
    globalForPg.initialized = (async () => {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS companies (
          id BIGSERIAL PRIMARY KEY,
          name TEXT NOT NULL UNIQUE,
          slug TEXT NOT NULL UNIQUE,
          website TEXT,
          industry TEXT,
          headquarters TEXT,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
      `);

      await pool.query(`
        CREATE TABLE IF NOT EXISTS reports (
          id BIGSERIAL PRIMARY KEY,
          company_id BIGINT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
          role_title TEXT NOT NULL,
          interview_stage TEXT NOT NULL,
          interviewed_at DATE NOT NULL,
          response_days INT NOT NULL CHECK (response_days >= 0),
          was_ghosted BOOLEAN NOT NULL,
          candidate_summary TEXT NOT NULL,
          process_rating INT NOT NULL CHECK (process_rating BETWEEN 1 AND 5),
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
      `);

      await pool.query(`
        CREATE TABLE IF NOT EXISTS subscriptions (
          id BIGSERIAL PRIMARY KEY,
          email TEXT NOT NULL UNIQUE,
          status TEXT NOT NULL,
          lemonsqueezy_order_id TEXT,
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
      `);

      const { rows } = await pool.query<{ count: string }>("SELECT COUNT(*)::text AS count FROM companies");
      if (rows[0]?.count === "0") {
        await pool.query(`
          INSERT INTO companies (name, slug, website, industry, headquarters)
          VALUES
            ('Northstar Analytics', 'northstar-analytics', 'https://northstaranalytics.com', 'B2B SaaS', 'Austin, TX'),
            ('Beacon Commerce', 'beacon-commerce', 'https://beaconcommerce.com', 'E-commerce', 'Seattle, WA'),
            ('Atlas Health Systems', 'atlas-health-systems', 'https://atlashealthsystems.com', 'HealthTech', 'Chicago, IL'),
            ('Summit Cloud Labs', 'summit-cloud-labs', 'https://summitcloudlabs.com', 'Cloud Infrastructure', 'San Francisco, CA');
        `);

        await pool.query(`
          INSERT INTO reports (company_id, role_title, interview_stage, interviewed_at, response_days, was_ghosted, candidate_summary, process_rating)
          VALUES
            (1, 'Senior Data Analyst', 'Final Round', CURRENT_DATE - INTERVAL '42 days', 21, true, 'Completed a take-home assignment and final panel. Recruiter promised a decision within one week but stopped replying entirely.', 2),
            (1, 'Growth Analyst', 'Hiring Manager Screen', CURRENT_DATE - INTERVAL '18 days', 7, false, 'Received a timely rejection with helpful feedback after first-round interview.', 4),
            (2, 'Product Marketing Manager', 'Onsite', CURRENT_DATE - INTERVAL '30 days', 16, true, 'Five interview loop ended with silence despite two follow-ups. No closure message was ever sent.', 1),
            (3, 'UX Researcher', 'Technical Interview', CURRENT_DATE - INTERVAL '25 days', 5, false, 'Process was organized and recruiter gave regular updates after each stage.', 5),
            (4, 'Staff Backend Engineer', 'Final Round', CURRENT_DATE - INTERVAL '35 days', 12, true, 'Met with VP and team. Position was later closed but no candidate communication happened.', 2);
        `);
      }
    })();
  }

  await globalForPg.initialized;
}

async function ensureCompany(input: ReportInput): Promise<number> {
  const slug = slugifyCompany(input.companyName);
  const pool = getPool();

  if (!pool) {
    const existing = memory.companies.find((company) => company.slug === slug);
    if (existing) {
      existing.website = input.website?.trim() || existing.website;
      existing.industry = input.industry?.trim() || existing.industry;
      existing.headquarters = input.headquarters?.trim() || existing.headquarters;
      return existing.id;
    }

    const nextId = memory.companies.reduce((max, company) => Math.max(max, company.id), 0) + 1;
    memory.companies.push({
      id: nextId,
      name: input.companyName,
      slug,
      website: input.website?.trim() || null,
      industry: input.industry?.trim() || null,
      headquarters: input.headquarters?.trim() || null,
      created_at: new Date().toISOString()
    });

    return nextId;
  }

  const result = await pool.query<{ id: string }>(
    `
      INSERT INTO companies (name, slug, website, industry, headquarters)
      VALUES ($1, $2, NULLIF($3, ''), NULLIF($4, ''), NULLIF($5, ''))
      ON CONFLICT (slug)
      DO UPDATE SET
        website = COALESCE(NULLIF(EXCLUDED.website, ''), companies.website),
        industry = COALESCE(NULLIF(EXCLUDED.industry, ''), companies.industry),
        headquarters = COALESCE(NULLIF(EXCLUDED.headquarters, ''), companies.headquarters)
      RETURNING id;
    `,
    [input.companyName, slug, input.website ?? "", input.industry ?? "", input.headquarters ?? ""]
  );

  return Number(result.rows[0].id);
}

export async function createReport(input: ReportInput): Promise<void> {
  await initDatabase();

  const pool = getPool();
  const companyId = await ensureCompany(input);

  if (!pool) {
    const nextId = memory.reports.reduce((max, report) => Math.max(max, report.id), 0) + 1;
    memory.reports.push({
      id: nextId,
      company_id: companyId,
      role_title: input.roleTitle,
      interview_stage: input.interviewStage,
      interviewed_at: input.interviewedAt,
      response_days: input.responseDays,
      was_ghosted: input.wasGhosted,
      candidate_summary: input.candidateSummary,
      process_rating: input.processRating,
      created_at: new Date().toISOString()
    });
    return;
  }

  await pool.query(
    `
      INSERT INTO reports (
        company_id,
        role_title,
        interview_stage,
        interviewed_at,
        response_days,
        was_ghosted,
        candidate_summary,
        process_rating
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
    `,
    [
      companyId,
      input.roleTitle,
      input.interviewStage,
      input.interviewedAt,
      input.responseDays,
      input.wasGhosted,
      input.candidateSummary,
      input.processRating
    ]
  );
}

export async function listCompanies(search?: {
  query?: string;
  industry?: string;
  minGhostingRate?: number;
  limit?: number;
}): Promise<CompanySummary[]> {
  await initDatabase();

  const pool = getPool();
  if (!pool) {
    return listCompaniesFromMemory(search);
  }

  const limit = search?.limit ?? 30;
  const queryText = `
    SELECT
      c.id,
      c.name,
      c.slug,
      c.website,
      c.industry,
      c.headquarters,
      COUNT(r.id)::int AS report_count,
      COUNT(*) FILTER (WHERE r.was_ghosted)::int AS ghosted_count,
      ROUND((COUNT(*) FILTER (WHERE r.was_ghosted)::numeric / NULLIF(COUNT(r.id), 0)) * 100, 1) AS ghosting_rate,
      ROUND(AVG(r.response_days)::numeric, 1) AS avg_response_days,
      ROUND(AVG(r.process_rating)::numeric, 1) AS avg_rating
    FROM companies c
    LEFT JOIN reports r ON r.company_id = c.id
    WHERE ($1::text IS NULL OR c.name ILIKE '%' || $1 || '%' OR c.slug ILIKE '%' || $1 || '%')
      AND ($2::text IS NULL OR c.industry ILIKE '%' || $2 || '%')
    GROUP BY c.id
    HAVING ($3::numeric IS NULL OR ROUND((COUNT(*) FILTER (WHERE r.was_ghosted)::numeric / NULLIF(COUNT(r.id), 0)) * 100, 1) >= $3)
    ORDER BY ghosting_rate DESC NULLS LAST, report_count DESC, c.name ASC
    LIMIT $4;
  `;

  const { rows } = await pool.query<CompanySummary>(queryText, [
    search?.query ?? null,
    search?.industry ?? null,
    search?.minGhostingRate ?? null,
    limit
  ]);

  return rows.map((row) => ({
    ...row,
    ghosting_rate: Number(row.ghosting_rate ?? 0),
    avg_response_days: Number(row.avg_response_days ?? 0),
    avg_rating: Number(row.avg_rating ?? 0)
  }));
}

export async function getCompanyBySlug(slug: string): Promise<CompanyDetail | null> {
  await initDatabase();

  const pool = getPool();
  if (!pool) {
    const company = memory.companies.find((item) => item.slug === slug);
    if (!company) return null;

    const reports = memory.reports
      .filter((report) => report.company_id === company.id)
      .sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at));

    return {
      ...buildCompanySummary(company, reports),
      reports
    };
  }

  const summaryRes = await pool.query<CompanySummary>(
    `
      SELECT
        c.id,
        c.name,
        c.slug,
        c.website,
        c.industry,
        c.headquarters,
        COUNT(r.id)::int AS report_count,
        COUNT(*) FILTER (WHERE r.was_ghosted)::int AS ghosted_count,
        ROUND((COUNT(*) FILTER (WHERE r.was_ghosted)::numeric / NULLIF(COUNT(r.id), 0)) * 100, 1) AS ghosting_rate,
        ROUND(AVG(r.response_days)::numeric, 1) AS avg_response_days,
        ROUND(AVG(r.process_rating)::numeric, 1) AS avg_rating
      FROM companies c
      LEFT JOIN reports r ON r.company_id = c.id
      WHERE c.slug = $1
      GROUP BY c.id
      LIMIT 1;
    `,
    [slug]
  );

  const summary = summaryRes.rows[0];
  if (!summary) return null;

  const reportsRes = await pool.query<CompanyDetail["reports"][number]>(
    `
      SELECT
        id,
        role_title,
        interview_stage,
        response_days,
        was_ghosted,
        candidate_summary,
        process_rating,
        interviewed_at::text,
        created_at::text
      FROM reports
      WHERE company_id = $1
      ORDER BY created_at DESC
      LIMIT 100;
    `,
    [summary.id]
  );

  return {
    ...summary,
    ghosting_rate: Number(summary.ghosting_rate ?? 0),
    avg_response_days: Number(summary.avg_response_days ?? 0),
    avg_rating: Number(summary.avg_rating ?? 0),
    reports: reportsRes.rows
  };
}

export async function getDashboardSnapshot() {
  await initDatabase();

  const pool = getPool();
  if (!pool) {
    const companies = listCompaniesFromMemory({ limit: 10 });
    const latestReports = memory.reports
      .slice()
      .sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at))
      .slice(0, 15)
      .map((report) => {
        const company = memory.companies.find((item) => item.id === report.company_id);
        return {
          company_name: company?.name ?? "Unknown company",
          company_slug: company?.slug ?? "unknown-company",
          role_title: report.role_title,
          interview_stage: report.interview_stage,
          was_ghosted: report.was_ghosted,
          response_days: report.response_days,
          created_at: report.created_at
        };
      });

    return { companies, latestReports };
  }

  const [companies, latestReports] = await Promise.all([
    listCompanies({ limit: 10 }),
    pool.query<{
      company_name: string;
      company_slug: string;
      role_title: string;
      interview_stage: string;
      was_ghosted: boolean;
      response_days: number;
      created_at: string;
    }>(
      `
        SELECT
          c.name AS company_name,
          c.slug AS company_slug,
          r.role_title,
          r.interview_stage,
          r.was_ghosted,
          r.response_days,
          r.created_at::text
        FROM reports r
        JOIN companies c ON c.id = r.company_id
        ORDER BY r.created_at DESC
        LIMIT 15;
      `
    )
  ]);

  return {
    companies,
    latestReports: latestReports.rows
  };
}

export async function upsertSubscription(email: string, status: string, orderId?: string): Promise<void> {
  await initDatabase();

  const normalized = email.trim().toLowerCase();
  const pool = getPool();

  if (!pool) {
    memory.subscriptions.set(normalized, {
      email: normalized,
      status,
      lemonsqueezy_order_id: orderId
    });
    return;
  }

  await pool.query(
    `
      INSERT INTO subscriptions (email, status, lemonsqueezy_order_id)
      VALUES (LOWER($1), $2, $3)
      ON CONFLICT (email)
      DO UPDATE SET
        status = EXCLUDED.status,
        lemonsqueezy_order_id = COALESCE(EXCLUDED.lemonsqueezy_order_id, subscriptions.lemonsqueezy_order_id),
        updated_at = NOW();
    `,
    [normalized, status, orderId ?? null]
  );
}

export async function hasActiveSubscription(email: string): Promise<boolean> {
  await initDatabase();

  const normalized = email.trim().toLowerCase();
  const pool = getPool();

  if (!pool) {
    return memory.subscriptions.get(normalized)?.status === "active";
  }

  const { rows } = await pool.query<{ status: string }>(
    `SELECT status FROM subscriptions WHERE email = LOWER($1) LIMIT 1`,
    [normalized]
  );

  return rows[0]?.status === "active";
}
