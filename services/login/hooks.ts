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
import {
  clearStoredAuth,
  getStoredUser,
  hasStoredAuthToken,
  setStoredAuthSession,
  setStoredUser,
} from "./storage";

export const hasAuthToken = (): boolean => {
  return hasStoredAuthToken();
};

export const useSendSmsMutation = () => {
  return useMutation({
    mutationFn: authApi.sendSms,
  });
};

const AUTH_ROUTES_BY_CODE: Record<AuthStateCode, string> = {
  OK: "/profile",
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
  router: ReturnType<typeof useRouter>,
  options?: {
    redirect?: boolean;
    onSuccess?: (payload: LoginResponse | AuthStateResponse) => void;
  }
) => {
  const token = "token" in data ? data.token : undefined;
  const user = data.user;
  const authState = data.auth_state as AuthState | undefined;

  if (token && user) {
    setStoredAuthSession(token, user);
  } else if (user) {
    setStoredUser(user);
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

  options?.onSuccess?.(data);

  if (options?.redirect === false) {
    return;
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

export const usePasswordLoginMutation = useLoginMutation;

export const useRegisterMutation = (options?: {
  redirect?: boolean;
  onSuccess?: (payload: LoginResponse) => void;
}) => {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: (payload: RegisterRequest) => authApi.register(payload),
    onSuccess: (data) => {
      applyAuthSuccess(data, queryClient, router, {
        redirect: options?.redirect,
        onSuccess: (payload) => options?.onSuccess?.(payload as LoginResponse),
      });
    },
  });
};

export const useCompleteProfileMutation = (options?: {
  redirect?: boolean;
  onSuccess?: (payload: AuthStateResponse) => void;
}) => {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: (payload: CompleteProfilePayload) => authApi.completeProfile(payload),
    onSuccess: (data) => {
      applyAuthSuccess(data, queryClient, router, {
        redirect: options?.redirect,
        onSuccess: (payload) => options?.onSuccess?.(payload as AuthStateResponse),
      });
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
      clearStoredAuth();
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
      clearStoredAuth();
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
      const user = getStoredUser();
      const userId = user?.id ?? null;
      if (userId || hasStoredAuthToken()) {
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
    setStoredUser(response.user);
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
        setStoredUser(data);
      }
    },
  });
};

export const useMe = useProfile;
