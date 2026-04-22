import { NextRequest, NextResponse } from "next/server";
import { upsertPaidAccess } from "@/lib/database";
import { extractPaidAccessFromStripe, parseStripeWebhookEvent, verifyStripeWebhookSignature } from "@/lib/lemonsqueezy";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const signatureHeader = request.headers.get("stripe-signature");
  const rawBody = await request.text();

  if (!verifyStripeWebhookSignature(rawBody, signatureHeader)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    const event = parseStripeWebhookEvent(rawBody);
    const paidAccess = extractPaidAccessFromStripe(event);

    if (!paidAccess) {
      return NextResponse.json({ received: true, ignored: true });
    }

    await upsertPaidAccess({
      email: paidAccess.email,
      status: paidAccess.status,
      source: "stripe-webhook",
      stripeCustomerId: paidAccess.stripeCustomerId,
      stripeCheckoutSessionId: paidAccess.stripeCheckoutSessionId,
      amountTotal: paidAccess.amountTotal,
      currency: paidAccess.currency
    });

    return NextResponse.json({ received: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Webhook processing failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
