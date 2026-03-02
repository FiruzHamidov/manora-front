'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import { AxiosError } from 'axios';
import { Map, Placemark, YMaps } from '@pbe/react-yandex-maps';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { Input } from '@/ui-components/Input';
import { STORAGE_URL } from '@/constants/base-url';
import {
  useBranches,
  useCreateBranch,
  useDeleteBranch,
  useUpdateBranch,
} from '@/services/branches/hooks';
import type { Branch, BranchPayload } from '@/services/branches/types';
import showAxiosErrorToast from '@/utils/showAxiosErrorToast';
import { toast } from 'react-toastify';

type FormState = {
  name: string;
  lat: string;
  lng: string;
  landmark: string;
};

type GeoObject = {
  getAddressLine: () => string;
};

type GeocoderResult = {
  geoObjects: {
    get: (index: number) => GeoObject | undefined;
  };
};

type YMapClickEvent = {
  get: (key: 'coords') => [number, number];
};

const emptyForm: FormState = {
  name: '',
  lat: '',
  lng: '',
  landmark: '',
};

const DEFAULT_CENTER: [number, number] = [38.5597722, 68.7870384];

function toFormState(branch?: Branch | null): FormState {
  if (!branch) return emptyForm;
  return {
    name: branch.name ?? '',
    lat: branch.lat == null ? '' : String(branch.lat),
    lng: branch.lng == null ? '' : String(branch.lng),
    landmark: branch.landmark ?? '',
  };
}

function resolvePhotoUrl(photo?: string | null) {
  if (!photo) return '';
  if (photo.startsWith('http')) return photo;
  return STORAGE_URL ? `${STORAGE_URL}/${photo}` : photo;
}

function toPayload(form: FormState, photoFile: File | null): BranchPayload | null {
  const name = form.name.trim();
  if (!name) {
    toast.error('Введите название филиала');
    return null;
  }

  const payload: BranchPayload = { name };

  if (form.lat.trim()) {
    const lat = Number(form.lat);
    if (Number.isNaN(lat)) {
      toast.error('Широта (lat) должна быть числом');
      return null;
    }
    payload.lat = lat;
  }

  if (form.lng.trim()) {
    const lng = Number(form.lng);
    if (Number.isNaN(lng)) {
      toast.error('Долгота (lng) должна быть числом');
      return null;
    }
    payload.lng = lng;
  }

  if (form.landmark.trim()) payload.landmark = form.landmark.trim();
  if (photoFile) payload.photo = photoFile;

  return payload;
}

export default function BranchesPage() {
  const { data: branches, isLoading, error } = useBranches();
  const createBranch = useCreateBranch();
  const updateBranch = useUpdateBranch();
  const deleteBranch = useDeleteBranch();

  const [mode, setMode] = useState<'none' | 'create' | 'edit'>('none');
  const [selected, setSelected] = useState<Branch | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>('');
  const [coordinates, setCoordinates] = useState<[number, number] | null>(null);
  const [addressCaption, setAddressCaption] = useState<string>('');

  const ymapsRef = useRef<{ geocode: (coords: [number, number]) => Promise<GeocoderResult> } | null>(null);

  const sortedBranches = useMemo(
    () => (branches ?? []).slice().sort((a, b) => b.id - a.id),
    [branches]
  );

  const isModalOpen = mode !== 'none';
  const isSubmitting = createBranch.isPending || updateBranch.isPending;

  useEffect(() => {
    if (photoFile) {
      const url = URL.createObjectURL(photoFile);
      setPhotoPreview(url);
      return () => URL.revokeObjectURL(url);
    }

    setPhotoPreview(resolvePhotoUrl(selected?.photo));
  }, [photoFile, selected?.photo]);

  useEffect(() => {
    const lat = Number(form.lat);
    const lng = Number(form.lng);

    if (Number.isFinite(lat) && Number.isFinite(lng) && form.lat !== '' && form.lng !== '') {
      setCoordinates([lat, lng]);
    }
  }, [form.lat, form.lng]);

  const openCreate = () => {
    setMode('create');
    setSelected(null);
    setForm(emptyForm);
    setPhotoFile(null);
    setPhotoPreview('');
    setCoordinates(null);
    setAddressCaption('');
  };

  const openEdit = (branch: Branch) => {
    setMode('edit');
    setSelected(branch);
    setForm(toFormState(branch));
    setPhotoFile(null);
    setAddressCaption(branch.landmark ?? '');

    if (branch.lat != null && branch.lng != null) {
      setCoordinates([Number(branch.lat), Number(branch.lng)]);
    } else {
      setCoordinates(null);
    }
  };

  const closeModal = () => {
    setMode('none');
    setSelected(null);
    setForm(emptyForm);
    setPhotoFile(null);
    setPhotoPreview('');
    setCoordinates(null);
    setAddressCaption('');
  };

  const handleChange = (name: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleMapClick = (e: YMapClickEvent) => {
    const coords = e.get('coords');
    if (!coords || coords.length < 2) return;

    const lat = String(coords[0]);
    const lng = String(coords[1]);

    setCoordinates([coords[0], coords[1]]);
    setForm((prev) => ({ ...prev, lat, lng }));

    if (ymapsRef.current) {
      ymapsRef.current
        .geocode(coords)
        .then((res) => {
          const firstGeoObject = res.geoObjects.get(0);
          const address = firstGeoObject?.getAddressLine?.() ?? '';
          if (address) {
            setAddressCaption(address);
            setForm((prev) => ({
              ...prev,
              landmark: prev.landmark.trim() ? prev.landmark : address,
            }));
          }
        })
        .catch(() => {
          setAddressCaption('');
        });
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const payload = toPayload(form, photoFile);
    if (!payload) return;

    try {
      if (mode === 'create') {
        await createBranch.mutateAsync(payload);
        toast.success('Филиал создан');
      } else if (mode === 'edit' && selected) {
        await updateBranch.mutateAsync({ id: selected.id, payload });
        toast.success('Филиал обновлён');
      }
      closeModal();
    } catch (err) {
      showAxiosErrorToast(err, 'Не удалось сохранить филиал');
    }
  };

  const handleDelete = async (branch: Branch) => {
    if (!confirm(`Удалить филиал «${branch.name}»?`)) return;

    try {
      await deleteBranch.mutateAsync(branch.id);
      toast.success('Филиал удалён');
    } catch (err) {
      const axiosErr = err as AxiosError<{ message?: string }>;
      if (axiosErr?.response?.status === 409) {
        toast.error('Нельзя удалить филиал: есть привязанные пользователи');
        return;
      }
      showAxiosErrorToast(err, 'Не удалось удалить филиал');
    }
  };

  return (
    <div className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Филиалы</h1>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-[#0036A5] text-white hover:bg-blue-800 transition cursor-pointer"
        >
          <Plus className="w-5 h-5" />
          Добавить филиал
        </button>
      </div>

      {isLoading && <div className="text-gray-500">Загрузка…</div>}
      {error && <div className="text-red-500">Ошибка загрузки филиалов</div>}

      {!isLoading && !error && (
        <div className="bg-white rounded-xl shadow-sm overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr className="text-left">
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3">Название</th>
                <th className="px-4 py-3">lat</th>
                <th className="px-4 py-3">lng</th>
                <th className="px-4 py-3">Ориентир</th>
                <th className="px-4 py-3">Фото</th>
                <th className="px-4 py-3 text-right">Действия</th>
              </tr>
            </thead>
            <tbody>
              {sortedBranches.map((branch) => {
                const photoUrl = resolvePhotoUrl(branch.photo);

                return (
                  <tr key={branch.id} className="border-t">
                    <td className="px-4 py-3">{branch.id}</td>
                    <td className="px-4 py-3 font-medium">{branch.name}</td>
                    <td className="px-4 py-3">{branch.lat ?? '—'}</td>
                    <td className="px-4 py-3">{branch.lng ?? '—'}</td>
                    <td className="px-4 py-3">{branch.landmark || '—'}</td>
                    <td className="px-4 py-3">
                      {photoUrl ? (
                        <a
                          href={photoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          Открыть
                        </a>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => openEdit(branch)}
                          className="p-2 rounded-md hover:bg-gray-100 text-gray-600 hover:text-gray-900 transition cursor-pointer"
                          title="Редактировать"
                          aria-label="Редактировать"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(branch)}
                          className="p-2 rounded-md hover:bg-red-50 text-red-600 hover:text-red-700 transition cursor-pointer"
                          title="Удалить"
                          aria-label="Удалить"
                          disabled={deleteBranch.isPending}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {sortedBranches.length === 0 && (
                <tr>
                  <td className="px-4 py-8 text-center text-gray-500" colSpan={7}>
                    Филиалы не найдены
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            aria-label="Закрыть модальное окно"
            onClick={closeModal}
            className="absolute inset-0 bg-black/35"
          />

          <div className="relative w-full max-w-3xl rounded-2xl bg-white shadow-xl p-6 max-h-[92vh] overflow-y-auto">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold">
                {mode === 'create' ? 'Создать филиал' : `Редактировать: ${selected?.name ?? ''}`}
              </h2>
              <button onClick={closeModal} className="px-3 py-1 rounded-md border">
                Закрыть
              </button>
            </div>

            <form onSubmit={handleSubmit} className="grid gap-4">
              <Input
                label="Название"
                name="name"
                value={form.name}
                onChange={(e) => handleChange('name', e.target.value)}
                required
              />
              <Input
                label="Широта (lat)"
                name="lat"
                value={form.lat}
                onChange={(e) => handleChange('lat', e.target.value)}
                placeholder="Например: 38.5598"
              />
              <Input
                label="Долгота (lng)"
                name="lng"
                value={form.lng}
                onChange={(e) => handleChange('lng', e.target.value)}
                placeholder="Например: 68.7870"
              />
              <Input
                label="Ориентир"
                name="landmark"
                value={form.landmark}
                onChange={(e) => handleChange('landmark', e.target.value)}
              />

              <div className="grid gap-2">
                <label className="block text-sm text-gray-600">Фото</label>
                {photoPreview && (
                  <div className="w-28 h-28 rounded-lg overflow-hidden border border-gray-200">
                    <Image
                      src={photoPreview}
                      alt="Фото филиала"
                      width={112}
                      height={112}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/webp"
                  onChange={(e) => setPhotoFile(e.target.files?.[0] ?? null)}
                  className="w-full px-4 py-3 rounded-md bg-gray-50"
                />
                {photoFile && <p className="text-xs text-gray-500">Выбрано: {photoFile.name}</p>}
              </div>

              <div>
                <label className="block mb-2 text-sm text-[#666F8D]">
                  Расположение на карте (кликните для выбора)
                </label>
                <div className="h-[360px] w-full rounded-lg overflow-hidden border border-gray-200">
                  <YMaps
                    query={{
                      lang: 'ru_RU',
                      apikey: process.env.NEXT_PUBLIC_YANDEX_MAPS_API_KEY || 'dbdc2ae1-bcbd-4f76-ab38-94ca88cf2a6f',
                    }}
                  >
                    <Map
                      defaultState={{ center: DEFAULT_CENTER, zoom: 11 }}
                      state={{ center: coordinates ?? DEFAULT_CENTER, zoom: coordinates ? 15 : 11 }}
                      width="100%"
                      height="100%"
                      onClick={handleMapClick}
                      modules={['geocode']}
                      onLoad={(ymaps) => {
                        const maybe = ymaps as unknown as {
                          geocode?: (coords: [number, number]) => Promise<GeocoderResult>;
                        };
                        if (typeof maybe.geocode === 'function') {
                          ymapsRef.current = { geocode: (coords) => maybe.geocode!(coords) };
                        } else {
                          ymapsRef.current = null;
                        }
                      }}
                    >
                      {coordinates && (
                        <Placemark
                          geometry={coordinates}
                          options={{
                            preset: 'islands#blueHomeIcon',
                          }}
                          properties={{
                            iconCaption: addressCaption || 'Выбранная точка',
                          }}
                        />
                      )}
                    </Map>
                  </YMaps>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  Координаты автоматически заполняются после клика по карте.
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-md bg-[#0036A5] text-white disabled:opacity-60"
                >
                  {isSubmitting ? 'Сохранение…' : 'Сохранить'}
                </button>
                <button type="button" onClick={closeModal} className="px-4 py-2 rounded-md border">
                  Отмена
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
