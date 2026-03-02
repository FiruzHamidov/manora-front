'use client';

import { useMemo, useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import {
  useMaterials,
  useDeleteMaterial,
} from '@/services/new-buildings/hooks';
import { Button } from '@/ui-components/Button';
import { Input } from '@/ui-components/Input';
import { Material, Paginated } from '@/services/new-buildings/types';
import { toast } from 'react-toastify';
import Link from 'next/link';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

export default function MaterialsIndexPage() {
  const { data: materials } = useMaterials();
  const deleteMaterial = useDeleteMaterial();

  const list = materials as Paginated<Material> | undefined;
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
    if (!confirm('Удалить этот материал? Это действие необратимо.')) return;
    try {
      await deleteMaterial.mutateAsync(id);
      toast.success('Материал успешно удален');
    } catch {
      toast.error('Ошибка при удалении материала');
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
            placeholder="Например: Кирпич"
          />
        </div>

        <Link href="/admin/new-buildings/materials/create">
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
                    : 'Материалы не найдены'}
                </td>
              </tr>
            )}

            {filteredItems.map((material) => (
              <tr key={material.id} className="border-t">
                <td className="px-4 py-3 text-gray-500">#{material.id}</td>
                <td className="px-4 py-3 font-medium">{material.name}</td>
                <td className="px-4 py-3 text-gray-500">{material.slug}</td>
                <td className="px-4 py-3 text-gray-500">
                  {formatDate(material.created_at)}
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    <Link
                      href={`/admin/new-buildings/materials/${material.id}/edit`}
                    >
                      <Button size="sm" variant="outline">
                        <Pencil className="w-4 h-4 mr-1" /> Редактировать
                      </Button>
                    </Link>
                    <Button
                      size="sm"
                      variant="secondary"
                      className="text-red-600 border-red-300 hover:bg-red-50"
                      onClick={() => handleDelete(material.id)}
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
