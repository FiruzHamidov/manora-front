import type { Property } from '@/services/properties/types';
import type { User } from '@/services/login/types';

export type CrmRequestType = 'lead_request' | 'showing_request' | 'selection_event';
export type CrmRequestPriority = 'low' | 'normal' | 'high';
export type CrmRequestStatus = 'new' | 'in_progress' | 'processed' | 'closed';

export type LaravelPaginationLink = {
  url: string | null;
  label: string;
  active: boolean;
};

export type LaravelPaginator<T> = {
  current_page: number;
  data: T[];
  first_page_url: string;
  from: number | null;
  last_page: number;
  last_page_url: string;
  links: LaravelPaginationLink[];
  next_page_url: string | null;
  path: string;
  per_page: number;
  prev_page_url: string | null;
  to: number | null;
  total: number;
};

export type CrmStage = {
  id: number;
  name: string;
  slug: string;
  system_key: string | null;
  color: string | null;
  sort_order: number;
  is_active: boolean;
  is_terminal: boolean;
  requests_count: number;
};

export type CrmRelatedSelection = {
  id: number;
  title?: string | null;
  status?: string | null;
};

export type CrmRelatedBooking = {
  id: number;
  property_id?: number | null;
  property?: Property | null;
  agent?: User | null;
  client?: User | null;
};

export type CrmRequestItem = {
  id: number;
  type: CrmRequestType;
  status: CrmRequestStatus;
  stage_id: number | null;
  stage_position: number | null;
  priority: CrmRequestPriority;
  title: string | null;
  service_type: string | null;
  channel: string | null;
  name: string | null;
  phone: string | null;
  email: string | null;
  source: string | null;
  source_url: string | null;
  comment: string | null;
  internal_note: string | null;
  created_by: number | null;
  assigned_to: number | null;
  property_id: number | null;
  selection_id: number | null;
  booking_id: number | null;
  last_event_at: string | null;
  processed_at: string | null;
  closed_at: string | null;
  context: Record<string, unknown> | null;
  payload: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
  stage?: CrmStage | null;
  creator?: User | null;
  assignee?: User | null;
  property?: Property | null;
  selection?: CrmRelatedSelection | null;
  booking?: CrmRelatedBooking | null;
};

export type CrmRequestsResponse = {
  items: LaravelPaginator<CrmRequestItem>;
  stages: CrmStage[];
};

export type CrmRequestsFilters = {
  stage_id?: number;
  status?: CrmRequestStatus;
  type?: CrmRequestType;
  priority?: CrmRequestPriority;
  assigned_to?: 'me' | number;
  unassigned?: 1;
  search?: string;
  per_page?: number;
};

export type UpdateCrmRequestPayload = {
  stage_id?: number;
  priority?: CrmRequestPriority;
  assigned_to?: number | null;
  internal_note?: string;
};

export type MoveCrmRequestPayload = {
  stage_id: number;
  position?: number;
};

export type CreateCrmStagePayload = {
  name: string;
  slug?: string;
  color?: string;
  sort_order?: number;
  is_active?: boolean;
  is_terminal?: boolean;
};

export type UpdateCrmStagePayload = {
  name?: string;
  slug?: string;
  color?: string | null;
  sort_order?: number;
  is_active?: boolean;
  is_terminal?: boolean;
};

export type ReorderCrmStagesPayload = {
  stage_ids: number[];
};
