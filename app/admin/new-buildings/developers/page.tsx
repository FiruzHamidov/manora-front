'use client';

import { useMemo, useState } from 'react';
import { Plus, Eye, Pencil, Trash2, ExternalLink } from 'lucide-react';
import {
  useDeleteDeveloper,
  useDevelopers,
} from '@/services/new-buildings/hooks';
import { Button } from '@/ui-components/Button';
import { Input } from '@/ui-components/Input';
import { Paginated, Developer } from '@/services/new-buildings/types';
import { toast } from 'react-toastify';
import Image from 'next/image';
import InstagramIcon from '@/icons/InstagramIcon';
import Link from 'next/link';

export default function DevelopersIndexPage() {
  const { data: developers } = useDevelopers();

  const deleteDeveloper = useDeleteDeveloper();

  const list = developers as Paginated<Developer> | undefined;
  const total = list?.total ?? 0;
  const current = list?.current_page ?? 1;

  const [page, setPage] = useState(1);
  const [perPage] = useState(15);
  const [search, setSearch] = useState('');

  const totalPages = useMemo(() => {
    if (!total) return 1;
    return Math.max(1, Math.ceil(total / perPage));
  }, [total, perPage]);

  const handleDelete = async (id: number) => {
    if (!confirm('Удалить застройщика? Это действие необратимо.')) return;
    try {
      await deleteDeveloper.mutateAsync(id);
    } catch {
      toast.error('Ошибка при удалении застройщика');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end gap-3">
        <div className="grow grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Input
            name="search"
            label="Поиск по названию"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Например: СтройИнвест"
          />
        </div>

        <Link href="/admin/new-buildings/developers/create">
          <Button className="w-full sm:w-auto cursor-pointer">
            <Plus className="w-4 h-4 mr-2" /> Добавить
          </Button>
        </Link>
      </div>

      <div className="overflow-x-auto border rounded-2xl">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr className="text-left">
              <th className="px-4 py-3">Логотип</th>
              <th className="px-4 py-3">Название</th>
              <th className="px-4 py-3">Год основания</th>
              <th className="px-4 py-3">Телефон</th>
              <th className="px-4 py-3">Проекты</th>
              <th className="px-4 py-3">Статус</th>
              <th className="px-4 py-3">Соцсети</th>
              <th className="px-4 py-3 text-right">Действия</th>
            </tr>
          </thead>
          <tbody>
            {list === undefined && (
              <tr>
                <td className="px-4 py-6 text-center" colSpan={8}>
                  Загрузка...
                </td>
              </tr>
            )}
            {/* @ts-expect-error TS2322 */}
            {list !== undefined && developers?.data.length === 0 && (
              <tr>
                <td className="px-4 py-6 text-center" colSpan={8}>
                  Пусто
                </td>
              </tr>
            )}
            {/* @ts-expect-error TS2322 */}
            {developers?.data.map((dev) => (
              <tr key={dev.id} className="border-t">
                <td className="px-4 py-3">
                  {dev.logo_path && (
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-100">
                      <Image
                        src={`${process.env.NEXT_PUBLIC_STORAGE_URL}/${dev.logo_path}`}
                        alt={dev.name}
                        width={40}
                        height={40}
                        className="object-cover"
                      />
                    </div>
                  )}
                </td>
                <td className="px-4 py-3 font-medium">
                  <div>{dev.name}</div>
                  {dev.website && (
                    <a
                      href={dev.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                    >
                      {dev.website.replace(/^https?:\/\//, '')}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </td>
                <td className="px-4 py-3">{dev.founded_year || '—'}</td>
                <td className="px-4 py-3">{dev.phone || '—'}</td>
                <td className="px-4 py-3">
                  <div className="space-y-1">
                    <div>Всего: {dev.total_projects || 0}</div>
                    <div className="text-xs">
                      Построено: {dev.built_count || 0}
                    </div>
                    <div className="text-xs">
                      Строится: {dev.under_construction_count || 0}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`px-2 py-1 rounded-full text-xs
                    ${
                      dev.moderation_status === 'approved'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    {dev.moderation_status === 'approved'
                      ? 'Активен'
                      : 'На модерации'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    {dev.instagram && (
                      <a
                        href={dev.instagram}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-500 hover:text-[#0036A5]"
                      >
                        <InstagramIcon />
                      </a>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    <Link href={`/admin/new-buildings/developers/${dev.id}`}>
                      <Button
                        size="sm"
                        variant="outline"
                        className="cursor-pointer"
                      >
                        <Eye className="w-4 h-4 mr-1" /> Просмотр
                      </Button>
                    </Link>
                    <Link
                      href={`/admin/new-buildings/developers/${dev.id}/edit`}
                    >
                      <Button
                        size="sm"
                        variant="outline"
                        className="cursor-pointer"
                      >
                        <Pencil className="w-4 h-4 mr-1" /> Редакт.
                      </Button>
                    </Link>
                    <Button
                      size="sm"
                      variant="secondary"
                      className="text-red-600 border-red-300 hover:bg-red-50 cursor-pointer"
                      onClick={() => handleDelete(dev.id)}
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
      </div>
    </div>
  );
}
