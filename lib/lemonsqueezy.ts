import { createHmac, timingSafeEqual } from "node:crypto";

export const ACCESS_COOKIE_NAME = "igt_access";

export type AccessTokenPayload = {
  email: string;
  exp: number;
};

type StripeCheckoutSession = {
  id?: string;
  customer?: string;
  customer_email?: string;
  customer_details?: {
    email?: string;
  };
  amount_total?: number;
  currency?: string;
  payment_status?: string;
};

type StripeChargeObject = {
  id?: string;
  customer?: string;
  amount?: number;
  currency?: string;
  billing_details?: {
    email?: string;
  };
};

export type StripeWebhookEvent = {
  id?: string;
  type?: string;
  data?: {
    object?: StripeCheckoutSession | StripeChargeObject;
  };
};

function base64url(input: string): string {
  return Buffer.from(input, "utf8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function fromBase64url(input: string): string {
  const normalized = input.replace(/-/g, "+").replace(/_/g, "/");
  const padding = normalized.length % 4 === 0 ? "" : "=".repeat(4 - (normalized.length % 4));
  return Buffer.from(normalized + padding, "base64").toString("utf8");
}

function safeEqualHex(a: string, b: string): boolean {
  const aBuf = Buffer.from(a, "utf8");
  const bBuf = Buffer.from(b, "utf8");

  if (aBuf.length !== bBuf.length) {
    return false;
  }

  return timingSafeEqual(aBuf, bBuf);
}

function getAccessSigningSecret(): string {
  return process.env.ACCESS_COOKIE_SECRET || process.env.STRIPE_WEBHOOK_SECRET || "dev-only-access-secret";
}

export function signPayload(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload, "utf8").digest("hex");
}

export function createAccessCookieValue(email: string, validDays = 31): string {
  const payload: AccessTokenPayload = {
    email: email.trim().toLowerCase(),
    exp: Math.floor(Date.now() / 1000) + validDays * 24 * 60 * 60
  };

  const encodedPayload = base64url(JSON.stringify(payload));
  const signature = signPayload(encodedPayload, getAccessSigningSecret());

  return `${encodedPayload}.${signature}`;
}

export function readAccessCookieValue(cookieValue: string | undefined): AccessTokenPayload | null {
  if (!cookieValue) {
    return null;
  }

  const [encodedPayload, signature] = cookieValue.split(".");
  if (!encodedPayload || !signature) {
    return null;
  }

  const expected = signPayload(encodedPayload, getAccessSigningSecret());
  if (!safeEqualHex(expected, signature)) {
    return null;
  }

  try {
    const payload = JSON.parse(fromBase64url(encodedPayload)) as AccessTokenPayload;

    if (!payload.email || typeof payload.exp !== "number") {
      return null;
    }

    if (payload.exp <= Math.floor(Date.now() / 1000)) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

export function getStripePaymentLink(): string {
  return process.env.NEXT_PUBLIC_STRIPE_PAYMENT_LINK || "";
}

function parseSignatureHeader(signatureHeader: string): { timestamp: string; signatures: string[] } | null {
  const parts = signatureHeader.split(",").map((part) => part.trim());

  let timestamp = "";
  const signatures: string[] = [];

  for (const part of parts) {
    const [key, value] = part.split("=");
    if (!key || !value) continue;

    if (key === "t") {
      timestamp = value;
    }

    if (key === "v1") {
      signatures.push(value);
    }
  }

  if (!timestamp || signatures.length === 0) {
    return null;
  }

  return { timestamp, signatures };
}

export function verifyStripeWebhookSignature(rawBody: string, signatureHeader: string | null): boolean {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret || !signatureHeader) {
    return false;
  }

  const parsed = parseSignatureHeader(signatureHeader);
  if (!parsed) {
    return false;
  }

  const signedPayload = `${parsed.timestamp}.${rawBody}`;
  const expected = signPayload(signedPayload, secret);

  return parsed.signatures.some((signature) => safeEqualHex(signature, expected));
}

export function parseStripeWebhookEvent(rawBody: string): StripeWebhookEvent {
  return JSON.parse(rawBody) as StripeWebhookEvent;
}

function getEmailFromStripeObject(obj: StripeCheckoutSession | StripeChargeObject): string | null {
  const checkout = obj as StripeCheckoutSession;
  if (checkout.customer_details?.email || checkout.customer_email) {
    return checkout.customer_details?.email || checkout.customer_email || null;
  }

  const charge = obj as StripeChargeObject;
  return charge.billing_details?.email || null;
}

export function extractPaidAccessFromStripe(event: StripeWebhookEvent): {
  email: string;
  status: "paid" | "refunded" | "disputed";
  stripeCustomerId: string | null;
  stripeCheckoutSessionId: string | null;
  amountTotal: number | null;
  currency: string | null;
} | null {
  const eventType = event.type;
  const obj = event.data?.object;

  if (!eventType || !obj) {
    return null;
  }

  const email = getEmailFromStripeObject(obj);
  if (!email) {
    return null;
  }

  const checkout = obj as StripeCheckoutSession;
  const charge = obj as StripeChargeObject;

  if (eventType === "checkout.session.completed" || eventType === "checkout.session.async_payment_succeeded") {
    if (checkout.payment_status && checkout.payment_status !== "paid") {
      return null;
    }

    return {
      email,
      status: "paid",
      stripeCustomerId: checkout.customer || null,
      stripeCheckoutSessionId: checkout.id || null,
      amountTotal: checkout.amount_total ?? null,
      currency: checkout.currency ?? null
    };
  }

  if (eventType === "charge.refunded") {
    return {
      email,
      status: "refunded",
      stripeCustomerId: charge.customer || null,
      stripeCheckoutSessionId: null,
      amountTotal: charge.amount ?? null,
      currency: charge.currency ?? null
    };
  }

  if (eventType === "charge.dispute.created") {
    return {
      email,
      status: "disputed",
      stripeCustomerId: charge.customer || null,
      stripeCheckoutSessionId: null,
      amountTotal: charge.amount ?? null,
      currency: charge.currency ?? null
    };
  }

  return null;
}
