export const ACCESS_COOKIE = "igt_access";

type CookieStoreLike = {
  get: (name: string) => { value: string } | undefined;
};

export function hasPaidAccess(cookiesStore: CookieStoreLike): boolean {
  return cookiesStore.get(ACCESS_COOKIE)?.value === "active";
}
