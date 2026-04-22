import { cookies } from "next/headers";
import { resolveAccessSessionEmail } from "@/lib/database";

export const ACCESS_COOKIE_NAME = "ig_access";

export async function getAccessContext() {
  const cookieStore = await cookies();
  const token = cookieStore.get(ACCESS_COOKIE_NAME)?.value;

  if (!token) {
    return { hasAccess: false as const, email: null };
  }

  let email: string | null = null;
  try {
    email = await resolveAccessSessionEmail(token);
  } catch {
    email = null;
  }

  return {
    hasAccess: Boolean(email) as boolean,
    email
  };
}
