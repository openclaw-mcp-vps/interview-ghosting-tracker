import { NextRequest, NextResponse } from "next/server";
import {
  extractEmailFromWebhook,
  mapWebhookStatus,
  verifyLemonSqueezySignature
} from "@/lib/lemonsqueezy";
import { upsertSubscription } from "@/lib/database";

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-signature");

  if (!verifyLemonSqueezySignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  try {
    const payload = JSON.parse(rawBody) as Record<string, unknown>;
    const meta = payload.meta as { event_name?: string } | undefined;
    const eventName = meta?.event_name;

    if (!eventName) {
      return NextResponse.json({ error: "Missing event name" }, { status: 400 });
    }

    const email = extractEmailFromWebhook(payload);
    const status = mapWebhookStatus(eventName);

    if (email && status) {
      const data = payload.data as { id?: string } | undefined;
      await upsertSubscription(email, status, data?.id);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook handling failed", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
