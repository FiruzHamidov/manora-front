// proxy.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { AUTH_REQUIRED_ROUTES } from "./constants/routes";
import { canAccessAdminPath } from "./constants/roles";

function getRoleFromCookie(request: NextRequest): string | null {
  const raw = request.cookies.get("user_data")?.value;
  if (!raw) return null;

  try {
    const parsed = JSON.parse(decodeURIComponent(raw)) as { role?: string };
    return typeof parsed?.role === "string" ? parsed.role : null;
  } catch {
    return null;
  }
}

export function proxy(request: NextRequest) {
  const { nextUrl, cookies } = request;

  // Конвертируем POST от Bitrix в GET
  if (
    request.method === "POST" &&
    nextUrl.pathname.startsWith("/properties-widget")
  ) {
    return NextResponse.redirect(nextUrl, 303);
  }

  const authToken = cookies.get("auth_token")?.value;
  const isProtected = AUTH_REQUIRED_ROUTES.some((p) =>
    nextUrl.pathname.startsWith(p)
  );
  if (isProtected && !authToken) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (nextUrl.pathname.startsWith("/admin")) {
    const role = getRoleFromCookie(request);
    if (!canAccessAdminPath(nextUrl.pathname, role)) {
      return NextResponse.redirect(new URL("/profile", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/properties-widget", // важно: чтобы сработал 303
    "/profile/:path*",
    "/favorites",
    "/dashboard/:path*",
    "/admin/:path*",
  ],
};
