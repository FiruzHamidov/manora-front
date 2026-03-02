'use client';

import { useMemo, useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { useFeatures, useDeleteFeature } from '@/services/new-buildings/hooks';
import { Button } from '@/ui-components/Button';
import { Input } from '@/ui-components/Input';
import { Feature, Paginated } from '@/services/new-buildings/types';
import { toast } from 'react-toastify';
import Link from 'next/link';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

export default function FeaturesIndexPage() {
  const { data: features } = useFeatures();

  const deleteFeature = useDeleteFeature();

  const list = features as Paginated<Feature> | undefined;
  const total = list?.total ?? 0;
  const current = list?.current_page ?? 1;
  const items = useMemo(() => list?.data ?? [], [list]);

  const [page, setPage] = useState(1);
  const [perPage] = useState(15);
  const [search, setSearch] = useState('');

  const totalPages = useMemo(() => {
    if (!total) return 1;
    return Math.max(1, Math.ceil(total / perPage));
  }, [total, perPage]);

  const filteredItems = useMemo(() => {
    if (!search) return items;
    const searchLower = search.toLowerCase();
    return items.filter(
        (item) =>
            item.name.toLowerCase().includes(searchLower) ||
            item.slug.toLowerCase().includes(searchLower)
    );
  }, [items, search]);

  const handleDelete = async (id: number) => {
    if (!confirm('Удалить эту особенность? Это действие необратимо.')) return;
    try {
      await deleteFeature.mutateAsync(id);
      toast.success('Особенность успешно удалена');
    } catch {
      toast.error('Ошибка при удалении особенности');
    }
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd MMM yyyy', { locale: ru });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end gap-3">
        <div className="grow">
          <Input
            name="search"
            label="Поиск по названию"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Например: Детская площадка"
          />
        </div>

        <Link href="/admin/new-buildings/features/create">
          <Button className="w-full sm:w-auto">
            <Plus className="w-4 h-4 mr-2" /> Добавить
          </Button>
        </Link>
      </div>

      <div className="overflow-x-auto border rounded-2xl">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr className="text-left">
              <th className="px-4 py-3">ID</th>
              <th className="px-4 py-3">Название</th>
              <th className="px-4 py-3">Slug</th>
              <th className="px-4 py-3">Дата создания</th>
              <th className="px-4 py-3 text-right">Действия</th>
            </tr>
          </thead>
          <tbody>
            {list === undefined && (
              <tr>
                <td className="px-4 py-6 text-center" colSpan={5}>
                  Загрузка...
                </td>
              </tr>
            )}

            {list !== undefined && filteredItems.length === 0 && (
              <tr>
                <td className="px-4 py-6 text-center" colSpan={5}>
                  {search
                    ? 'По вашему запросу ничего не найдено'
                    : 'Особенности не найдены'}
                </td>
              </tr>
            )}

            {filteredItems.map((feature) => (
              <tr key={feature.id} className="border-t">
                <td className="px-4 py-3 text-gray-500">#{feature.id}</td>
                <td className="px-4 py-3 font-medium">{feature.name}</td>
                <td className="px-4 py-3 text-gray-500">{feature.slug}</td>
                <td className="px-4 py-3 text-gray-500">
                  {formatDate(feature.created_at)}
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    <Link
                      href={`/admin/new-buildings/features/${feature.id}/edit`}
                    >
                      <Button size="sm" variant="outline">
                        <Pencil className="w-4 h-4 mr-1" /> Редактировать
                      </Button>
                    </Link>
                    <Button
                      size="sm"
                      variant="secondary"
                      className="text-red-600 border-red-300 hover:bg-red-50"
                      onClick={() => handleDelete(feature.id)}
                    >
                      <Trash2 className="w-4 h-4 mr-1" /> Удалить
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-500">
          Всего: {total} • Стр. {current} из {totalPages}
        </div>
        {totalPages > 1 && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              ← Пред
            </Button>
            <Button
              variant="outline"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              След →
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
