import { NextResponse } from "next/server";
import {
  readStripeIdentity,
  type StripeWebhookPayload,
  verifyStripeSignature
} from "@/lib/lemonsqueezy";
import {
  updateSubscriptionStatusByCustomerId,
  upsertSubscription
} from "@/lib/database";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    return NextResponse.json(
      { error: "STRIPE_WEBHOOK_SECRET is not configured." },
      { status: 500 }
    );
  }

  const signatureHeader = request.headers.get("stripe-signature");
  const rawBody = await request.text();

  const valid = verifyStripeSignature({
    rawBody,
    signatureHeader,
    secret: webhookSecret
  });

  if (!valid) {
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  let payload: StripeWebhookPayload;
  try {
    payload = JSON.parse(rawBody) as StripeWebhookPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  const identity = readStripeIdentity(payload);

  try {
    switch (payload.type) {
      case "checkout.session.completed":
      case "invoice.payment_succeeded": {
        if (identity.email) {
          await upsertSubscription({
            email: identity.email,
            status: "active",
            stripeCustomerId: identity.stripeCustomerId,
            stripeSubscriptionId: identity.stripeSubscriptionId
          });
        }
        break;
      }
      case "invoice.payment_failed": {
        if (identity.email) {
          await upsertSubscription({
            email: identity.email,
            status: "past_due",
            stripeCustomerId: identity.stripeCustomerId,
            stripeSubscriptionId: identity.stripeSubscriptionId
          });
        } else if (identity.stripeCustomerId) {
          await updateSubscriptionStatusByCustomerId({
            stripeCustomerId: identity.stripeCustomerId,
            status: "past_due"
          });
        }
        break;
      }
      case "customer.subscription.deleted": {
        if (identity.email) {
          await upsertSubscription({
            email: identity.email,
            status: "canceled",
            stripeCustomerId: identity.stripeCustomerId,
            stripeSubscriptionId: identity.stripeSubscriptionId
          });
        } else if (identity.stripeCustomerId) {
          await updateSubscriptionStatusByCustomerId({
            stripeCustomerId: identity.stripeCustomerId,
            status: "canceled"
          });
        }
        break;
      }
      default:
        break;
    }
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to process webhook.";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
