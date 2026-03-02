'use client';

import { ChangeEvent, FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FormLayout } from '@/ui-components/FormLayout';
import { Button } from '@/ui-components/Button';
import { Input } from '@/ui-components/Input';
import { useCreateFeature } from '@/services/new-buildings/hooks';
import { toast } from 'react-toastify';

export default function CreateFeaturePage() {
  const router = useRouter();
  const createFeature = useCreateFeature();

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
      toast.error('Название особенности обязательно');
      return;
    }

    try {
      await createFeature.mutateAsync(form);
      toast.success('Особенность успешно создана');
      router.push('/admin/new-buildings/features');
    } catch (error) {
      console.error('Error creating feature:', error);
      toast.error('Ошибка при создании особенности');
    }
  };

  return (
    <FormLayout
      title="Добавить особенность"
      description="Заполните информацию об особенности новостройки"
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
            disabled={createFeature.isPending || !form.name}
            loading={createFeature.isPending}
          >
            Создать особенность
          </Button>
        </div>
      </form>
    </FormLayout>
  );
}
