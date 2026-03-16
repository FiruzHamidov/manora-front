export type ReelContentType = 'property' | 'car' | 'developer' | 'generic';
export type ReelSourceType = ReelContentType;

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
};

export type Reel = {
  id: number;
  reelable_type?: string | null;
  reelable_id?: number | null;
  created_by?: number | null;
  content_type: ReelContentType;
  language?: string | null;
  tone?: string | null;
  title?: string | null;
  description?: string | null;
  duration: number;
  poster_second?: number | null;
  aspect_ratio?: string | null;
  hook?: string | null;
  scenes: ReelScene[];
  cta?: string | null;
  source_data?: ReelSourceData | null;
  created_at?: string;
  updated_at?: string;
};

export type ReelFilters = {
  content_type?: ReelContentType | '';
  source_type?: ReelSourceType | '';
  source_id?: number | string | '';
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
