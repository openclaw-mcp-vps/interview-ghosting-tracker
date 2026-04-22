import { createHash, randomBytes } from "node:crypto";
import { Pool } from "pg";
import { slugifyCompanyName } from "@/lib/utils";

const ACCESS_COOKIE_DAYS = 30;

type GlobalDbState = {
  pool?: Pool;
  initPromise?: Promise<void>;
};

type CompanyStatsRow = {
  slug: string;
  name: string;
  website: string | null;
  industry: string | null;
  headquarters: string | null;
  total_reports: number;
  ghosting_rate: number;
  avg_days_waited: number;
  last_reported_at: string | null;
};

type ReportRow = {
  id: number;
  role_title: string;
  candidate_seniority: string;
  interview_stage: string;
  interview_date: string;
  days_waited: number;
  follow_up_count: number;
  outcome: "ghosted" | "replied" | "rejected" | "offer";
  narrative: string;
  created_at: string;
};

type StageBreakdownRow = {
  interview_stage: string;
  report_count: number;
  ghosted_count: number;
};

export type CompanySummary = {
  slug: string;
  name: string;
  website: string | null;
  industry: string | null;
  headquarters: string | null;
  totalReports: number;
  ghostingRate: number;
  avgDaysWaited: number;
  lastReportedAt: string | null;
};

export type CompanyDetail = CompanySummary & {
  stageBreakdown: Array<{
    stage: string;
    reportCount: number;
    ghostedCount: number;
    ghostingRate: number;
  }>;
  reports: Array<{
    id: number;
    roleTitle: string;
    candidateSeniority: string;
    interviewStage: string;
    interviewDate: string;
    daysWaited: number;
    followUpCount: number;
    outcome: "ghosted" | "replied" | "rejected" | "offer";
    narrative: string;
    createdAt: string;
  }>;
};

export type DashboardData = {
  totals: {
    companiesTracked: number;
    reportsLogged: number;
    overallGhostingRate: number;
    averageDaysWaiting: number;
  };
  highestRiskCompanies: CompanySummary[];
  fastestResponders: CompanySummary[];
};

const globalDbState = globalThis as unknown as GlobalDbState;

function getPool() {
  if (!globalDbState.pool) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error("DATABASE_URL is required to use the tracker database.");
    }

    globalDbState.pool = new Pool({
      connectionString,
      ssl:
        process.env.NODE_ENV === "production"
          ? { rejectUnauthorized: false }
          : false
    });
  }

  return globalDbState.pool;
}

export async function ensureDatabase() {
  if (!globalDbState.initPromise) {
    globalDbState.initPromise = initDatabase();
  }

  await globalDbState.initPromise;
}

async function initDatabase() {
  const pool = getPool();
  await pool.query(`
    CREATE TABLE IF NOT EXISTS companies (
      id BIGSERIAL PRIMARY KEY,
      slug TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      website TEXT,
      industry TEXT,
      headquarters TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS reports (
      id BIGSERIAL PRIMARY KEY,
      company_id BIGINT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
      role_title TEXT NOT NULL,
      candidate_seniority TEXT NOT NULL,
      interview_stage TEXT NOT NULL,
      interview_date DATE NOT NULL,
      days_waited INTEGER NOT NULL CHECK (days_waited >= 0),
      follow_up_count INTEGER NOT NULL DEFAULT 0,
      outcome TEXT NOT NULL CHECK (outcome IN ('ghosted','replied','rejected','offer')),
      narrative TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_reports_company_id ON reports(company_id);
    CREATE INDEX IF NOT EXISTS idx_reports_created_at ON reports(created_at DESC);

    CREATE TABLE IF NOT EXISTS subscriptions (
      id BIGSERIAL PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      status TEXT NOT NULL,
      stripe_customer_id TEXT,
      stripe_subscription_id TEXT,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_subscriptions_customer ON subscriptions(stripe_customer_id);

    CREATE TABLE IF NOT EXISTS access_sessions (
      id BIGSERIAL PRIMARY KEY,
      email TEXT NOT NULL,
      token_hash TEXT NOT NULL UNIQUE,
      expires_at TIMESTAMPTZ NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_access_sessions_expires ON access_sessions(expires_at);
  `);
}

function mapCompanyStats(row: CompanyStatsRow): CompanySummary {
  return {
    slug: row.slug,
    name: row.name,
    website: row.website,
    industry: row.industry,
    headquarters: row.headquarters,
    totalReports: Number(row.total_reports),
    ghostingRate: Number(row.ghosting_rate),
    avgDaysWaited: Number(row.avg_days_waited),
    lastReportedAt: row.last_reported_at
  };
}

export async function listIndustries() {
  await ensureDatabase();
  const pool = getPool();
  const result = await pool.query<{ industry: string }>(`
    SELECT DISTINCT industry
    FROM companies
    WHERE industry IS NOT NULL AND industry <> ''
    ORDER BY industry ASC;
  `);

  return result.rows.map((row) => row.industry);
}

export async function listCompanies(options?: {
  query?: string;
  industry?: string;
  limit?: number;
  offset?: number;
}) {
  await ensureDatabase();
  const pool = getPool();

  const query = options?.query?.trim() || null;
  const industry = options?.industry?.trim() || null;
  const limit = options?.limit ?? 24;
  const offset = options?.offset ?? 0;

  const result = await pool.query<CompanyStatsRow>(
    `
      SELECT
        c.slug,
        c.name,
        c.website,
        c.industry,
        c.headquarters,
        COUNT(r.id)::INT AS total_reports,
        COALESCE(ROUND((AVG((CASE WHEN r.outcome = 'ghosted' THEN 1 ELSE 0 END))::NUMERIC) * 100, 1), 0)::FLOAT8 AS ghosting_rate,
        COALESCE(ROUND(AVG(r.days_waited)::NUMERIC, 1), 0)::FLOAT8 AS avg_days_waited,
        MAX(r.created_at)::TEXT AS last_reported_at
      FROM companies c
      LEFT JOIN reports r ON r.company_id = c.id
      WHERE ($1::TEXT IS NULL OR c.name ILIKE ('%' || $1 || '%'))
        AND ($2::TEXT IS NULL OR c.industry = $2)
      GROUP BY c.id
      HAVING COUNT(r.id) > 0
      ORDER BY ghosting_rate DESC, total_reports DESC, c.name ASC
      LIMIT $3 OFFSET $4;
    `,
    [query, industry, limit, offset]
  );

  return result.rows.map(mapCompanyStats);
}

export async function getCompanyBySlug(slug: string) {
  await ensureDatabase();
  const pool = getPool();

  const companyResult = await pool.query<CompanyStatsRow>(
    `
      SELECT
        c.slug,
        c.name,
        c.website,
        c.industry,
        c.headquarters,
        COUNT(r.id)::INT AS total_reports,
        COALESCE(ROUND((AVG((CASE WHEN r.outcome = 'ghosted' THEN 1 ELSE 0 END))::NUMERIC) * 100, 1), 0)::FLOAT8 AS ghosting_rate,
        COALESCE(ROUND(AVG(r.days_waited)::NUMERIC, 1), 0)::FLOAT8 AS avg_days_waited,
        MAX(r.created_at)::TEXT AS last_reported_at
      FROM companies c
      LEFT JOIN reports r ON r.company_id = c.id
      WHERE c.slug = $1
      GROUP BY c.id
      LIMIT 1;
    `,
    [slug]
  );

  if (companyResult.rows.length === 0) {
    return null;
  }

  const stageResult = await pool.query<StageBreakdownRow>(
    `
      SELECT
        interview_stage,
        COUNT(*)::INT AS report_count,
        COUNT(*) FILTER (WHERE outcome = 'ghosted')::INT AS ghosted_count
      FROM reports
      WHERE company_id = (SELECT id FROM companies WHERE slug = $1)
      GROUP BY interview_stage
      ORDER BY report_count DESC;
    `,
    [slug]
  );

  const reportsResult = await pool.query<ReportRow>(
    `
      SELECT
        id,
        role_title,
        candidate_seniority,
        interview_stage,
        interview_date::TEXT,
        days_waited,
        follow_up_count,
        outcome,
        narrative,
        created_at::TEXT
      FROM reports
      WHERE company_id = (SELECT id FROM companies WHERE slug = $1)
      ORDER BY created_at DESC
      LIMIT 30;
    `,
    [slug]
  );

  const company = mapCompanyStats(companyResult.rows[0]);

  return {
    ...company,
    stageBreakdown: stageResult.rows.map((row) => ({
      stage: row.interview_stage,
      reportCount: Number(row.report_count),
      ghostedCount: Number(row.ghosted_count),
      ghostingRate:
        Number(row.report_count) === 0
          ? 0
          : Number(((Number(row.ghosted_count) / Number(row.report_count)) * 100).toFixed(1))
    })),
    reports: reportsResult.rows.map((row) => ({
      id: Number(row.id),
      roleTitle: row.role_title,
      candidateSeniority: row.candidate_seniority,
      interviewStage: row.interview_stage,
      interviewDate: row.interview_date,
      daysWaited: Number(row.days_waited),
      followUpCount: Number(row.follow_up_count),
      outcome: row.outcome,
      narrative: row.narrative,
      createdAt: row.created_at
    }))
  } satisfies CompanyDetail;
}

export async function createReport(input: {
  companyName: string;
  website?: string | null;
  industry?: string | null;
  headquarters?: string | null;
  roleTitle: string;
  candidateSeniority: "junior" | "mid" | "senior" | "staff" | "executive";
  interviewStage: "recruiter-screen" | "hiring-manager" | "technical" | "panel" | "final" | "other";
  interviewDate: string;
  daysWaited: number;
  followUpCount: number;
  outcome: "ghosted" | "replied" | "rejected" | "offer";
  narrative: string;
}) {
  await ensureDatabase();
  const pool = getPool();

  const slug = slugifyCompanyName(input.companyName) || `company-${Date.now()}`;

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const companyResult = await client.query<{ id: number; slug: string }>(
      `
        INSERT INTO companies (name, slug, website, industry, headquarters)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (slug)
        DO UPDATE SET
          name = EXCLUDED.name,
          website = COALESCE(companies.website, EXCLUDED.website),
          industry = COALESCE(companies.industry, EXCLUDED.industry),
          headquarters = COALESCE(companies.headquarters, EXCLUDED.headquarters)
        RETURNING id, slug;
      `,
      [
        input.companyName.trim(),
        slug,
        input.website?.trim() || null,
        input.industry?.trim() || null,
        input.headquarters?.trim() || null
      ]
    );

    const companyId = companyResult.rows[0]?.id;

    if (!companyId) {
      throw new Error("Failed to resolve company record.");
    }

    await client.query(
      `
        INSERT INTO reports (
          company_id,
          role_title,
          candidate_seniority,
          interview_stage,
          interview_date,
          days_waited,
          follow_up_count,
          outcome,
          narrative
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9);
      `,
      [
        companyId,
        input.roleTitle.trim(),
        input.candidateSeniority,
        input.interviewStage,
        input.interviewDate,
        input.daysWaited,
        input.followUpCount,
        input.outcome,
        input.narrative.trim()
      ]
    );

    await client.query("COMMIT");
    return { companySlug: companyResult.rows[0].slug };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function listRecentReports(limit = 20) {
  await ensureDatabase();
  const pool = getPool();

  const result = await pool.query<
    ReportRow & {
      company_name: string;
      company_slug: string;
    }
  >(
    `
      SELECT
        r.id,
        r.role_title,
        r.candidate_seniority,
        r.interview_stage,
        r.interview_date::TEXT,
        r.days_waited,
        r.follow_up_count,
        r.outcome,
        r.narrative,
        r.created_at::TEXT,
        c.name AS company_name,
        c.slug AS company_slug
      FROM reports r
      INNER JOIN companies c ON c.id = r.company_id
      ORDER BY r.created_at DESC
      LIMIT $1;
    `,
    [limit]
  );

  return result.rows.map((row) => ({
    id: Number(row.id),
    companyName: row.company_name,
    companySlug: row.company_slug,
    roleTitle: row.role_title,
    candidateSeniority: row.candidate_seniority,
    interviewStage: row.interview_stage,
    interviewDate: row.interview_date,
    daysWaited: Number(row.days_waited),
    followUpCount: Number(row.follow_up_count),
    outcome: row.outcome,
    narrative: row.narrative,
    createdAt: row.created_at
  }));
}

export async function getDashboardData() {
  await ensureDatabase();
  const pool = getPool();

  const [totalsResult, highRiskResult, bestResult] = await Promise.all([
    pool.query<{
      companies_tracked: number;
      reports_logged: number;
      overall_ghosting_rate: number;
      average_days_waiting: number;
    }>(`
      SELECT
        COUNT(DISTINCT c.id)::INT AS companies_tracked,
        COUNT(r.id)::INT AS reports_logged,
        COALESCE(ROUND((AVG((CASE WHEN r.outcome = 'ghosted' THEN 1 ELSE 0 END))::NUMERIC) * 100, 1), 0)::FLOAT8 AS overall_ghosting_rate,
        COALESCE(ROUND(AVG(r.days_waited)::NUMERIC, 1), 0)::FLOAT8 AS average_days_waiting
      FROM companies c
      LEFT JOIN reports r ON r.company_id = c.id;
    `),
    pool.query<CompanyStatsRow>(`
      SELECT
        c.slug,
        c.name,
        c.website,
        c.industry,
        c.headquarters,
        COUNT(r.id)::INT AS total_reports,
        COALESCE(ROUND((AVG((CASE WHEN r.outcome = 'ghosted' THEN 1 ELSE 0 END))::NUMERIC) * 100, 1), 0)::FLOAT8 AS ghosting_rate,
        COALESCE(ROUND(AVG(r.days_waited)::NUMERIC, 1), 0)::FLOAT8 AS avg_days_waited,
        MAX(r.created_at)::TEXT AS last_reported_at
      FROM companies c
      INNER JOIN reports r ON r.company_id = c.id
      GROUP BY c.id
      HAVING COUNT(r.id) >= 3
      ORDER BY ghosting_rate DESC, total_reports DESC
      LIMIT 10;
    `),
    pool.query<CompanyStatsRow>(`
      SELECT
        c.slug,
        c.name,
        c.website,
        c.industry,
        c.headquarters,
        COUNT(r.id)::INT AS total_reports,
        COALESCE(ROUND((AVG((CASE WHEN r.outcome = 'ghosted' THEN 1 ELSE 0 END))::NUMERIC) * 100, 1), 0)::FLOAT8 AS ghosting_rate,
        COALESCE(ROUND(AVG(r.days_waited)::NUMERIC, 1), 0)::FLOAT8 AS avg_days_waited,
        MAX(r.created_at)::TEXT AS last_reported_at
      FROM companies c
      INNER JOIN reports r ON r.company_id = c.id
      GROUP BY c.id
      HAVING COUNT(r.id) >= 3
      ORDER BY ghosting_rate ASC, avg_days_waited ASC, total_reports DESC
      LIMIT 10;
    `)
  ]);

  const totals = totalsResult.rows[0] ?? {
    companies_tracked: 0,
    reports_logged: 0,
    overall_ghosting_rate: 0,
    average_days_waiting: 0
  };

  return {
    totals: {
      companiesTracked: Number(totals.companies_tracked),
      reportsLogged: Number(totals.reports_logged),
      overallGhostingRate: Number(totals.overall_ghosting_rate),
      averageDaysWaiting: Number(totals.average_days_waiting)
    },
    highestRiskCompanies: highRiskResult.rows.map(mapCompanyStats),
    fastestResponders: bestResult.rows.map(mapCompanyStats)
  } satisfies DashboardData;
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export async function upsertSubscription(input: {
  email: string;
  status: "active" | "canceled" | "past_due";
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
}) {
  await ensureDatabase();
  const pool = getPool();

  await pool.query(
    `
      INSERT INTO subscriptions (email, status, stripe_customer_id, stripe_subscription_id, updated_at)
      VALUES ($1, $2, $3, $4, NOW())
      ON CONFLICT (email)
      DO UPDATE SET
        status = EXCLUDED.status,
        stripe_customer_id = COALESCE(EXCLUDED.stripe_customer_id, subscriptions.stripe_customer_id),
        stripe_subscription_id = COALESCE(EXCLUDED.stripe_subscription_id, subscriptions.stripe_subscription_id),
        updated_at = NOW();
    `,
    [
      normalizeEmail(input.email),
      input.status,
      input.stripeCustomerId ?? null,
      input.stripeSubscriptionId ?? null
    ]
  );
}

export async function updateSubscriptionStatusByCustomerId(input: {
  stripeCustomerId: string;
  status: "active" | "canceled" | "past_due";
}) {
  await ensureDatabase();
  const pool = getPool();

  await pool.query(
    `
      UPDATE subscriptions
      SET status = $2, updated_at = NOW()
      WHERE stripe_customer_id = $1;
    `,
    [input.stripeCustomerId, input.status]
  );
}

export async function hasActiveSubscription(email: string) {
  await ensureDatabase();
  const pool = getPool();
  const result = await pool.query<{ email: string }>(
    `
      SELECT email
      FROM subscriptions
      WHERE email = $1
        AND status = 'active'
      LIMIT 1;
    `,
    [normalizeEmail(email)]
  );

  return result.rows.length > 0;
}

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function createAccessSession(email: string) {
  await ensureDatabase();
  const pool = getPool();
  const rawToken = randomBytes(32).toString("hex");
  const tokenHash = hashToken(rawToken);

  await pool.query(
    `
      DELETE FROM access_sessions
      WHERE expires_at < NOW();
    `
  );

  await pool.query(
    `
      INSERT INTO access_sessions (email, token_hash, expires_at)
      VALUES ($1, $2, NOW() + INTERVAL '${ACCESS_COOKIE_DAYS} days');
    `,
    [normalizeEmail(email), tokenHash]
  );

  return rawToken;
}

export async function resolveAccessSessionEmail(token: string) {
  await ensureDatabase();
  const pool = getPool();
  const tokenHash = hashToken(token);

  const result = await pool.query<{ email: string }>(
    `
      SELECT email
      FROM access_sessions
      WHERE token_hash = $1
        AND expires_at > NOW()
      LIMIT 1;
    `,
    [tokenHash]
  );

  return result.rows[0]?.email ?? null;
}
