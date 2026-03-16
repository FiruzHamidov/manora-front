"use client";

import { AUTH_TOKEN_STORAGE_KEY, AUTH_USER_STORAGE_KEY } from "@/config/api";
import type { User } from "./types";

const COOKIE_MAX_AGE = 7 * 24 * 60 * 60;

function normalizeCookieDomain(value?: string): string {
  if (!value) return "";

  return value
    .trim()
    .replace(/^https?:\/\//i, "")
    .replace(/\/.*$/, "");
}

function getCookieConfig() {
  const isProduction = process.env.NODE_ENV === "production";
  const cookieDomain = normalizeCookieDomain(
    process.env.NEXT_PUBLIC_COOKIE_DOMAIN
  );

  return {
    path: "; path=/",
    maxAge: `; max-age=${COOKIE_MAX_AGE}`,
    sameSite: "; SameSite=Lax",
    domain: isProduction && cookieDomain ? `; domain=${cookieDomain}` : "",
    secure: isProduction ? "; Secure" : "",
  };
}

function setCookie(name: string, value: string) {
  if (typeof document === "undefined") return;

  const config = getCookieConfig();
  const hostOnlySuffix = `${config.path}${config.maxAge}${config.sameSite}${config.secure}`;
  const domainSuffix = config.domain
    ? `${config.path}${config.maxAge}${config.sameSite}${config.domain}${config.secure}`
    : "";

  document.cookie = `${name}=${value}${hostOnlySuffix}`;
  if (domainSuffix) {
    document.cookie = `${name}=${value}${domainSuffix}`;
  }
}

function clearCookie(name: string) {
  if (typeof document === "undefined") return;

  const config = getCookieConfig();
  const expiry = "; expires=Thu, 01 Jan 1970 00:00:01 GMT";
  const domainValue = config.domain.replace(/^; domain=/, "");

  document.cookie = `${name}=${expiry}; path=/`;

  if (domainValue) {
    document.cookie = `${name}=${expiry}; path=/; domain=${domainValue}`;
  }
}

function getCookieValue(name: string): string | null {
  if (typeof document === "undefined") return null;

  const cookie = document.cookie
    .split(";")
    .find((entry) => entry.trim().startsWith(`${name}=`));

  if (!cookie) return null;

  return cookie.slice(cookie.indexOf("=") + 1).trim();
}

export function getStoredAuthToken(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  return (
    window.localStorage.getItem(AUTH_TOKEN_STORAGE_KEY) ||
    getCookieValue("auth_token")
  );
}

export function hasStoredAuthToken(): boolean {
  return Boolean(getStoredAuthToken());
}

export function setStoredAuthToken(token: string) {
  if (typeof window === "undefined") return;

  window.localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, token);
  setCookie("auth_token", token);
}

export function getStoredUser(): User | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw =
    window.localStorage.getItem(AUTH_USER_STORAGE_KEY) || getCookieValue("user_data");
  if (!raw) return null;

  try {
    return JSON.parse(decodeURIComponent(raw)) as User;
  } catch (error) {
    console.error("Error parsing stored auth user:", error);
    clearStoredAuth();
    return null;
  }
}

export function setStoredUser(user: User) {
  if (typeof window === "undefined") return;

  const serialized = JSON.stringify(user);
  window.localStorage.setItem(AUTH_USER_STORAGE_KEY, serialized);
  setCookie("user_data", encodeURIComponent(serialized));
}

export function setStoredAuthSession(token: string, user: User) {
  setStoredAuthToken(token);
  setStoredUser(user);
}

export function clearStoredAuth() {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
    window.localStorage.removeItem(AUTH_USER_STORAGE_KEY);
  }

  clearCookie("auth_token");
  clearCookie("user_data");
}
