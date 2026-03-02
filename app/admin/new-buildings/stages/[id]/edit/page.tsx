'use client';

import { ChangeEvent, FormEvent, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { FormLayout } from '@/ui-components/FormLayout';
import { Button } from '@/ui-components/Button';
import { Input } from '@/ui-components/Input';
import {
  useConstructionStage,
  useUpdateConstructionStage,
} from '@/services/new-buildings/hooks';
import { toast } from 'react-toastify';
import { BuildingApiError } from '@/services/new-buildings/types';

export default function EditStagePage() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const router = useRouter();

  const { data: stage, isLoading } = useConstructionStage(id);
  const updateStage = useUpdateConstructionStage(id);

  const [form, setForm] = useState({
    name: '',
    slug: '',
  });

  useEffect(() => {
    if (!stage) return;

    setForm({
      name: stage.name || '',
      slug: stage.slug || '',
    });
  }, [stage]);

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    try {
      await updateStage.mutateAsync(form);
      toast.success('Этап строительства успешно обновлен');
      router.push('/admin/new-buildings/stages');
    } catch (err: unknown) {
      const apiErr = err as BuildingApiError;
      toast.error(
        apiErr?.response?.data?.message ||
          'Ошибка при обновлении этапа строительства'
      );
    }
  };

  if (isLoading) {
    return (
      <FormLayout
        title="Редактирование этапа строительства"
        description="Загрузка данных..."
      >
        <div className="text-center py-8">Загрузка...</div>
      </FormLayout>
    );
  }

  if (!stage) {
    return (
      <FormLayout title="Ошибка" description="Этап строительства не найден">
        <div className="text-center py-8 text-red-500">
          Этап строительства не найден или произошла ошибка при загрузке данных
        </div>
        <div className="flex justify-center">
          <Button onClick={() => router.push('/admin/new-buildings/stages')}>
            Вернуться к списку
          </Button>
        </div>
      </FormLayout>
    );
  }

  return (
    <FormLayout
      title={`Редактирование: ${stage.name}`}
      description="Обновите информацию об этапе строительства"
    >
      <form onSubmit={handleSubmit} className="space-y-6 max-w-xl mx-auto">
        <Input
          label="Название этапа строительства *"
          name="name"
          value={form.name}
          onChange={handleChange}
          placeholder="Например: Завершено"
          required
        />

        <Input
          label="Slug (URL-идентификатор)"
          name="slug"
          value={form.slug}
          onChange={handleChange}
          placeholder="Например: zaversheno"
        />

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Отмена
          </Button>

          <Button
            type="submit"
            disabled={updateStage.isPending || !form.name}
            loading={updateStage.isPending}
          >
            Сохранить изменения
          </Button>
        </div>
      </form>
    </FormLayout>
  );
}
