import type { Branch } from '@/services/branches/types';

export interface Agent {
  id: number;
  name: string;
  email: string;
  phone: string;
  role_id: number;
  branch_id: number | null;
  status: string;
  auth_method: string;
  photo: string;
  created_at: string;
  updated_at: string;
  role: Role;
  branch?: Branch;
}

export type DeleteUserPayload = {
  id: number;
  distribute_to_agents: boolean;
  agent_id?: number | null;
};


export interface Role {
  id: number;
  name: string;
  slug: string;
  description: string;
  created_at: string;
  updated_at: string;
}

export type UserDto = {
  password: string;
  id: number;
  name: string;
  phone: string;
  email: string;
  role_id: number;
  branch_id: number | null;
  role?: Role;
  branch?: Branch;
  description?: string;
  birthday?: string; // 'YYYY-MM-DD'
  photo?: string;
  auth_method?: 'password' | 'sms';
  status?: string;
};

export type CreateUserPayload = {
  name: string;
  phone: string;
  email: string;
  description?: string;
  birthday?: string;
  role_id: number;
  branch_id?: number | null;
  auth_method: 'password' | 'sms';
  password?: string;
};

export type PasswordChangePayload = {
  current_password: string;
  new_password: string;
  new_password_confirmation: string;
};

export type UpdateUserPayload = Partial<Omit<CreateUserPayload, 'auth_method'>> & {
  id: number;
};
