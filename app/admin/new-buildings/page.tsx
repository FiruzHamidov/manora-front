'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/ui-components/Button';
import { Input } from '@/ui-components/Input';
import { Select } from '@/ui-components/Select';
import {
  useConstructionStages,
  useDeleteNewBuilding,
  useDevelopers,
  useNewBuildings,
} from '@/services/new-buildings/hooks';
import type {
  NewBuilding,
  Paginated,
  Developer,
  ConstructionStage,
} from '@/services/new-buildings/types';
import { Eye, Pencil, Plus, Trash2 } from 'lucide-react';
import { toast } from 'react-toastify';

type NBWithRelations = NewBuilding & {
  developer?: Pick<Developer, 'id' | 'name'> | null;
  stage?: Pick<ConstructionStage, 'id' | 'name'> | null;
  location?: { city?: string | null } | null;
};

export default function NewBuildingsIndexPage() {
  const [page, setPage] = useState(1);
  const [perPage] = useState(15);
  const [search, setSearch] = useState('');

  const [developerId, setDeveloperId] = useState<number>(0);
  const [stageId, setStageId] = useState<number>(0);

  const { data } = useNewBuildings({
    page,
    per_page: perPage,
    developer_id: developerId === 0 ? undefined : developerId,
    stage_id: stageId === 0 ? undefined : stageId,
    search: search || undefined,
  });

  const { data: developersPg } = useDevelopers();
  const { data: stagesPg } = useConstructionStages();

  // @ts-expect-error ignore
  const developers: Developer[] = developersPg?.data ?? [];
  const stages: ConstructionStage[] = stagesPg?.data ?? [];

  const del = useDeleteNewBuilding();

  const list = data as Paginated<NewBuilding> | undefined;
  const total = list?.total ?? 0;
  const current = list?.current_page ?? 1;
  const items: NewBuilding[] = list?.data ?? [];

  const totalPages = useMemo(() => {
    if (!total) return 1;
    return Math.max(1, Math.ceil(total / perPage));
  }, [total, perPage]);

  const handleDelete = async (id: number) => {
    if (!confirm('Удалить новостройку? Это действие необратимо.')) return;
    try {
      await del.mutateAsync(id);
    } catch {
      toast.error('Ошибка при удалении');
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
            placeholder="Например: Гиссар Резиденс"
          />

          <Select
            label="Застройщик"
            name="developer_id"
            value={developerId.toString()}
            onChange={(e) => {
              setDeveloperId(Number(e.target.value));
              setPage(1);
            }}
            options={[
              { id: 0, name: 'Все' },
              ...developers.map((d) => ({
                id: Number(d.id),
                name: d.name,
              })),
            ]}
          />

          <Select
            label="Этап строительства"
            name="stage_id"
            value={stageId.toString()}
            onChange={(e) => {
              setStageId(Number(e.target.value));
              setPage(1);
            }}
            options={[
              { id: 0, name: 'Все' },
              ...stages.map((s) => ({
                id: Number(s.id),
                name: s.name,
              })),
            ]}
          />
        </div>

        <Link href="/admin/new-buildings/create">
          <Button className="w-full sm:w-auto">
            <Plus className="w-4 h-4 mr-2" /> Добавить
          </Button>
        </Link>
      </div>

      <div className="overflow-x-auto border rounded-2xl">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr className="text-left">
              <th className="px-4 py-3">Название</th>
              <th className="px-4 py-3">Застройщик</th>
              <th className="px-4 py-3">Этап</th>
              <th className="px-4 py-3">Город</th>
              <th className="px-4 py-3">Срок сдачи</th>
              <th className="px-4 py-3">Статус</th>
              <th className="px-4 py-3 text-right">Действия</th>
            </tr>
          </thead>
          <tbody>
            {list === undefined && (
              <tr>
                <td className="px-4 py-6 text-center" colSpan={7}>
                  Загрузка...
                </td>
              </tr>
            )}

            {list !== undefined && items.length === 0 && (
              <tr>
                <td className="px-4 py-6 text-center" colSpan={7}>
                  Пусто
                </td>
              </tr>
            )}

            {(items as NBWithRelations[]).map((nb) => (
              <tr key={nb.id} className="border-t">
                <td className="px-4 py-3">{nb.title}</td>
                <td className="px-4 py-3">{nb.developer?.name ?? '-'}</td>
                <td className="px-4 py-3">{nb.stage?.name ?? '-'}</td>
                <td className="px-4 py-3">{nb.location?.city ?? '-'}</td>
                <td className="px-4 py-3">
                  {nb.completion_at
                    ? new Date(nb.completion_at).toLocaleDateString()
                    : '-'}
                </td>
                <td className="px-4 py-3 capitalize">{nb.moderation_status}</td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    <Link href={`/admin/new-buildings/${nb.id}`}>
                      <Button size="sm" variant="outline">
                        <Eye className="w-4 h-4 mr-1" /> Просмотр
                      </Button>
                    </Link>
                    <Link href={`/admin/new-buildings/${nb.id}/edit`}>
                      <Button size="sm" variant="outline">
                        <Pencil className="w-4 h-4 mr-1" /> Редакт.
                      </Button>
                    </Link>
                    <Button
                      size="sm"
                      variant="secondary"
                      className="text-red-600 border-red-300 hover:bg-red-50"
                      onClick={() => handleDelete(nb.id)}
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

      {/* Пагинация */}
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
