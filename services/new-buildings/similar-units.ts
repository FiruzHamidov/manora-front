import type { UnitCard } from './unit-selection';

export type SimilarStage = {
  key: string; scope: 'building' | 'city'; area_percent: number; price_percent: number;
  area_range: [string, string] | null; price_range: [string, string] | null; shown_count: number;
};
export type SimilarUnits = {
  data: (UnitCard & { building: { id: number; title: string; city: string | null }; similarity_stage: string })[];
  meta: { building_id: number; unit_id: number; limit: number; returned_count: number; rooms: number | null;
    city: string | null; insufficient_data: boolean; stages: SimilarStage[]; missing_criteria: ('rooms' | 'area' | 'price' | 'city')[]; as_of: string };
};
