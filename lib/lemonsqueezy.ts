import { createHmac, timingSafeEqual } from "node:crypto";

const MAX_SIGNATURE_AGE_SECONDS = 5 * 60;

function parseStripeSignatureHeader(headerValue: string) {
  const parts = headerValue.split(",").map((segment) => segment.trim());
  const timestamp = parts
    .find((part) => part.startsWith("t="))
    ?.replace("t=", "");

  const signatures = parts
    .filter((part) => part.startsWith("v1="))
    .map((part) => part.replace("v1=", ""));

  return {
    timestamp: timestamp ? Number(timestamp) : NaN,
    signatures
  };
}

export function verifyStripeSignature(input: {
  rawBody: string;
  signatureHeader: string | null;
  secret: string;
}) {
  if (!input.signatureHeader) {
    return false;
  }

  const parsed = parseStripeSignatureHeader(input.signatureHeader);
  if (!Number.isFinite(parsed.timestamp) || parsed.signatures.length === 0) {
    return false;
  }

  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - parsed.timestamp) > MAX_SIGNATURE_AGE_SECONDS) {
    return false;
  }

  const signedPayload = `${parsed.timestamp}.${input.rawBody}`;
  const expected = createHmac("sha256", input.secret)
    .update(signedPayload, "utf8")
    .digest("hex");

  const expectedBuffer = Buffer.from(expected, "utf8");

  return parsed.signatures.some((signature) => {
    const signatureBuffer = Buffer.from(signature, "utf8");

    if (signatureBuffer.length !== expectedBuffer.length) {
      return false;
    }

    return timingSafeEqual(signatureBuffer, expectedBuffer);
  });
}

export type StripeWebhookPayload = {
  type: string;
  data?: {
    object?: Record<string, unknown>;
  };
};

export function readStripeIdentity(payload: StripeWebhookPayload) {
  const object = payload.data?.object;

  const maybeEmail =
    typeof object?.customer_email === "string"
      ? object.customer_email
      : typeof (object?.customer_details as { email?: unknown } | undefined)?.email ===
          "string"
        ? ((object?.customer_details as { email: string }).email ?? null)
        : null;

  const maybeCustomerId =
    typeof object?.customer === "string" ? object.customer : null;

  const maybeSubscriptionId =
    typeof object?.subscription === "string" ? object.subscription : null;

  return {
    email: maybeEmail,
    stripeCustomerId: maybeCustomerId,
    stripeSubscriptionId: maybeSubscriptionId
  };
}
