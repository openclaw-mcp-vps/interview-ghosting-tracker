import crypto from "crypto";

export function getCheckoutUrl(): string {
  const storeId = process.env.NEXT_PUBLIC_LEMON_SQUEEZY_STORE_ID;
  const productId = process.env.NEXT_PUBLIC_LEMON_SQUEEZY_PRODUCT_ID;

  if (!storeId || !productId) {
    return "#";
  }

  return `https://${storeId}.lemonsqueezy.com/buy/${productId}?embed=1&media=0&logo=0`;
}

export function verifyLemonSqueezySignature(rawBody: string, signature: string | null): boolean {
  const secret = process.env.LEMON_SQUEEZY_WEBHOOK_SECRET;
  if (!secret || !signature) return false;

  const digest = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  const digestBuffer = Buffer.from(digest, "utf8");
  const signatureBuffer = Buffer.from(signature, "utf8");

  if (digestBuffer.length !== signatureBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(digestBuffer, signatureBuffer);
}

export function extractEmailFromWebhook(payload: Record<string, unknown>): string | null {
  const data = payload.data as { attributes?: Record<string, unknown> } | undefined;
  const attrs = data?.attributes;
  if (!attrs) return null;

  const email = attrs.user_email ?? attrs.customer_email;
  return typeof email === "string" ? email : null;
}

export function mapWebhookStatus(eventName: string): string | null {
  if (["order_created", "subscription_created", "subscription_resumed"].includes(eventName)) {
    return "active";
  }
  if (["subscription_cancelled", "subscription_expired", "subscription_paused"].includes(eventName)) {
    return "inactive";
  }
  return null;
}
