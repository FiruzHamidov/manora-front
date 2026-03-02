'use client';

import { FormEvent, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  useCreateBuildingBlock,
  useNewBuilding,
} from '@/services/new-buildings/hooks';
import { Button } from '@/ui-components/Button';
import { toast } from 'react-toastify';
import Link from 'next/link';
import type { BuildingBlockPayload } from '@/services/new-buildings/types';

export default function CreateBuildingBlockPage() {
  const params = useParams<{ id: string }>();
  const newBuildingId = Number(params.id);
  const router = useRouter();

  const { data: buildingResponse, isLoading: buildingLoading } =
    useNewBuilding(newBuildingId);
  const createBlock = useCreateBuildingBlock(newBuildingId);

  const building = buildingResponse?.data;

  const [form, setForm] = useState<BuildingBlockPayload>({
    name: '',
    floors_from: 1,
    floors_to: 10,
    completion_at: '',
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]:
        name === 'floors_from' || name === 'floors_to' ? Number(value) : value,
    }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!form.name.trim()) {
      toast.error('Введите название блока');
      return;
    }

    if (form.floors_from < 1 || form.floors_to < 1) {
      toast.error('Этажность должна быть положительным числом');
      return;
    }

    if (form.floors_from > form.floors_to) {
      toast.error('Начальный этаж не может быть больше конечного');
      return;
    }

    if (!form.completion_at) {
      toast.error('Укажите дату сдачи');
      return;
    }

    try {
      await createBlock.mutateAsync(form);
      toast.success('Блок создан');
      router.push(`/admin/new-buildings/${newBuildingId}/blocks`);
    } catch (err) {
      toast.error('Ошибка при создании блока');
      console.error(err);
    }
  };

  if (buildingLoading) {
    return <div className="text-sm text-gray-500">Загрузка...</div>;
  }

  if (!building) {
    return <div>Новостройка не найдена</div>;
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Создать блок</h1>
        <p className="text-sm text-gray-500 mt-1">
          Добавление нового блока в {building.title}
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-6 bg-white border rounded-2xl p-6"
      >
        <div>
          <label className="block text-sm font-medium mb-2">
            Название блока *
          </label>
          <input
            type="text"
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="Например: Блок A"
            className="w-full px-4 py-3 rounded-lg border border-[#BAC0CC] text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#0036A5] focus:border-transparent"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">С этажа *</label>
            <input
              type="number"
              name="floors_from"
              value={form.floors_from}
              onChange={handleChange}
              min="1"
              className="w-full px-4 py-3 rounded-lg border border-[#BAC0CC] text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#0036A5] focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">По этаж *</label>
            <input
              type="number"
              name="floors_to"
              value={form.floors_to}
              onChange={handleChange}
              min="1"
              className="w-full px-4 py-3 rounded-lg border border-[#BAC0CC] text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#0036A5] focus:border-transparent"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Дата сдачи *</label>
          <input
            type="date"
            name="completion_at"
            value={form.completion_at}
            onChange={handleChange}
            className="w-full px-4 py-3 rounded-lg border border-[#BAC0CC] text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#0036A5] focus:border-transparent"
            required
          />
        </div>

        <div className="flex gap-3 pt-4">
          <Button type="submit" disabled={createBlock.isPending}>
            {createBlock.isPending ? 'Создание...' : 'Создать блок'}
          </Button>
          <Link href={`/admin/new-buildings/${newBuildingId}/blocks`}>
            <Button type="button" variant="outline">
              Отмена
            </Button>
          </Link>
        </div>
      </form>
    </div>
  );
}
