import { useRouter } from "next/navigation";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { authApi } from "./api";
import {
  AuthState,
  AuthStateCode,
  AuthStateResponse,
  CompleteProfilePayload,
  LoginResponse,
  ProfileUpdateRequest,
  RegisterRequest,
} from "./types";
import { useEffect, useState } from "react";

// Cookie expiration time (7 days in seconds)
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

// eslint-disable-next-line
function setAuthCookies(token: string, user: any) {
  if (typeof window !== "undefined") {
    const config = getCookieConfig();
    const hostOnlySuffix = `${config.path}${config.maxAge}${config.sameSite}${config.secure}`;
    const domainSuffix = config.domain
      ? `${config.path}${config.maxAge}${config.sameSite}${config.domain}${config.secure}`
      : "";

    const userDataString = encodeURIComponent(
      JSON.stringify({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role?.slug || "user",
      })
    );

    // Set both host-only and domain-scoped cookies to avoid prod mismatches
    // between apex/subdomain requests and client-side reads.
    document.cookie = `auth_token=${token}${hostOnlySuffix}`;
    document.cookie = `user_data=${userDataString}${hostOnlySuffix}`;

    if (domainSuffix) {
      document.cookie = `auth_token=${token}${domainSuffix}`;
      document.cookie = `user_data=${userDataString}${domainSuffix}`;
    }

    // console.log("✅ Cookies set:", {
    //   hasToken: document.cookie.includes("auth_token"),
    //   hasUserData: document.cookie.includes("user_data"),
    // });
  }
}

function clearAuthCookies() {
  if (typeof window !== "undefined") {
    const config = getCookieConfig();
    const expiry = "; expires=Thu, 01 Jan 1970 00:00:01 GMT";
    const domainValue = config.domain.replace(/^; domain=/, "");

    document.cookie = `auth_token=${expiry}; path=/`;
    document.cookie = `user_data=${expiry}; path=/`;

    if (domainValue) {
      document.cookie = `auth_token=${expiry}; path=/; domain=${domainValue}`;
      document.cookie = `user_data=${expiry}; path=/; domain=${domainValue}`;
    }
  }
}

export const hasAuthToken = (): boolean => {
  if (typeof window === "undefined") return false;
  return document.cookie.split(";").some((cookie) =>
    cookie.trim().startsWith("auth_token=")
  );
};

// eslint-disable-next-line
function getUserFromCookie(): any | null {
  if (typeof window !== "undefined") {
    const cookies = document.cookie.split(";");
    const userCookie = cookies.find((cookie) =>
      cookie.trim().startsWith("user_data=")
    );

    if (userCookie) {
      try {
        const userData = userCookie.slice(userCookie.indexOf("=") + 1);
        return JSON.parse(decodeURIComponent(userData));
      } catch (error) {
        console.error("Error parsing user cookie:", error);

        clearAuthCookies();
        return null;
      }
    }
  }
  return null;
}

export const useSendSmsMutation = () => {
  return useMutation({
    mutationFn: authApi.sendSms,
  });
};

const AUTH_ROUTES_BY_CODE: Record<AuthStateCode, string> = {
  OK: "/",
  PROFILE_REQUIRED: "/complete-profile",
  PENDING_MODERATION: "/auth/pending",
  REJECTED: "/auth/rejected",
  INACTIVE: "/auth/inactive",
};

export const resolveAuthRouteByCode = (code?: AuthStateCode): string => {
  if (!code) return "/";
  return AUTH_ROUTES_BY_CODE[code] ?? "/";
};

const applyAuthSuccess = (
  data: LoginResponse | AuthStateResponse,
  queryClient: ReturnType<typeof useQueryClient>,
  router: ReturnType<typeof useRouter>
) => {
  const token = "token" in data ? data.token : undefined;
  const user = data.user;
  const authState = data.auth_state as AuthState | undefined;

  if (token && user) {
    setAuthCookies(token, user);
  }

  if (user) {
    queryClient.setQueryData(["user"], user);
  }

  if (authState) {
    queryClient.setQueryData(["auth-state"], {
      user,
      auth_state: authState,
    });
  }

  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("close-login-modal"));
  }

  const route = resolveAuthRouteByCode(authState?.code || "OK");
  setTimeout(() => {
    router.replace(route);
    router.refresh();
  }, 100);
};

export const useVerifySmsMutation = () => {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: authApi.verifySms,
    onSuccess: (data) => {
      applyAuthSuccess(data, queryClient, router);
    },
  });
};

export const useLoginMutation = () => {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: authApi.login,
    onSuccess: (data) => {
      applyAuthSuccess(data, queryClient, router);
    },
  });
};

export const useRegisterMutation = () => {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: (payload: RegisterRequest) => authApi.register(payload),
    onSuccess: (data) => {
      applyAuthSuccess(data, queryClient, router);
    },
  });
};

export const useCompleteProfileMutation = () => {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: (payload: CompleteProfilePayload) => authApi.completeProfile(payload),
    onSuccess: (data) => {
      applyAuthSuccess(data, queryClient, router);
    },
  });
};

export const useLogoutMutation = () => {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: async () => {
      try {
        // Call the logout API endpoint
        await authApi.logout();
      } catch (error) {
        // console.error("Logout API error:", error);
        // Continue with local logout even if API fails
      }
    },
    onSuccess: () => {
      // Clear cookies
      clearAuthCookies();
      // Clear all query cache
      queryClient.clear();
      // Navigate to home
      router.push("/");
      // Force refresh to clear any cached auth state
      setTimeout(() => {
        window.location.href = "/";
      }, 100);
    },
    onError: (error) => {
      console.error("Logout error:", error);
      // Still clear local state even on error
      clearAuthCookies();
      queryClient.clear();
      router.push("/");
    },
  });
};

export const useProfile = () => {
  const [authResolved, setAuthResolved] = useState(false);

  useEffect(() => {
    setAuthResolved(true);
  }, []);

  return useQuery({
    queryKey: ["user"],
    queryFn: () => {
      const user = getUserFromCookie();
      const userId = user?.id ?? null;
      if (userId) {
        return authApi.getMe();
      }
      return null;
    },
    enabled: authResolved,
    retry: false,
  });
};

type AuthGateDecision = {
  code: AuthStateCode;
  route: string;
  authState?: AuthState;
  user?: AuthStateResponse["user"];
};

export const useAuthGate = (enabled: boolean = true) => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["auth-state"],
    queryFn: authApi.getAuthState,
    enabled: enabled && hasAuthToken(),
    retry: false,
    staleTime: 30_000,
  });

  useEffect(() => {
    const response = query.data;
    if (!response?.auth_state) return;

    queryClient.setQueryData(["user"], response.user);
  }, [query.data, queryClient]);

  const decision: AuthGateDecision | null = query.data?.auth_state
    ? {
        code: query.data.auth_state.code,
        route: resolveAuthRouteByCode(query.data.auth_state.code),
        authState: query.data.auth_state,
        user: query.data.user,
      }
    : null;

  return {
    ...query,
    decision,
  };
};

export const useUpdateProfileMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      userId,
      profileData,
    }: {
      userId: number;
      profileData: ProfileUpdateRequest;
    }) => authApi.updateProfile(userId, profileData),
    onSuccess: (data) => {
      queryClient.setQueryData(["user"], data);
      if (data) {
        // Update user cookie with new data
        setAuthCookies(
          document.cookie
            .split(";")
            .find((c) => c.includes("auth_token"))
            ?.split("=")[1] || "",
          data
        );
      }
    },
  });
};

export const useMe = useProfile;
