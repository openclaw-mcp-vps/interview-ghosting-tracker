import { z } from "zod";
import { NextResponse } from "next/server";
import { ACCESS_COOKIE_NAME } from "@/lib/access";
import { createAccessSession, hasActiveSubscription } from "@/lib/database";

const claimSchema = z.object({
  email: z.string().email()
});

export async function POST(request: Request) {
  try {
    const rawBody = await request.json();
    const parsed = claimSchema.parse(rawBody);

    const hasAccess = await hasActiveSubscription(parsed.email);

    if (!hasAccess) {
      return NextResponse.json(
        {
          error:
            "No active subscription found for that email yet. If you just paid, wait one minute and try again."
        },
        { status: 404 }
      );
    }

    const token = await createAccessSession(parsed.email);

    const response = NextResponse.json({
      success: true,
      message: "Access unlocked. Redirecting to dashboard."
    });

    response.cookies.set({
      name: ACCESS_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30
    });

    return response;
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Enter a valid email." }, { status: 400 });
    }

    const message =
      error instanceof Error ? error.message : "Could not verify subscription.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
