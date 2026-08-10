import { axios } from "@/utils/axios";
import {
  ApiErrorResponse,
  AuthStateResponse,
  CompleteProfilePayload,
  FieldErrors,
  LoginRequest,
  RegisterRequest,
  SmsRequest,
  SmsRequestResponse,
  SmsVerifyRequest,
  LoginResponse,
  PasswordForgotRequest,
  PasswordForgotResponse,
  PasswordVerifyRequest,
  PasswordVerifyResponse,
  PasswordResetRequest,
  PasswordResetResponse,
  User,
  ProfileUpdateRequest,
} from "./types";
import {
  normalizePhoneForApi,
  PASSWORD_RECOVERY_ENDPOINTS,
} from './password-recovery';

export const authApi = {
  sendSms: async (data: SmsRequest): Promise<SmsRequestResponse> => {
    const { data: response } = await axios.post<SmsRequestResponse>(
      "/sms/request",
      {
        ...data,
        phone: normalizePhoneForApi(data.phone),
      }
    );
    return response;
  },

  verifyLoginSms: async (data: SmsVerifyRequest): Promise<LoginResponse> => {
    const { data: response } = await axios.post<LoginResponse>(
      "/sms/verify",
      {
        ...data,
        phone: normalizePhoneForApi(data.phone),
      }
    );
    return response;
  },

  verifyRegistrationSms: async (
    data: SmsVerifyRequest
  ): Promise<LoginResponse> => {
    const { data: response } = await axios.post<LoginResponse>(
      "/sms/register",
      {
        code: data.code,
        phone: normalizePhoneForApi(data.phone),
      }
    );
    return response;
  },

  login: async (data: LoginRequest): Promise<LoginResponse> => {
    const { data: response } = await axios.post<LoginResponse>(
      "/login",
      {
        ...data,
        phone: normalizePhoneForApi(data.phone),
      }
    );
    return response;
  },

  register: async (data: RegisterRequest): Promise<LoginResponse> => {
    const { data: response } = await axios.post<LoginResponse>("/register", {
      ...data,
      phone: normalizePhoneForApi(data.phone),
    });
    return response;
  },

  requestPasswordReset: async (
    payload: PasswordForgotRequest
  ): Promise<PasswordForgotResponse> => {
    const { data } = await axios.post<PasswordForgotResponse>(
      PASSWORD_RECOVERY_ENDPOINTS.forgot,
      { ...payload, phone: normalizePhoneForApi(payload.phone) }
    );
    return data;
  },

  verifyPasswordReset: async (
    payload: PasswordVerifyRequest
  ): Promise<PasswordVerifyResponse> => {
    const { data } = await axios.post<PasswordVerifyResponse>(
      PASSWORD_RECOVERY_ENDPOINTS.verify,
      { ...payload, phone: normalizePhoneForApi(payload.phone) }
    );
    return data;
  },

  resetPassword: async (
    payload: PasswordResetRequest
  ): Promise<PasswordResetResponse> => {
    const { data } = await axios.post<PasswordResetResponse>(
      PASSWORD_RECOVERY_ENDPOINTS.reset,
      { ...payload, phone: normalizePhoneForApi(payload.phone) }
    );
    return data;
  },

  logout: async (): Promise<void> => {
    try {
      await axios.post("/logout");
    } catch (error) {
      console.error("Logout API call failed:", error);
      throw error;
    }
  },

  getAuthState: async (): Promise<AuthStateResponse> => {
    const { data } = await axios.get<AuthStateResponse>("/auth/state");
    return data;
  },

  completeProfile: async (
    payload: CompleteProfilePayload
  ): Promise<AuthStateResponse> => {
    const { data } = await axios.post<AuthStateResponse>("/auth/complete-profile", payload);
    return data;
  },

  getMe: async (): Promise<User> => {
    const { data } = await axios.get<AuthStateResponse | User>("/user/profile");

    // New contract: { user, auth_state }
    if (
      data &&
      typeof data === "object" &&
      "user" in (data as AuthStateResponse) &&
      (data as AuthStateResponse).user
    ) {
      return (data as AuthStateResponse).user;
    }

    // Backward-compatible shape: raw user object
    if (data && typeof data === "object" && "id" in (data as User)) {
      return data as User;
    }

    throw new Error("Invalid /user/profile response shape");
  },

  getProfile: async (userId: number): Promise<User> => {
    const { data } = await axios.get<AuthStateResponse | User>(`/user/${userId}`);
    if ("user" in (data as AuthStateResponse)) {
      return (data as AuthStateResponse).user;
    }
    return data as User;
  },

  updateProfile: async (
    userId: number,
    profileData: ProfileUpdateRequest
  ): Promise<User> => {
    const { data } = await axios.put<User>(`/user/${userId}`, profileData);
    return data;
  },
};

export const extractFieldErrors = (error: unknown): FieldErrors => {
  const maybeError = error as {
    response?: { status?: number; data?: { errors?: FieldErrors } };
  };
  if (maybeError?.response?.data?.errors) {
    return maybeError.response.data.errors;
  }
  return {};
};

export const extractApiErrorMessage = (
  error: unknown,
  fallback: string
): string => {
  const maybeError = error as {
    response?: { status?: number; data?: ApiErrorResponse };
  };
  const status = maybeError?.response?.status;
  const payload = maybeError?.response?.data;

  if (payload?.message) {
    return payload.message;
  }

  if (status === 401) return "Сессия недействительна. Войдите снова.";
  if (status === 403) return "У вас нет доступа к этому действию.";
  if (status === 422) return "Проверьте заполнение полей формы.";
  if (status && status >= 500) return "Ошибка сервера. Попробуйте позже.";

  return fallback;
};
