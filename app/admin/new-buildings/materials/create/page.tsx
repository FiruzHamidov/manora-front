'use client';

import { ChangeEvent, FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FormLayout } from '@/ui-components/FormLayout';
import { Button } from '@/ui-components/Button';
import { Input } from '@/ui-components/Input';
import { useCreateMaterial } from '@/services/new-buildings/hooks';
import { toast } from 'react-toastify';

export default function CreateMaterialPage() {
  const router = useRouter();
  const createMaterial = useCreateMaterial();

  const [form, setForm] = useState({
    name: '',
    slug: '',
  });

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!form.name) {
      toast.error('Название материала обязательно');
      return;
    }

    try {
      await createMaterial.mutateAsync(form);
      toast.success('Материал успешно создан');
      router.push('/admin/new-buildings/materials');
    } catch (error) {
      console.error('Error creating material:', error);
      toast.error('Ошибка при создании материала');
    }
  };

  return (
    <FormLayout
      title="Добавить материал"
      description="Заполните информацию о материале новостройки"
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
            disabled={createMaterial.isPending || !form.name}
            loading={createMaterial.isPending}
          >
            Создать материал
          </Button>
        </div>
      </form>
    </FormLayout>
  );
}
