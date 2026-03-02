'use client';

import { ChangeEvent, FormEvent, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { FormLayout } from '@/ui-components/FormLayout';
import { Button } from '@/ui-components/Button';
import { Input } from '@/ui-components/Input';

import { useFeature, useUpdateFeature } from '@/services/new-buildings/hooks';
import { toast } from 'react-toastify';
import { BuildingApiError } from '@/services/new-buildings/types';

export default function EditFeaturePage() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const router = useRouter();

  const { data: feature, isLoading } = useFeature(id);
  const updateFeature = useUpdateFeature(id);

  const [form, setForm] = useState({
    name: '',
    slug: '',
  });

  useEffect(() => {
    if (!feature) return;

    setForm({
      name: feature.name || '',
      slug: feature.slug || '',
    });
  }, [feature]);

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    try {
      await updateFeature.mutateAsync(form);
      toast.success('Особенность успешно обновлена');
      router.push('/admin/new-buildings/features');
    } catch (err: unknown) {
      const apiErr = err as BuildingApiError;
      toast.error(
        apiErr.response?.data?.message || 'Ошибка при обновлении особенности'
      );
    }
  };

  if (isLoading) {
    return (
      <FormLayout
        title="Редактирование особенности"
        description="Загрузка данных..."
      >
        <div className="text-center py-8">Загрузка...</div>
      </FormLayout>
    );
  }

  if (!feature) {
    return (
      <FormLayout title="Ошибка" description="Особенность не найдена">
        <div className="text-center py-8 text-red-500">
          Особенность не найдена или произошла ошибка при загрузке данных
        </div>
        <div className="flex justify-center">
          <Button onClick={() => router.push('/admin/new-buildings/features')}>
            Вернуться к списку
          </Button>
        </div>
      </FormLayout>
    );
  }

  return (
    <FormLayout
      title={`Редактирование: ${feature.name}`}
      description="Обновите информацию об особенности"
    >
      <form onSubmit={handleSubmit} className="space-y-6 max-w-xl mx-auto">
        <Input
          label="Название особенности *"
          name="name"
          value={form.name}
          onChange={handleChange}
          placeholder="Например: Детская площадка"
          required
        />

        <Input
          label="Slug (URL-идентификатор)"
          name="slug"
          value={form.slug}
          onChange={handleChange}
          placeholder="Например: detskaya-ploshchadka"
        />

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Отмена
          </Button>

          <Button
            type="submit"
            disabled={updateFeature.isPending || !form.name}
            loading={updateFeature.isPending}
          >
            Сохранить изменения
          </Button>
        </div>
      </form>
    </FormLayout>
  );
}
