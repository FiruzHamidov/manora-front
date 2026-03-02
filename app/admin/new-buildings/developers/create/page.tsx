'use client';

import { ChangeEvent, FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FormLayout } from '@/ui-components/FormLayout';
import { Button } from '@/ui-components/Button';
import { Input } from '@/ui-components/Input';
// import { Textarea } from '@/ui-_components/Textarea';
import { useCreateDeveloper } from '@/services/new-buildings/hooks';
import { toast } from 'react-toastify';
import { ModerationStatus } from '@/services/new-buildings/types';
import { SelectToggle } from '@/ui-components/SelectToggle';

export default function CreateDeveloperPage() {
  const router = useRouter();

  const createDeveloper = useCreateDeveloper();

  const [form, setForm] = useState({
    name: '',
    description: '',
    phone: '',
    under_construction_count: 0,
    built_count: 0,
    founded_year: '',
    total_projects: 0,
    moderation_status: 'pending' as ModerationStatus,
    website: '',
    facebook: '',
    instagram: '',
    telegram: '',
    logo: null as File | null,
  });

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;

    // Convert number inputs to actual numbers
    if (type === 'number') {
      setForm((prev) => ({
        ...prev,
        [name]: value === '' ? 0 : Number(value),
      }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setForm((prev) => ({ ...prev, logo: e.target.files![0] }));
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    try {
      await createDeveloper.mutateAsync(form);
      toast.success('Застройщик успешно создан');
      router.push('/admin/new-buildings/developers');
    } catch (error) {
      console.error('Error creating developer:', error);
      toast.error('Ошибка при создании застройщика');
    }
  };

  return (
    <FormLayout
      title="Добавить застройщика"
      description="Заполните информацию о застройщике"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left column */}
          <div className="space-y-6">
            <Input
              required
              label="Название компании"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="ООО «СтройИнвест»"
            />

            <Input
              required
              label="Телефон"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              placeholder="+992 900 000 001"
            />

            <Input
              required
              label="Год основания"
              name="founded_year"
              value={form.founded_year}
              onChange={handleChange}
              placeholder="2010"
            />

            <div className="grid grid-cols-3 gap-4">
              <Input
                required
                label="Всего проектов"
                name="total_projects"
                type="number"
                value={form.total_projects.toString()}
                onChange={handleChange}
              />

              <Input
                required
                label="Построено"
                name="built_count"
                type="number"
                value={form.built_count}
                onChange={handleChange}
              />

              <Input
                label="Строится"
                name="under_construction_count"
                type="number"
                value={form.under_construction_count}
                onChange={handleChange}
              />
            </div>

            <SelectToggle<string>
              title="Статус модерации"
              options={[
                { id: 'pending', name: 'На модерации' },
                { id: 'approved', name: 'Одобрено' },
                { id: 'rejected', name: 'Отклонено' },
                { id: 'draft', name: 'Черновик' },
                { id: 'deleted', name: 'Удалено' },
              ]}
              selected={form.moderation_status || 'pending'}
              setSelected={(value) =>
                setForm((prev) => ({
                  ...prev,
                  moderation_status: value as ModerationStatus,
                }))
              }
              className="w-full"
            />

            <Input
              textarea
              label="Описание компании"
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Информация о компании, история, достижения..."
            />
          </div>

          {/* Right column */}
          <div className="space-y-6">
            <div className="border rounded-xl p-5">
              <h3 className="font-medium mb-4">Контактная информация</h3>

              <div className="space-y-4">
                <Input
                  label="Веб-сайт"
                  name="website"
                  value={form.website}
                  onChange={handleChange}
                  placeholder="https://developer.tj"
                />

                <Input
                  label="Instagram"
                  name="instagram"
                  value={form.instagram}
                  onChange={handleChange}
                  placeholder="https://instagram.com/dev"
                />

                <Input
                  label="Facebook"
                  name="facebook"
                  value={form.facebook}
                  onChange={handleChange}
                  placeholder="https://facebook.com/dev"
                />

                <Input
                  label="Telegram"
                  name="telegram"
                  value={form.telegram}
                  onChange={handleChange}
                  placeholder="https://t.me/dev"
                />
              </div>
            </div>

            <div className="border rounded-xl p-5">
              <h3 className="font-medium mb-4">Логотип</h3>

              <div>
                <input
                  type="file"
                  id="logo"
                  name="logo"
                  onChange={handleFileChange}
                  accept="image/jpeg,image/jpg,image/png,image/webp,image/svg+xml"
                  className="hidden"
                />

                <label htmlFor="logo" className="block w-full cursor-pointer">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:bg-gray-50">
                    {form.logo ? (
                      <div className="text-center">
                        <p className="text-sm text-gray-600 mb-1">
                          Выбран файл:
                        </p>
                        <p className="font-medium text-gray-900">
                          {form.logo.name}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {Math.round(form.logo.size / 1024)} KB
                        </p>
                      </div>
                    ) : (
                      <div>
                        <p className="text-sm text-gray-600">
                          Выбери файл (jpg/jpeg/png/webp/svg, до 5 МБ)
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Оставь пустым, если не нужен
                        </p>
                      </div>
                    )}
                  </div>
                </label>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Отмена
          </Button>

          <Button
            type="submit"
            disabled={createDeveloper.isPending || !form.name}
            loading={createDeveloper.isPending}
          >
            Создать застройщика
          </Button>
        </div>
      </form>
    </FormLayout>
  );
}
