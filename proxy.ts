// proxy.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { AUTH_REQUIRED_ROUTES } from "./constants/routes";
import { API_BASE_URL } from "./config/api";
import { RESIDENTIAL_V2_ENABLED, residentialV2OnlyPath, residentialRolloutUnavailableHtml } from './services/new-buildings/rollout';
import { publicUnitPreflight, unitFailureHtml, publicBuildingPreflight, buildingFailureHtml } from "./services/new-buildings/public-unit-preflight";
import {
  canAccessAdminPath,
  getRoleSlugFromUserDataCookie,
} from "./constants/roles";

function getRoleFromCookie(request: NextRequest): string | null {
  const raw = request.cookies.get("user_data")?.value;
  const role = getRoleSlugFromUserDataCookie(raw);
  return role === "guest" ? null : role;
}

function privateResponse(response: NextResponse): NextResponse {
  response.headers.set('X-Robots-Tag', 'noindex, nofollow');
  response.headers.set('Cache-Control', 'private, no-store');
  return response;
}

export async function proxy(request: NextRequest) {
  const { nextUrl, cookies } = request;

  if (!RESIDENTIAL_V2_ENABLED && residentialV2OnlyPath(nextUrl.pathname)) {
    return new NextResponse(residentialRolloutUnavailableHtml(), { status: 503, headers: {
      'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'private, no-store', 'X-Robots-Tag': 'noindex', 'Retry-After': '60',
    } });
  }

  const unitStatus = RESIDENTIAL_V2_ENABLED ? await publicUnitPreflight(API_BASE_URL, nextUrl.pathname, nextUrl.searchParams.get('source')) : null;
  const buildingStatus = RESIDENTIAL_V2_ENABLED && unitStatus === null ? await publicBuildingPreflight(API_BASE_URL, nextUrl.pathname, nextUrl.searchParams.get('source')) : null;
  const status = unitStatus ?? buildingStatus;
  if (status === 404 || status === 503) {
    const response = new NextResponse(unitStatus === null ? buildingFailureHtml(status) : unitFailureHtml(status), { status });
    response.headers.set('Content-Type', 'text/html; charset=utf-8');
    response.headers.set('Cache-Control', 'private, no-store');
    response.headers.set('X-Robots-Tag', 'noindex');
    if (status === 503) response.headers.set('Retry-After', '60');
    return response;
  }

  const authToken = cookies.get("auth_token")?.value;
  const isProtected = AUTH_REQUIRED_ROUTES.some((p) =>
    nextUrl.pathname.startsWith(p)
  );
  if (isProtected && !authToken) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", nextUrl.pathname);
    return privateResponse(NextResponse.redirect(loginUrl));
  }

  if (nextUrl.pathname.startsWith("/admin")) {
    const role = getRoleFromCookie(request);
    if (!canAccessAdminPath(nextUrl.pathname, role)) {
      return privateResponse(NextResponse.redirect(new URL("/profile", request.url)));
    }
  }

  const response = NextResponse.next();
  return isProtected || nextUrl.pathname === '/favorites' ? privateResponse(response) : response;
}

export const config = {
  matcher: [
    "/profile/:path*",
    "/favorites",
    "/dashboard/:path*",
    "/admin/:path*",
    "/new-buildings/:path*",
    "/comparison/units/:path*",
  ],
};
