'use client';

import { ChangeEvent, FormEvent, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { FormLayout } from '@/ui-components/FormLayout';
import { Button } from '@/ui-components/Button';
import { Input } from '@/ui-components/Input';

import {
  useDeveloper,
  useUpdateDeveloper,
} from '@/services/new-buildings/hooks';
import { toast } from 'react-toastify';
import {
  BuildingApiError,
  ModerationStatus,
} from '@/services/new-buildings/types';
import Image from 'next/image';
import { SelectToggle } from '@/ui-components/SelectToggle';

export default function EditDeveloperPage() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const router = useRouter();

  const { data: developer, isLoading } = useDeveloper(id);
  const updateDeveloper = useUpdateDeveloper(id);

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

  const [previewLogo, setPreviewLogo] = useState<string | null>(null);

  useEffect(() => {
    if (!developer) return;

    setForm({
      name: developer.name || '',
      description: developer.description || '',
      phone: developer.phone || '',
      under_construction_count: developer.under_construction_count || 0,
      built_count: developer.built_count || 0,
      founded_year: developer.founded_year || '',
      total_projects: developer.total_projects || 0,
      moderation_status: developer.moderation_status || 'pending',
      website: developer.website || '',
      facebook: developer.facebook || '',
      instagram: developer.instagram || '',
      telegram: developer.telegram || '',
      logo: null,
    });

    if (developer.logo_path) {
      setPreviewLogo(
        `${process.env.NEXT_PUBLIC_STORAGE_URL}/${developer.logo_path}`
      );
    }
  }, [developer]);

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;

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
      const file = e.target.files[0];
      setForm((prev) => ({ ...prev, logo: file }));

      const fileUrl = URL.createObjectURL(file);
      setPreviewLogo(fileUrl);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    try {
      await updateDeveloper.mutateAsync(form);
      toast.success('Застройщик успешно обновлен');
      router.push(`/admin/new-buildings/developers`);
    } catch (err: unknown) {
      const apiErr = err as BuildingApiError;
      toast.error(
        apiErr?.response?.data?.message || 'Ошибка при обновлении застройщика'
      );
    }
  };

  if (isLoading) {
    return (
      <FormLayout
        title="Редактирование застройщика"
        description="Загрузка данных..."
      >
        <div className="text-center py-8">Загрузка...</div>
      </FormLayout>
    );
  }

  if (!developer) {
    return (
      <FormLayout title="Ошибка" description="Застройщик не найден">
        <div className="text-center py-8 text-red-500">
          Застройщик не найден или произошла ошибка при загрузке данных
        </div>
        <div className="flex justify-center">
          <Button
            onClick={() => router.push('/admin/new-buildings/developers')}
          >
            Вернуться к списку
          </Button>
        </div>
      </FormLayout>
    );
  }

  return (
    <FormLayout
      title={`Редактирование: ${developer.name}`}
      description="Обновите информацию о застройщике"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left column */}
          <div className="space-y-6">
            <Input
              label="Название компании *"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="ООО «СтройИнвест»"
              required
            />

            <Input
              label="Телефон"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              placeholder="+992 900 000 001"
            />

            <Input
              label="Год основания"
              name="founded_year"
              value={form.founded_year}
              onChange={handleChange}
              placeholder="2010"
            />

            <div className="grid grid-cols-3 gap-4">
              <Input
                label="Всего проектов"
                name="total_projects"
                type="number"
                value={form.total_projects}
                onChange={handleChange}
              />

              <Input
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

              {previewLogo && (
                <div className="mb-4 flex justify-center">
                  <div className="w-40 h-40 relative border rounded overflow-hidden">
                    <Image
                      src={previewLogo}
                      alt={form.name}
                      fill
                      className="object-contain"
                    />
                  </div>
                </div>
              )}

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
                          Выбран новый файл:
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
                          {previewLogo ? 'Заменить логотип' : 'Выбрать логотип'}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          jpg/jpeg/png/webp/svg, до 5 МБ
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
            disabled={updateDeveloper.isPending || !form.name}
            loading={updateDeveloper.isPending}
          >
            Сохранить изменения
          </Button>
        </div>
      </form>
    </FormLayout>
  );
}
