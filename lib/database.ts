import { createHash } from "node:crypto";
import { Pool, type PoolClient, type QueryResultRow } from "pg";

export type SortMode = "ghosting_rate" | "reports" | "recent" | "name";

export type ReportInput = {
  companyName: string;
  companyWebsite?: string | null;
  industry?: string | null;
  roleTitle: string;
  candidateFunction: string;
  candidateLevel: string;
  interviewStage: string;
  interviewCount: number;
  daysWaited: number;
  lastContactDate: string;
  location?: string | null;
  experience: string;
  eventualResponse: boolean;
  publicConsent: boolean;
  reporterEmail?: string | null;
};

export type CompanySummary = {
  id: number;
  name: string;
  slug: string;
  website: string | null;
  industry: string | null;
  totalReports: number;
  ghostingRate: number;
  avgDaysWaited: number;
  lastReportedAt: string | null;
};

export type CompanyProfile = CompanySummary & {
  createdAt: string;
};

export type ReportRecord = {
  id: number;
  roleTitle: string;
  candidateFunction: string;
  candidateLevel: string;
  interviewStage: string;
  interviewCount: number;
  daysWaited: number;
  lastContactDate: string;
  location: string | null;
  experience: string;
  eventualResponse: boolean;
  createdAt: string;
};

export type DashboardMetrics = {
  totalCompanies: number;
  totalReports: number;
  overallGhostingRate: number;
  medianWaitDays: number;
  worstCompanies: CompanySummary[];
};

export type StageInsight = {
  stage: string;
  reports: number;
  ghostingRate: number;
  avgDaysWaited: number;
};

export type RecentReportWithCompany = ReportRecord & {
  companyName: string;
  companySlug: string;
};

const DATABASE_URL = process.env.DATABASE_URL;

type GlobalState = {
  pool: Pool | null;
  schemaInit: Promise<void> | null;
};

const globalForDb = globalThis as unknown as { __ghostingDb?: GlobalState };

if (!globalForDb.__ghostingDb) {
  globalForDb.__ghostingDb = {
    pool: null,
    schemaInit: null
  };
}

const dbState = globalForDb.__ghostingDb;

export function isDatabaseConfigured(): boolean {
  return Boolean(DATABASE_URL);
}

function slugifyCompanyName(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")
    .slice(0, 80);
}

function toNumber(value: unknown): number {
  if (typeof value === "number") return value;

  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
}

function toDateString(value: unknown): string | null {
  if (!value) return null;
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "string") return value;
  return null;
}

function mapCompanyRow(row: QueryResultRow): CompanySummary {
  return {
    id: toNumber(row.id),
    name: String(row.name),
    slug: String(row.slug),
    website: row.website ? String(row.website) : null,
    industry: row.industry ? String(row.industry) : null,
    totalReports: toNumber(row.total_reports),
    ghostingRate: toNumber(row.ghosting_rate),
    avgDaysWaited: toNumber(row.avg_days_waited),
    lastReportedAt: toDateString(row.last_reported_at)
  };
}

function getPool(): Pool {
  if (!DATABASE_URL) {
    throw new Error("DATABASE_URL is not configured");
  }

  if (!dbState.pool) {
    dbState.pool = new Pool({
      connectionString: DATABASE_URL,
      ssl: DATABASE_URL.includes("localhost")
        ? false
        : {
            rejectUnauthorized: false
          }
    });
  }

  return dbState.pool;
}

async function ensureSchema(): Promise<void> {
  if (!DATABASE_URL) {
    return;
  }

  if (!dbState.schemaInit) {
    dbState.schemaInit = (async () => {
      const pool = getPool();

      await pool.query(`
        CREATE TABLE IF NOT EXISTS companies (
          id BIGSERIAL PRIMARY KEY,
          name TEXT NOT NULL UNIQUE,
          slug TEXT NOT NULL UNIQUE,
          website TEXT,
          industry TEXT,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
      `);

      await pool.query(`
        CREATE TABLE IF NOT EXISTS reports (
          id BIGSERIAL PRIMARY KEY,
          company_id BIGINT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
          role_title TEXT NOT NULL,
          candidate_function TEXT NOT NULL,
          candidate_level TEXT NOT NULL,
          interview_stage TEXT NOT NULL,
          interview_count INT NOT NULL CHECK (interview_count > 0),
          days_waited INT NOT NULL CHECK (days_waited >= 0),
          last_contact_date DATE NOT NULL,
          location TEXT,
          experience TEXT NOT NULL,
          eventual_response BOOLEAN NOT NULL DEFAULT FALSE,
          public_consent BOOLEAN NOT NULL DEFAULT TRUE,
          reporter_fingerprint TEXT,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
      `);

      await pool.query(`
        CREATE TABLE IF NOT EXISTS paid_access (
          id BIGSERIAL PRIMARY KEY,
          email TEXT NOT NULL UNIQUE,
          status TEXT NOT NULL,
          source TEXT NOT NULL,
          stripe_customer_id TEXT,
          stripe_checkout_session_id TEXT UNIQUE,
          amount_total INT,
          currency TEXT,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
      `);

      await pool.query(`
        CREATE INDEX IF NOT EXISTS idx_reports_company_id ON reports(company_id);
      `);

      await pool.query(`
        CREATE INDEX IF NOT EXISTS idx_reports_created_at ON reports(created_at DESC);
      `);

      await pool.query(`
        CREATE INDEX IF NOT EXISTS idx_reports_stage ON reports(interview_stage);
      `);

      await pool.query(`
        CREATE INDEX IF NOT EXISTS idx_paid_access_email_status ON paid_access(email, status);
      `);
    })();
  }

  await dbState.schemaInit;
}

async function findOrCreateCompany(
  client: PoolClient,
  input: { name: string; website?: string | null; industry?: string | null }
): Promise<{ id: number; slug: string }> {
  const normalizedName = input.name.trim();

  const existing = await client.query(
    `
    SELECT id, slug
    FROM companies
    WHERE LOWER(name) = LOWER($1)
    LIMIT 1;
  `,
    [normalizedName]
  );

  if (existing.rows[0]) {
    const row = existing.rows[0];

    await client.query(
      `
      UPDATE companies
      SET
        website = COALESCE($2, website),
        industry = COALESCE($3, industry)
      WHERE id = $1;
    `,
      [row.id, input.website?.trim() || null, input.industry?.trim() || null]
    );

    return { id: toNumber(row.id), slug: String(row.slug) };
  }

  const baseSlug = slugifyCompanyName(normalizedName) || "company";

  for (let attempt = 0; attempt < 100; attempt += 1) {
    const candidateSlug = attempt === 0 ? baseSlug : `${baseSlug}-${attempt + 1}`;

    try {
      const inserted = await client.query(
        `
        INSERT INTO companies (name, slug, website, industry)
        VALUES ($1, $2, $3, $4)
        RETURNING id, slug;
      `,
        [normalizedName, candidateSlug, input.website?.trim() || null, input.industry?.trim() || null]
      );

      return {
        id: toNumber(inserted.rows[0]?.id),
        slug: String(inserted.rows[0]?.slug)
      };
    } catch (error) {
      const pgError = error as { code?: string };

      if (pgError.code === "23505") {
        const raceResult = await client.query(
          `
          SELECT id, slug
          FROM companies
          WHERE LOWER(name) = LOWER($1)
          LIMIT 1;
        `,
          [normalizedName]
        );

        if (raceResult.rows[0]) {
          return {
            id: toNumber(raceResult.rows[0]?.id),
            slug: String(raceResult.rows[0]?.slug)
          };
        }

        continue;
      }

      throw error;
    }
  }

  throw new Error(`Could not create unique company slug for ${normalizedName}`);
}

export async function createGhostingReport(input: ReportInput): Promise<{ companySlug: string; reportId: number }> {
  if (!DATABASE_URL) {
    throw new Error("DATABASE_URL is missing. Add DATABASE_URL to submit reports.");
  }

  await ensureSchema();
  const pool = getPool();

  const reporterFingerprint = input.reporterEmail
    ? createHash("sha256").update(input.reporterEmail.trim().toLowerCase()).digest("hex")
    : null;

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const company = await findOrCreateCompany(client, {
      name: input.companyName,
      website: input.companyWebsite,
      industry: input.industry
    });

    const reportResult = await client.query(
      `
      INSERT INTO reports (
        company_id,
        role_title,
        candidate_function,
        candidate_level,
        interview_stage,
        interview_count,
        days_waited,
        last_contact_date,
        location,
        experience,
        eventual_response,
        public_consent,
        reporter_fingerprint
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
      RETURNING id;
    `,
      [
        company.id,
        input.roleTitle.trim(),
        input.candidateFunction.trim(),
        input.candidateLevel.trim(),
        input.interviewStage.trim(),
        input.interviewCount,
        input.daysWaited,
        input.lastContactDate,
        input.location?.trim() || null,
        input.experience.trim(),
        input.eventualResponse,
        input.publicConsent,
        reporterFingerprint
      ]
    );

    await client.query("COMMIT");

    return {
      companySlug: company.slug,
      reportId: toNumber(reportResult.rows[0]?.id)
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

function buildSort(sort: SortMode): string {
  switch (sort) {
    case "reports":
      return "total_reports DESC, ghosting_rate DESC, name ASC";
    case "recent":
      return "last_reported_at DESC NULLS LAST, total_reports DESC";
    case "name":
      return "name ASC";
    case "ghosting_rate":
    default:
      return "ghosting_rate DESC, total_reports DESC, name ASC";
  }
}

export async function getCompanySummaries(options?: {
  query?: string;
  stage?: string;
  minReports?: number;
  sort?: SortMode;
  limit?: number;
}): Promise<CompanySummary[]> {
  if (!DATABASE_URL) {
    return [];
  }

  await ensureSchema();
  const pool = getPool();

  const query = options?.query?.trim() || null;
  const stage = options?.stage?.trim() || null;
  const minReports = options?.minReports ?? 0;
  const limit = options?.limit ?? 50;
  const sort = options?.sort ?? "ghosting_rate";

  const orderClause = buildSort(sort);

  const result = await pool.query(
    `
    SELECT
      c.id,
      c.name,
      c.slug,
      c.website,
      c.industry,
      COUNT(r.id)::int AS total_reports,
      COALESCE(
        ROUND(
          (100.0 * SUM(CASE WHEN r.id IS NOT NULL AND r.eventual_response = FALSE THEN 1 ELSE 0 END)
            / NULLIF(COUNT(r.id), 0)
          )::numeric,
          1
        ),
        0
      ) AS ghosting_rate,
      COALESCE(ROUND(AVG(r.days_waited)::numeric, 1), 0) AS avg_days_waited,
      MAX(r.created_at) AS last_reported_at
    FROM companies c
    LEFT JOIN reports r
      ON r.company_id = c.id
      AND ($2::text IS NULL OR r.interview_stage = $2)
    WHERE
      ($1::text IS NULL OR c.name ILIKE '%' || $1 || '%' OR c.slug ILIKE '%' || $1 || '%')
    GROUP BY c.id, c.name, c.slug, c.website, c.industry
    HAVING COUNT(r.id) >= $3
    ORDER BY ${orderClause}
    LIMIT $4;
  `,
    [query, stage, minReports, limit]
  );

  return result.rows.map(mapCompanyRow);
}

export async function getCompanyProfileBySlug(slug: string): Promise<CompanyProfile | null> {
  if (!DATABASE_URL) {
    return null;
  }

  await ensureSchema();
  const pool = getPool();

  const result = await pool.query(
    `
    SELECT
      c.id,
      c.name,
      c.slug,
      c.website,
      c.industry,
      c.created_at,
      COUNT(r.id)::int AS total_reports,
      COALESCE(
        ROUND(
          (100.0 * SUM(CASE WHEN r.id IS NOT NULL AND r.eventual_response = FALSE THEN 1 ELSE 0 END)
            / NULLIF(COUNT(r.id), 0)
          )::numeric,
          1
        ),
        0
      ) AS ghosting_rate,
      COALESCE(ROUND(AVG(r.days_waited)::numeric, 1), 0) AS avg_days_waited,
      MAX(r.created_at) AS last_reported_at
    FROM companies c
    LEFT JOIN reports r ON r.company_id = c.id
    WHERE c.slug = $1
    GROUP BY c.id, c.name, c.slug, c.website, c.industry, c.created_at
    LIMIT 1;
  `,
    [slug]
  );

  const row = result.rows[0];
  if (!row) {
    return null;
  }

  return {
    ...mapCompanyRow(row),
    createdAt: toDateString(row.created_at) ?? new Date().toISOString()
  };
}

export async function getReportsByCompanyId(companyId: number, limit = 100): Promise<ReportRecord[]> {
  if (!DATABASE_URL) {
    return [];
  }

  await ensureSchema();
  const pool = getPool();

  const result = await pool.query(
    `
    SELECT
      id,
      role_title,
      candidate_function,
      candidate_level,
      interview_stage,
      interview_count,
      days_waited,
      last_contact_date,
      location,
      experience,
      eventual_response,
      created_at
    FROM reports
    WHERE company_id = $1 AND public_consent = TRUE
    ORDER BY created_at DESC
    LIMIT $2;
  `,
    [companyId, limit]
  );

  return result.rows.map((row) => ({
    id: toNumber(row.id),
    roleTitle: String(row.role_title),
    candidateFunction: String(row.candidate_function),
    candidateLevel: String(row.candidate_level),
    interviewStage: String(row.interview_stage),
    interviewCount: toNumber(row.interview_count),
    daysWaited: toNumber(row.days_waited),
    lastContactDate: toDateString(row.last_contact_date) ?? "",
    location: row.location ? String(row.location) : null,
    experience: String(row.experience),
    eventualResponse: Boolean(row.eventual_response),
    createdAt: toDateString(row.created_at) ?? ""
  }));
}

export async function getRecentReports(limit = 12): Promise<RecentReportWithCompany[]> {
  if (!DATABASE_URL) {
    return [];
  }

  await ensureSchema();
  const pool = getPool();

  const result = await pool.query(
    `
    SELECT
      r.id,
      r.role_title,
      r.candidate_function,
      r.candidate_level,
      r.interview_stage,
      r.interview_count,
      r.days_waited,
      r.last_contact_date,
      r.location,
      r.experience,
      r.eventual_response,
      r.created_at,
      c.name AS company_name,
      c.slug AS company_slug
    FROM reports r
    INNER JOIN companies c ON c.id = r.company_id
    WHERE r.public_consent = TRUE
    ORDER BY r.created_at DESC
    LIMIT $1;
  `,
    [limit]
  );

  return result.rows.map((row) => ({
    id: toNumber(row.id),
    roleTitle: String(row.role_title),
    candidateFunction: String(row.candidate_function),
    candidateLevel: String(row.candidate_level),
    interviewStage: String(row.interview_stage),
    interviewCount: toNumber(row.interview_count),
    daysWaited: toNumber(row.days_waited),
    lastContactDate: toDateString(row.last_contact_date) ?? "",
    location: row.location ? String(row.location) : null,
    experience: String(row.experience),
    eventualResponse: Boolean(row.eventual_response),
    createdAt: toDateString(row.created_at) ?? "",
    companyName: String(row.company_name),
    companySlug: String(row.company_slug)
  }));
}

export async function getStageInsights(limit = 8): Promise<StageInsight[]> {
  if (!DATABASE_URL) {
    return [];
  }

  await ensureSchema();
  const pool = getPool();

  const result = await pool.query(
    `
    SELECT
      interview_stage AS stage,
      COUNT(*)::int AS reports,
      ROUND((100.0 * SUM(CASE WHEN eventual_response = FALSE THEN 1 ELSE 0 END) / NULLIF(COUNT(*), 0))::numeric, 1) AS ghosting_rate,
      ROUND(AVG(days_waited)::numeric, 1) AS avg_days_waited
    FROM reports
    GROUP BY interview_stage
    HAVING COUNT(*) > 0
    ORDER BY ghosting_rate DESC, reports DESC
    LIMIT $1;
  `,
    [limit]
  );

  return result.rows.map((row) => ({
    stage: String(row.stage),
    reports: toNumber(row.reports),
    ghostingRate: toNumber(row.ghosting_rate),
    avgDaysWaited: toNumber(row.avg_days_waited)
  }));
}

export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  if (!DATABASE_URL) {
    return {
      totalCompanies: 0,
      totalReports: 0,
      overallGhostingRate: 0,
      medianWaitDays: 0,
      worstCompanies: []
    };
  }

  await ensureSchema();
  const pool = getPool();

  const [totals, median, worstCompanies] = await Promise.all([
    pool.query(`
      SELECT
        (SELECT COUNT(*)::int FROM companies) AS total_companies,
        (SELECT COUNT(*)::int FROM reports) AS total_reports,
        COALESCE(
          ROUND(
            (
              SELECT 100.0 * SUM(CASE WHEN eventual_response = FALSE THEN 1 ELSE 0 END) / NULLIF(COUNT(*), 0)
              FROM reports
            )::numeric,
            1
          ),
          0
        ) AS overall_ghosting_rate;
    `),
    pool.query(`
      SELECT COALESCE(PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY days_waited), 0) AS median_wait_days
      FROM reports;
    `),
    getCompanySummaries({ minReports: 3, sort: "ghosting_rate", limit: 8 })
  ]);

  return {
    totalCompanies: toNumber(totals.rows[0]?.total_companies),
    totalReports: toNumber(totals.rows[0]?.total_reports),
    overallGhostingRate: toNumber(totals.rows[0]?.overall_ghosting_rate),
    medianWaitDays: toNumber(median.rows[0]?.median_wait_days),
    worstCompanies
  };
}

export async function upsertPaidAccess(input: {
  email: string;
  status: "paid" | "refunded" | "disputed";
  source?: string;
  stripeCustomerId?: string | null;
  stripeCheckoutSessionId?: string | null;
  amountTotal?: number | null;
  currency?: string | null;
}): Promise<void> {
  if (!DATABASE_URL) {
    return;
  }

  await ensureSchema();
  const pool = getPool();

  await pool.query(
    `
    INSERT INTO paid_access (
      email,
      status,
      source,
      stripe_customer_id,
      stripe_checkout_session_id,
      amount_total,
      currency,
      updated_at
    )
    VALUES ($1,$2,$3,$4,$5,$6,$7,NOW())
    ON CONFLICT (email)
    DO UPDATE SET
      status = EXCLUDED.status,
      source = EXCLUDED.source,
      stripe_customer_id = COALESCE(EXCLUDED.stripe_customer_id, paid_access.stripe_customer_id),
      stripe_checkout_session_id = COALESCE(EXCLUDED.stripe_checkout_session_id, paid_access.stripe_checkout_session_id),
      amount_total = COALESCE(EXCLUDED.amount_total, paid_access.amount_total),
      currency = COALESCE(EXCLUDED.currency, paid_access.currency),
      updated_at = NOW();
  `,
    [
      input.email.trim().toLowerCase(),
      input.status,
      input.source || "stripe",
      input.stripeCustomerId ?? null,
      input.stripeCheckoutSessionId ?? null,
      input.amountTotal ?? null,
      input.currency ?? null
    ]
  );
}

export async function hasPaidAccess(email: string): Promise<boolean> {
  if (!DATABASE_URL) {
    return false;
  }

  await ensureSchema();
  const pool = getPool();

  const result = await pool.query(
    `
    SELECT status
    FROM paid_access
    WHERE email = $1
    LIMIT 1;
  `,
    [email.trim().toLowerCase()]
  );

  if (!result.rows[0]) {
    return false;
  }

  return result.rows[0].status === "paid";
}
