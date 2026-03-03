import type { Branch } from '@/services/branches/types';

export interface LoginRequest {
  phone: string;
  password: string;
}

export interface SmsRequest {
  phone: string;
}

export interface SmsVerifyRequest {
  phone: string;
  code: string;
}

export interface LoginResponse {
  success?: boolean;
  message?: string;
  user?: User;
  token?: string;
  requires_verification?: boolean;
  auth_state?: AuthState;
}

export type AuthStateCode =
  | "OK"
  | "PROFILE_REQUIRED"
  | "PENDING_MODERATION"
  | "REJECTED"
  | "INACTIVE";

export type AccountType = "user" | "realtor" | "developer" | null;
export type OnboardingStatus =
  | "required"
  | "pending_review"
  | "completed"
  | "rejected";
export type VerificationStatus = "none" | "pending" | "approved" | "rejected";

export interface AuthState {
  code: AuthStateCode;
  http_status: 200 | 202 | 403 | 428;
  account_type: AccountType;
  onboarding_status: OnboardingStatus;
  verification_status: VerificationStatus;
  required_fields: string[];
  message: string;
}

export interface AuthStateResponse {
  user: User;
  auth_state: AuthState;
}

export interface Role {
  id: number;
  name: string;
  slug: string;
  description: string;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: number;
  name: string;
  description: string;
  email: string;
  phone: string;
  photo?: string;
  role_id: number;
  branch_id: number | null;
  status: string;
  auth_method: string;
  birthday: string;
  created_at: string;
  updated_at: string;
  role?: Role;
  branch?: Branch;
}

export interface ProfileUpdateRequest {
  firstName?: string;
  lastName?: string;
  birthday?: string;
  phone?: string;
  email?: string;
}

export interface RegisterRequest {
  phone: string;
  password?: string;
  name?: string;
  email?: string;
}

export interface CompleteProfilePayload {
  account_type: Exclude<AccountType, null>;
  name: string;
  email?: string | null;
  description?: string | null;
  birthday?: string | null;
  company_name?: string | null;
  license_number?: string | null;
}

export type FieldErrors = Record<string, string[]>;

export type AuthMode = "sms" | "password";
