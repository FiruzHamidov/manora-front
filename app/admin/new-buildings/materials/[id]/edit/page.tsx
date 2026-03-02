'use client';

import { ChangeEvent, FormEvent, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { FormLayout } from '@/ui-components/FormLayout';
import { Button } from '@/ui-components/Button';
import { Input } from '@/ui-components/Input';

import { useMaterial, useUpdateMaterial } from '@/services/new-buildings/hooks';
import { toast } from 'react-toastify';
import { BuildingApiError } from '@/services/new-buildings/types';

export default function EditMaterialPage() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const router = useRouter();

  const { data: material, isLoading } = useMaterial(id);
  const updateMaterial = useUpdateMaterial(id);

  const [form, setForm] = useState({
    name: '',
    slug: '',
  });

  useEffect(() => {
    if (!material) return;

    setForm({
      name: material.name || '',
      slug: material.slug || '',
    });
  }, [material]);

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    try {
      await updateMaterial.mutateAsync(form);
      toast.success('Материал успешно обновлен');
      router.push('/admin/new-buildings/materials');
    } catch (err: unknown) {
      const apiErr = err as BuildingApiError;
      toast.error(
        apiErr?.response?.data?.message || 'Ошибка при обновлении материала'
      );
    }
  };

  if (isLoading) {
    return (
      <FormLayout
        title="Редактирование материала"
        description="Загрузка данных..."
      >
        <div className="text-center py-8">Загрузка...</div>
      </FormLayout>
    );
  }

  if (!material) {
    return (
      <FormLayout title="Ошибка" description="Материал не найден">
        <div className="text-center py-8 text-red-500">
          Материал не найден или произошла ошибка при загрузке данных
        </div>
        <div className="flex justify-center">
          <Button onClick={() => router.push('/admin/new-buildings/materials')}>
            Вернуться к списку
          </Button>
        </div>
      </FormLayout>
    );
  }

  return (
    <FormLayout
      title={`Редактирование: ${material.name}`}
      description="Обновите информацию о материале"
    >
      <form onSubmit={handleSubmit} className="space-y-6 max-w-xl mx-auto">
        <Input
          label="Название материала *"
          name="name"
          value={form.name}
          onChange={handleChange}
          placeholder="Например: Кирпич"
          required
        />

        <Input
          label="Slug (URL-идентификатор)"
          name="slug"
          value={form.slug}
          onChange={handleChange}
          placeholder="Например: kirpich"
        />

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Отмена
          </Button>

          <Button
            type="submit"
            disabled={updateMaterial.isPending || !form.name}
            loading={updateMaterial.isPending}
          >
            Сохранить изменения
          </Button>
        </div>
      </form>
    </FormLayout>
  );
}
