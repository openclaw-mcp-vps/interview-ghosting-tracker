import { NextRequest, NextResponse } from "next/server";
import { hasPaidAccess } from "@/lib/database";
import { ACCESS_COOKIE_NAME, createAccessCookieValue } from "@/lib/lemonsqueezy";

export const runtime = "nodejs";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function safeRedirectPath(value: string | null): string {
  if (!value) return "/dashboard";
  if (!value.startsWith("/")) return "/dashboard";
  return value;
}

function redirectWithStatus(request: NextRequest, redirectPath: string, status: string) {
  const url = new URL(redirectPath, request.url);
  url.searchParams.set("status", status);
  return NextResponse.redirect(url);
}

export async function POST(request: NextRequest) {
  const contentType = request.headers.get("content-type") || "";

  let email = "";
  let redirectTo: string | null = null;

  if (contentType.includes("application/json")) {
    const body = (await request.json().catch(() => null)) as { email?: string; redirectTo?: string } | null;
    email = body?.email?.trim().toLowerCase() || "";
    redirectTo = body?.redirectTo || null;
  } else {
    const formData = await request.formData();
    email = String(formData.get("email") || "").trim().toLowerCase();
    redirectTo = String(formData.get("redirectTo") || "") || null;
  }

  const redirectPath = safeRedirectPath(redirectTo);

  if (!emailRegex.test(email)) {
    return redirectWithStatus(request, redirectPath, "invalid-email");
  }

  const paid = await hasPaidAccess(email);

  if (!paid) {
    return redirectWithStatus(request, redirectPath, "not-found");
  }

  const response = redirectWithStatus(request, redirectPath, "unlocked");
  response.cookies.set({
    name: ACCESS_COOKIE_NAME,
    value: createAccessCookieValue(email),
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 31
  });

  return response;
}
