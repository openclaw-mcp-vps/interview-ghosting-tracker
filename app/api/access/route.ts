import { NextRequest, NextResponse } from "next/server";
import { ACCESS_COOKIE } from "@/lib/access";
import { hasActiveSubscription } from "@/lib/database";

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: 60 * 60 * 24 * 30
};

export async function POST(request: NextRequest) {
  const contentType = request.headers.get("content-type") ?? "";
  let email = "";

  if (contentType.includes("application/json")) {
    const body = (await request.json()) as { email?: string };
    email = body.email ?? "";
  } else {
    const formData = await request.formData();
    const emailField = formData.get("email");
    email = typeof emailField === "string" ? emailField : "";
  }

  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  const isActive = await hasActiveSubscription(normalizedEmail);

  if (!isActive) {
    if (contentType.includes("application/json")) {
      return NextResponse.json({ error: "No active subscription found for this email" }, { status: 404 });
    }

    return NextResponse.redirect(new URL("/dashboard?unlock=not-found", request.url));
  }

  if (contentType.includes("application/json")) {
    const response = NextResponse.json({ success: true });
    response.cookies.set({
      name: ACCESS_COOKIE,
      value: "active",
      ...cookieOptions
    });
    return response;
  }

  const response = NextResponse.redirect(new URL("/dashboard?unlock=success", request.url));
  response.cookies.set({
    name: ACCESS_COOKIE,
    value: "active",
    ...cookieOptions
  });

  return response;
}
