'use client';

import { FormEvent, useState, useEffect, ChangeEvent } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  useBuildingUnit,
  useUpdateBuildingUnit,
  useNewBuilding,
  useBuildingBlocks,
} from '@/services/new-buildings/hooks';
import { Button } from '@/ui-components/Button';
import { SelectToggle } from '@/ui-components/SelectToggle';
import { toast } from 'react-toastify';
import Link from 'next/link';
import type { BuildingUnitPayload } from '@/services/new-buildings/types';

export default function EditBuildingUnitPage() {
  const params = useParams<{ id: string; unitId: string }>();
  const newBuildingId = Number(params.id);
  const unitId = Number(params.unitId);
  const router = useRouter();

  const { data: buildingResponse, isLoading: buildingLoading } =
    useNewBuilding(newBuildingId);
  const { data: blocks, isLoading: blocksLoading } =
    useBuildingBlocks(newBuildingId);
  const { data: unit, isLoading: unitLoading } = useBuildingUnit(
    newBuildingId,
    unitId
  );
  const updateUnit = useUpdateBuildingUnit(newBuildingId, unitId);

  const building = buildingResponse?.data;

  // track which price-related field was edited last: 'price' | 'total' | 'area' | null
  const [lastEdited, setLastEdited] = useState<'price' | 'total' | 'area' | null>(null);

  const [form, setForm] = useState<BuildingUnitPayload>({
    new_building_id: 0,
    block_id: 0,
    name: '',
    bedrooms: 0,
    bathrooms: 0,
    area: 0,
    price_per_sqm: 0,
    total_price: 0,
    currency: 'TJS',
    floor: 1,
    moderation_status: 'pending' as any,
    window_view: null as any,
  });

  useEffect(() => {
    if (unit) {
      setForm((prev) => ({
        ...prev,
        new_building_id: newBuildingId,
        block_id: unit.block_id ?? 0,
        name: unit.name ?? '',
        bedrooms: unit.bedrooms ?? 0,
        bathrooms: unit.bathrooms ?? 0,
        area: unit.area ?? 0,
        price_per_sqm: Number(unit.price_per_sqm) || 0,
        total_price: Number(unit.total_price) || 0,
        currency: unit.currency ?? 'TJS',
        floor: unit.floor ?? 1,
        moderation_status: (unit as any).moderation_status ?? 'pending',
        window_view: (unit as any).window_view ?? null,
      }));
    }
  }, [unit, newBuildingId]);

  const moderationOptions = [
    { id: 'pending', name: 'На модерации' },
    { id: 'available', name: 'В продаже' },
    { id: 'sold', name: 'Продано' },
    { id: 'reserved', name: 'Бронирован' },
  ];

  const windowViewOptions = [
    { id: 'courtyard', name: 'Во двор' },
    { id: 'street', name: 'На улицу' },
    { id: 'park', name: 'На парк' },
    { id: 'mountains', name: 'На горы' },
    { id: 'city', name: 'На город' },
    { id: 'panoramic', name: 'Панорамный вид' },
  ];

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    // numeric fields
    if (
      name === 'bedrooms' ||
      name === 'bathrooms' ||
      name === 'area' ||
      name === 'price_per_sqm' ||
      name === 'floor' ||
      name === 'block_id' ||
      name === 'total_price'
    ) {
      const num = Number(value);

      // set lastEdited immediately so area changes use correct preference
      if (name === 'price_per_sqm') setLastEdited('price');
      if (name === 'total_price') setLastEdited('total');
      if (name === 'area') setLastEdited('area');

      setForm((prev) => {
        const next: BuildingUnitPayload = { ...prev };

        const area = name === 'area' ? num : prev.area;
        const price = name === 'price_per_sqm' ? num : prev.price_per_sqm;
        const total = name === 'total_price' ? num : prev.total_price;

        if (name === 'price_per_sqm') {
          next.price_per_sqm = price;
          next.total_price = +((price) * (area || 0)).toFixed(2);
          return next;
        }

        if (name === 'total_price') {
          next.total_price = total;
          next.price_per_sqm = area > 0 ? +((total / area) || 0).toFixed(2) : prev.price_per_sqm;
          return next;
        }

        if (name === 'area') {
          next.area = area;
          if (lastEdited === 'price') {
            next.total_price = +((prev.price_per_sqm || price) * (area || 0)).toFixed(2);
          } else if (lastEdited === 'total') {
            next.price_per_sqm = area > 0 ? +(((prev.total_price || total) / area) || 0).toFixed(2) : prev.price_per_sqm;
          } else {
            next.total_price = +((prev.price_per_sqm || price) * (area || 0)).toFixed(2);
          }
          return next;
        }

        // other numeric fields (bedrooms, bathrooms, floor, block_id)
        return { ...next, [name]: num } as BuildingUnitPayload;
      });

      return;
    }

    // string fields
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectToggleChange = (name: keyof BuildingUnitPayload, val: any) => {
    setForm((prev) => ({ ...prev, [name]: val }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!form.name.trim()) {
      toast.error('Введите название квартиры');
      return;
    }

    if (form.block_id === 0) {
      toast.error('Выберите блок');
      return;
    }

    // bedrooms/bathrooms can be 0, but ensure they are not negative
    if (form.bedrooms < 0 || form.bathrooms < 0) {
      toast.error('Количество комнат/санузлов не может быть отрицательным');
      return;
    }

    if (form.area <= 0) {
      toast.error('Площадь должна быть положительным числом');
      return;
    }

    if (form.price_per_sqm <= 0) {
      toast.error('Цена за м² должна быть положительным числом');
      return;
    }

    if (form.floor < 1) {
      toast.error('Этаж должен быть положительным числом');
      return;
    }

    try {
      const payload = { ...form } as BuildingUnitPayload;
      // ensure totals are consistent before sending
      if ((!payload.total_price || payload.total_price === 0) && payload.area > 0) {
        payload.total_price = +(payload.price_per_sqm * payload.area).toFixed(2);
      }
      if ((!payload.price_per_sqm || payload.price_per_sqm === 0) && payload.area > 0) {
        payload.price_per_sqm = +(payload.total_price / payload.area).toFixed(2);
      }

      await updateUnit.mutateAsync(payload);
      toast.success('Квартира обновлена');
      router.push(`/admin/new-buildings/${newBuildingId}/units`);
    } catch (err) {
      toast.error('Ошибка при обновлении квартиры');
      console.error(err);
    }
  };

  if (buildingLoading || blocksLoading || unitLoading) {
    return <div className="text-sm text-gray-500">Загрузка...</div>;
  }

  if (!building || !unit) {
    return <div>Данные не найдены</div>;
  }

  if (!blocks || blocks.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold">Редактировать квартиру</h1>
        <div className="border rounded-2xl p-8 text-center">
          <p className="text-gray-500 mb-4">
            Сначала нужно создать блоки для этой новостройки
          </p>
          <Link href={`/admin/new-buildings/${newBuildingId}/blocks`}>
            <Button>Перейти к блокам</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Редактировать квартиру</h1>
        <p className="text-sm text-gray-500 mt-1">
          Изменение квартиры {unit.name} в {building.title}
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-6 bg-white border rounded-2xl p-6"
      >
        <div>
          <label className="block text-sm font-medium mb-2">Блок *</label>
          <select
            name="block_id"
            value={form.block_id}
            onChange={handleChange}
            className="w-full px-4 py-3 rounded-lg border border-[#BAC0CC] text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#0036A5] focus:border-transparent"
            required
          >
            <option value={0}>Выберите блок</option>
            {blocks.map((block) => (
              <option key={block.id} value={block.id}>
                {block.name} (Этажи {block.floors_from}-{block.floors_to})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Название квартиры *
          </label>
          <input
            type="text"
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="Например: 2-комнатная, 68 м²"
            className="w-full px-4 py-3 rounded-lg border border-[#BAC0CC] text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#0036A5] focus:border-transparent"
            required
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Количество спален
            </label>
            <input
              type="number"
              name="bedrooms"
              value={form.bedrooms}
              onChange={handleChange}
              min="0"
              className="w-full px-4 py-3 rounded-lg border border-[#BAC0CC] text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#0036A5] focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Санузлов</label>
            <input
              type="number"
              name="bathrooms"
              value={form.bathrooms}
              onChange={handleChange}
              min="0"
              className="w-full px-4 py-3 rounded-lg border border-[#BAC0CC] text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#0036A5] focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Этаж *</label>
            <input
              type="number"
              name="floor"
              value={form.floor}
              onChange={handleChange}
              min="1"
              className="w-full px-4 py-3 rounded-lg border border-[#BAC0CC] text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#0036A5] focus:border-transparent"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Площадь (м²) *
          </label>
          <input
            type="number"
            name="area"
            value={form.area}
            onChange={handleChange}
            min="0"
            step="0.1"
            className="w-full px-4 py-3 rounded-lg border border-[#BAC0CC] text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#0036A5] focus:border-transparent"
            required
          />
        </div>

        <div className="grid grid-cols gap-4">
          <div className="col-span-2">
            <label className="block text-sm font-medium mb-2">Цена *</label>
            <div className="grid grid-cols-2 gap-4">
              <input
                type="number"
                name="price_per_sqm"
                value={form.price_per_sqm}
                onChange={handleChange}
                min="0"
                step="0.01"
                className="w-full px-4 py-3 rounded-lg border border-[#BAC0CC] text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#0036A5] focus:border-transparent"
                required
              />

              <input
                type="number"
                name="total_price"
                value={form.total_price}
                onChange={handleChange}
                min="0"
                step="0.01"
                className="w-full px-4 py-3 rounded-lg border border-[#BAC0CC] text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#0036A5] focus:border-transparent"
                required
              />
            </div>
          </div>
        </div>

        <div>
          <SelectToggle
            title="Статус модерации"
            options={moderationOptions}
            selected={form.moderation_status}
            setSelected={(val) => handleSelectToggleChange('moderation_status', val)}
          />
        </div>

        <div>
          <SelectToggle
            title="Вид из окна"
            options={windowViewOptions}
            selected={form.window_view}
            setSelected={(val) => handleSelectToggleChange('window_view', val)}
          />
        </div>

        <div className="flex gap-3 pt-4">
          <Button type="submit" disabled={updateUnit.isPending}>
            {updateUnit.isPending ? 'Сохранение...' : 'Сохранить изменения'}
          </Button>
          <Link href={`/admin/new-buildings/${newBuildingId}/units`}>
            <Button type="button" variant="outline">
              Отмена
            </Button>
          </Link>
        </div>
      </form>
    </div>
  );
}
