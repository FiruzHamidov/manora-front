export type ReelContentType = 'property' | 'car' | 'developer' | 'generic';
export type ReelSourceType = ReelContentType;
export type ReelStatus = 'draft' | 'uploading' | 'processing' | 'published' | 'archived' | 'blocked';
export type ReelTranscodeStatus = 'pending' | 'processing' | 'completed' | 'failed';

export type ReelScene = {
  start_second: number;
  end_second: number;
  visual: string;
  voiceover: string;
  onscreen_text: string;
};

export type ReelSourceData = Record<string, unknown> & {
  title?: string;
  description?: string;
  hook?: string;
  image?: string;
  image_url?: string;
  preview_image?: string;
  thumbnail?: string;
  thumbnail_url?: string;
};

export type ReelPlayback = {
  hls_url?: string | null;
  mp4_url?: string | null;
  video_url?: string | null;
  video_public_url?: string | null;
  preview_image?: string | null;
  preview_image_url?: string | null;
  thumbnail_url?: string | null;
  thumbnail_public_url?: string | null;
};

export type Reel = {
  id: number;
  source_type?: ReelSourceType | null;
  source_id?: number | null;
  listing_id?: number | null;
  reelable_type?: string | null;
  reelable_id?: number | null;
  created_by?: number | null;
  creator?: {
    id?: number;
    name?: string | null;
    avatar?: string | null;
    avatar_url?: string | null;
  } | null;
  content_type: ReelContentType;
  status?: ReelStatus | string | null;
  transcode_status?: ReelTranscodeStatus | string | null;
  language?: string | null;
  tone?: string | null;
  title?: string | null;
  description?: string | null;
  views_count?: number | null;
  likes_count?: number | null;
  is_liked?: boolean | null;
  can_publish?: boolean | null;
  is_featured?: boolean | null;
  sort_order?: number | null;
  duration: number;
  poster_second?: number | null;
  aspect_ratio?: string | null;
  hook?: string | null;
  scenes: ReelScene[];
  cta?: string | null;
  source_data?: ReelSourceData | null;
  moderation_comment?: string | null;
  moderation_reason?: string | null;
  moderated_by?: number | null;
  moderated_at?: string | null;
  published_at?: string | null;
  playback?: ReelPlayback | null;
  created_at?: string;
  updated_at?: string;
};

export type ReelFilters = {
  content_type?: ReelContentType | '';
  source_type?: ReelSourceType | '';
  source_id?: number | string | '';
  page?: number | string;
  per_page?: number | string;
  status?: ReelStatus | string | '';
};

export type ReelsListResponse = Reel[] | {
  data?: Reel[];
  items?: Reel[];
  next_cursor?: string | null;
  current_page?: number;
  per_page?: number;
  total?: number;
};

export type CreateReelPayload =
  | {
      source_type: Exclude<ReelSourceType, 'generic'>;
      source_id: number;
      duration: number;
    }
  | {
      content_type: 'generic';
      duration: number;
      source_data: {
        title: string;
        description?: string;
        hook: string;
      };
    };

export type UpdateReelPayload = {
  content_type?: ReelContentType;
  language?: string;
  tone?: string;
  title?: string | null;
  description?: string | null;
  duration?: number;
  poster_second?: number | null;
  aspect_ratio?: string | null;
  hook?: string | null;
  scenes?: ReelScene[];
  cta?: string | null;
  source_data?: ReelSourceData | null;
};

export type ReelPublishStatus = 'published' | 'archived' | 'draft';
export type ReelModerationAction = 'block' | 'unblock' | 'archive';
