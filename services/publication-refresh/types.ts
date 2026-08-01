export type PublicationListingKind = 'property' | 'car';

export interface PublicationRefreshFields {
  id: number;
  moderation_status?: string;
  created_by?: number;
  created_at?: string | null;
  published_at?: string | null;
  publication_expires_at?: string | null;
  can_refresh_publication?: boolean;
  next_refresh_at?: string | null;
  refresh_available_in?: number | null;
}

export type PublicationRefreshResponse = PublicationRefreshFields &
  Record<string, unknown>;

export interface PublicationRefreshErrorDetails {
  status?: number;
  message: string;
  nextRefreshAt?: string;
  retryAfter?: number;
}
