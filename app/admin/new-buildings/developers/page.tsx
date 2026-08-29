'use client';

import { useState } from 'react';
import { useMe } from '@/services/login/hooks';
import { isPlatformAdminRole } from '@/constants/roles';
import { Plus, Eye, Pencil, Trash2, ExternalLink } from 'lucide-react';
import { useResidentialDictionaryPage } from '@/services/dictionaries/use-residential-dictionary-page';
import DictionaryPagination from '../_components/DictionaryPagination';
import { parseDictionaryError } from '@/services/dictionaries/utils';
import { Button } from '@/ui-components/Button';
import { Input } from '@/ui-components/Input';
import { Developer } from '@/services/new-buildings/types';
import Image from 'next/image';
import InstagramIcon from '@/icons/InstagramIcon';
import Link from 'next/link';
import DictionaryDeleteDialog, { DictionaryDeleteTarget } from '@/app/admin/dictionaries/_components/DictionaryDeleteDialog';

export default function DevelopersIndexPage() {
  const me = useMe();
  const canManage = me.data?.status === 'active' && isPlatformAdminRole(me.data?.role?.slug);
  const query = useResidentialDictionaryPage<Developer>('developers');
  const list = query.isError ? undefined : query.data;
  const [deleteTarget, setDeleteTarget] = useState<DictionaryDeleteTarget | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end gap-3">
        <div className="grow grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Input
            name="search"
            label="Поиск по названию, телефону или сайту"
            maxLength={255}
            value={query.params.search}
            onChange={(e) => {
              query.setSearch(e.target.value);
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

      {query.isError && <div role="alert" className="text-red-700">Не удалось загрузить справочник. {parseDictionaryError(query.error).message} <Button onClick={() => void query.refetch()}>Повторить</Button></div>}
      <div className="overflow-x-auto border rounded-2xl" role="region" aria-label="Таблица: Застройщики" tabIndex={0}>
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
            {query.isPending && (
              <tr>
                <td className="px-4 py-6 text-center" colSpan={8}>
                  Загрузка...
                </td>
              </tr>
            )}
            {list !== undefined && list?.data.length === 0 && (
              <tr>
                <td className="px-4 py-6 text-center" colSpan={8}>
                  Пусто
                </td>
              </tr>
            )}
            {list?.data.map((dev) => (
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
                      className="text-xs text-[#006341] hover:underline flex items-center gap-1"
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
                    {({ approved: 'Одобрено', pending: 'На модерации', rejected: 'Отклонено', draft: 'Черновик', deleted: 'Удалено' }[dev.moderation_status || 'pending'] ?? 'Не указан')}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    {dev.instagram && (
                      <a
                        href={dev.instagram}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-500 hover:text-[#006341]"
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
                    {canManage && <>
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
                      onClick={() => setDeleteTarget({ id: dev.id, label: dev.name })}
                    >
                      <Trash2 className="w-4 h-4 mr-1" /> Удалить
                    </Button>
                    </>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <DictionaryPagination data={list} busy={query.isFetching} perPage={query.params.per_page} setPage={query.setPage} setPerPage={query.setPerPage} />
      <DictionaryDeleteDialog resource="developers" target={deleteTarget} onClose={() => setDeleteTarget(null)} onCompleted={query.afterDelete} />
    </div>
  );
}
