'use client';

import { useQuery, useMutation, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { axios } from '@/utils/axios';
import type { BuildingEntrance, BuildingFloorPlan, ResidentialDrawing, UnitLayout } from './types';
import { isAxiosError } from 'axios';
import { invalidatePublicInventory } from './invalidate-public-inventory';
import { refreshManagedConflict } from './managed-conflict';

export interface StructurePage<T> { data: T[]; current_page: number; last_page: number; total: number }
export type StructurePayload = Record<string, string | number | boolean | null | undefined>;

export function useEntrances(buildingId: number, blockId?: number, page = 1) {
  return useQuery({ queryKey: ['residential-structure', buildingId, 'entrances', blockId, page],
    queryFn: async ({ signal }) => (await axios.get<StructurePage<BuildingEntrance>>(`/manage/new-buildings/${buildingId}/blocks/${blockId}/entrances`, { params: { page }, signal })).data,
    enabled: !!buildingId && !!blockId });
}

export function useLayouts(buildingId: number, page = 1, q = '') {
  return useQuery({ queryKey: ['residential-structure', buildingId, 'layouts', page, q],
    queryFn: async ({ signal }) => (await axios.get<StructurePage<UnitLayout>>(`/manage/new-buildings/${buildingId}/layouts`, { params: { page, q }, signal })).data,
    enabled: !!buildingId });
}

export function useFloorPlans(buildingId: number, blockId?: number, page = 1) {
  return useQuery({ queryKey: ['residential-structure', buildingId, 'floor-plans', blockId, page],
    queryFn: async ({ signal }) => (await axios.get<StructurePage<BuildingFloorPlan>>(`/manage/new-buildings/${buildingId}/floor-plans`, { params: { page, block_id: blockId }, signal })).data,
    enabled: !!buildingId });
}

export function useSaveStructure(buildingId: number, kind: 'entrances' | 'layouts' | 'floor-plans', blockId?: number) {
  const cache = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }: { id?: number; payload: StructurePayload }) => {
      const path = `/manage/new-buildings/${buildingId}/${kind === 'entrances' ? `blocks/${blockId}/entrances` : kind}`;
      return (id ? await axios.patch(`${path}/${id}`, payload) : await axios.post(path, payload)).data as BuildingEntrance | UnitLayout | BuildingFloorPlan;
    },
    onSuccess: () => invalidateStructure(cache, buildingId),
    onError: error => refreshManagedConflict(error, cache, buildingId),
  });
}

export type DrawingOwner = 'layouts' | 'floor-plans' | 'units';
const drawingPath = (building: number, kind: DrawingOwner, owner: number) => `/manage/new-buildings/${building}/${kind}/${owner}/drawings`;

export function useDrawings(buildingId: number, kind: DrawingOwner, ownerId: number) {
  return useQuery({ queryKey: ['residential-structure', buildingId, kind, ownerId, 'drawings'],
    queryFn: async ({ signal }) => {
      const response = await axios.get<ResidentialDrawing[]>(drawingPath(buildingId, kind, ownerId), { signal });
      return { images: response.data, version: Number(response.headers['x-inventory-version']) };
    }, staleTime: 60_000, enabled: !!buildingId && !!ownerId });
}

export function useChangeDrawing(buildingId: number, kind: DrawingOwner, ownerId: number) {
  const cache = useQueryClient();
  return useMutation({
    mutationFn: async (change: { action: 'upload' | 'delete' | 'metadata' | 'cover' | 'reorder'; version: number; id?: number; file?: File; alt?: string; caption?: string | null; order?: number[] }) => {
      const path = drawingPath(buildingId, kind, ownerId);
      if (change.action === 'upload') {
        const data = new FormData();
        data.append('version', String(change.version)); data.append('file', change.file!);
        data.append('alt', change.alt ?? ''); data.append('caption', change.caption ?? '');
        return axios.post(path, data);
      }
      if (change.action === 'delete') return axios.delete(`${path}/${change.id}`, { data: { version: change.version } });
      if (change.action === 'cover') return axios.post(`${path}/${change.id}/cover`, { version: change.version });
      if (change.action === 'reorder') return axios.put(`${path}/reorder`, { version: change.version, photo_order: change.order });
      return axios.patch(`${path}/${change.id}`, { version: change.version, alt: change.alt, caption: change.caption });
    },
    onSuccess: () => invalidateStructure(cache, buildingId),
    onError: error => refreshManagedConflict(error, cache, buildingId),
  });
}

export function structureError(error: unknown): string {
  if (!isAxiosError(error)) return 'Не удалось сохранить. Проверьте соединение и повторите.';
  if (error.response?.status === 409) return 'Запись изменилась. Введённые данные сохранены в форме. Сравните актуальную версию перед повторным редактированием.';
  return Object.values(error.response?.data?.errors ?? {}).flat().join(' ') || 'Операция недоступна. Проверьте права и состояние записи.';
}

async function invalidateStructure(cache: QueryClient, buildingId: number): Promise<void> {
  await Promise.all([
    cache.invalidateQueries({ queryKey: ['residential-structure', buildingId] }),
    cache.invalidateQueries({ queryKey: ['manage-new-buildings'] }),
    cache.invalidateQueries({ queryKey: ['new-buildings', buildingId] }),
    cache.invalidateQueries({ queryKey: ['catalog-new-buildings'] }),
    invalidatePublicInventory(cache, buildingId),
  ]);
}

export type GridSpace = { floor: number; position: number; kind: 'technical_floor' | 'empty_position' };
export type EntranceGridSpaces = { version: number; spaces: StructurePage<GridSpace> };
export function useEntranceGridSpaces(buildingId: number, blockId: number, entranceId: number, page = 1, floor?: number) {
  return useQuery({
    queryKey: ['residential-structure', buildingId, 'grid-spaces', blockId, entranceId, page, floor],
    queryFn: async ({ signal }) => (await axios.get<EntranceGridSpaces>('/manage/new-buildings/' + buildingId + '/blocks/' + blockId + '/entrances/' + entranceId + '/grid-spaces', { params: { page, floor }, signal })).data,
  });
}
export function useSaveGridSpace(buildingId: number, blockId: number, entranceId: number) {
  const cache = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { version: number; floor: number; position: number; kind: 'technical_floor' | 'empty_position' | 'unknown'; reason: string | null }) =>
      (await axios.put<{ version: number }>('/manage/new-buildings/' + buildingId + '/blocks/' + blockId + '/entrances/' + entranceId + '/grid-spaces', payload)).data,
    onSuccess: () => invalidateStructure(cache, buildingId),
    onError: error => refreshManagedConflict(error, cache, buildingId),
  });
}

export interface RegionUnit { id: number; number: string | null; name: string; floor: number | null; entrance_id: number | null; publication_status: string; region?: { id: number; unit_id: number; drawing_id: number; points: ImagePoint[] } | null }
export type ImagePoint = [number, number];
export interface FloorRegion { id: number; unit_id: number; drawing_id: number; points: ImagePoint[]; unit: RegionUnit }
export interface FloorRegions { version: number; image: Pick<ResidentialDrawing, 'id' | 'url' | 'alt' | 'width' | 'height'> | null; regions: StructurePage<FloorRegion> }

export function useFloorRegions(buildingId: number, planId: number, page = 1) {
  return useQuery({ queryKey: ['residential-structure', buildingId, 'floor-plans', planId, 'regions', page],
    queryFn: async ({ signal }) => (await axios.get<FloorRegions>(`/manage/new-buildings/${buildingId}/floor-plans/${planId}/regions`, { params: { page }, signal })).data,
    enabled: !!buildingId && !!planId });
}

export function useRegionCandidates(buildingId: number, planId: number, page = 1, q = '', floor = '') {
  return useQuery({ queryKey: ['residential-structure', buildingId, 'floor-plans', planId, 'candidates', page, q, floor],
    queryFn: async ({ signal }) => (await axios.get<StructurePage<RegionUnit>>(`/manage/new-buildings/${buildingId}/floor-plans/${planId}/region-candidates`, { params: { page, q, floor: floor || undefined }, signal })).data,
    enabled: !!buildingId && !!planId });
}

export function useSaveFloorRegion(buildingId: number, planId: number) {
  const cache = useQueryClient();
  return useMutation({
    mutationFn: async (data: { unitId: number; version: number; drawingId?: number; points?: ImagePoint[]; remove?: boolean }) => {
      const url = `/manage/new-buildings/${buildingId}/floor-plans/${planId}/regions/${data.unitId}`;
      return data.remove ? axios.delete(url, { data: { version: data.version } }) : axios.put(url, { version: data.version, drawing_id: data.drawingId, points: data.points });
    }, onSuccess: () => invalidateStructure(cache, buildingId),
    onError: error => refreshManagedConflict(error, cache, buildingId),
  });
}
