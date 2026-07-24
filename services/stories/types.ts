export type StoryStatus = 'draft' | 'active' | 'archived' | 'hidden' | 'deleted';

export type StoryItem = {
  id: number;
  position: number;
  media_type: 'image' | 'video' | 'text';
  media_url?: string | null;
  thumbnail_url?: string | null;
  duration_sec?: number;
  duration_seconds?: number;
  text?: string | null;
  background_color?: string | null;
  link_url?: string | null;
  link_label?: string | null;
  is_seen?: boolean;
};

export type Story = {
  id: number;
  user_id: number;
  type: 'media' | 'property' | 'reel';
  status: StoryStatus;
  caption?: string | null;
  starts_at?: string | null;
  expires_at?: string | null;
  views_count: number;
  moderation_reason?: string | null;
  user?: {
    id: number;
    name?: string | null;
  } | null;
  author?: {
    id: number;
    name?: string | null;
    photo?: string | null;
    role?: {
      id?: number;
      name?: string;
      slug?: string;
    } | null;
  } | null;
  cover_url?: string | null;
  visibility?: 'public' | 'followers' | 'private';
  is_seen?: boolean;
  items_count?: number;
  source_type?: 'property' | 'car' | 'reel' | null;
  source_id?: number | null;
  items: StoryItem[];
  created_at?: string | null;
};

export type StoriesListResponse = {
  data?: Story[];
  current_page?: number;
  total?: number;
  meta?: {
    next_cursor?: string | null;
    has_more?: boolean;
  };
};
