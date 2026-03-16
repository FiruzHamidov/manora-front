import { axios } from "@/utils/axios";
import {
  ApiErrorResponse,
  AuthStateResponse,
  CompleteProfilePayload,
  FieldErrors,
  LoginRequest,
  RegisterRequest,
  SmsRequest,
  SmsVerifyRequest,
  LoginResponse,
  User,
  ProfileUpdateRequest,
} from "./types";

export const authApi = {
  sendSms: async (data: SmsRequest): Promise<{ success: boolean; message: string }> => {
    const { data: response } = await axios.post<{ success: boolean; message: string }>(
      "/sms/request",
      {
        ...data,
        phone: data.phone.trim().replace(/^\+992/, ""),
      }
    );
    return response;
  },

  verifySms: async (data: SmsVerifyRequest): Promise<LoginResponse> => {
    const { data: response } = await axios.post<LoginResponse>(
      "/sms/verify",
      {
        ...data,
        phone: data.phone.trim().replace(/^\+992/, ""),
      }
    );
    return response;
  },

  login: async (data: LoginRequest): Promise<LoginResponse> => {
    const { data: response } = await axios.post<LoginResponse>(
      "/login",
      {
        ...data,
        phone: data.phone.trim().replace(/^\+992/, ""),
      }
    );
    return response;
  },

  register: async (data: RegisterRequest): Promise<LoginResponse> => {
    const { data: response } = await axios.post<LoginResponse>("/register", data);
    return response;
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
  if (maybeError?.response?.status === 422 && maybeError.response.data?.errors) {
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
  const firstFieldError = payload?.errors
    ? Object.values(payload.errors).flat()[0]
    : undefined;

  if (typeof firstFieldError === "string" && firstFieldError.length > 0) {
    return firstFieldError;
  }

  if (payload?.message) {
    return payload.message;
  }

  if (status === 401) return "Сессия недействительна. Войдите снова.";
  if (status === 403) return "У вас нет доступа к этому действию.";
  if (status === 422) return "Проверьте заполнение полей формы.";
  if (status && status >= 500) return "Ошибка сервера. Попробуйте позже.";

  return fallback;
};
