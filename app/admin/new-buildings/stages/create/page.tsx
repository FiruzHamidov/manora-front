'use client';

import { ChangeEvent, FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FormLayout } from '@/ui-components/FormLayout';
import { Button } from '@/ui-components/Button';
import { Input } from '@/ui-components/Input';
import { useCreateConstructionStage } from '@/services/new-buildings/hooks';
import { toast } from 'react-toastify';

export default function CreateStagePage() {
  const router = useRouter();
  const createStage = useCreateConstructionStage();

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
      toast.error('Название этапа строительства обязательно');
      return;
    }

    try {
      await createStage.mutateAsync(form);
      toast.success('Этап строительства успешно создан');
      router.push('/admin/new-buildings/stages');
    } catch (error) {
      console.error('Error creating construction stage:', error);
      toast.error('Ошибка при создании этапа строительства');
    }
  };

  return (
    <FormLayout
      title="Добавить этап строительства"
      description="Заполните информацию об этапе строительства"
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
            disabled={createStage.isPending || !form.name}
            loading={createStage.isPending}
          >
            Создать этап
          </Button>
        </div>
      </form>
    </FormLayout>
  );
}
