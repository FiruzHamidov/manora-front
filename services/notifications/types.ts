export type NotificationActor = {
  id: number;
  name: string;
  role_slug?: string | null;
} | null;

export type NotificationItem = {
  id: number;
  type: string;
  category: string;
  status: string;
  priority: string;
  title: string;
  body: string;
  action_url?: string | null;
  action_type?: string | null;
  occurrences_count: number;
  last_occurred_at?: string | null;
  read_at?: string | null;
  created_at?: string | null;
  actor: NotificationActor;
  data: Record<string, unknown>;
};

export type NotificationsResponse = {
  current_page: number;
  data: NotificationItem[];
  last_page: number;
  per_page: number;
  total: number;
};

export type DeviceToken = {
  id: number;
  user_id: number;
  platform: 'ios' | 'android';
  token: string;
  is_active: boolean;
};

export type RegisterDeviceTokenPayload = {
  platform: 'ios' | 'android';
  token: string;
  device_id?: string;
  app_version?: string;
  locale?: string;
};
