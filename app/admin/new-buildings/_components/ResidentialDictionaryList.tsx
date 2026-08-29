'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useMe } from '@/services/login/hooks';
import { isPlatformAdminRole } from '@/constants/roles';
import { Button } from '@/ui-components/Button';
import { Input } from '@/ui-components/Input';
import { useResidentialDictionaryPage } from '@/services/dictionaries/use-residential-dictionary-page';
import { parseDictionaryError } from '@/services/dictionaries/utils';
import { residentialDictionaryPaths, type ResidentialDictionaryResource } from '@/services/dictionaries/residential-editor';
import DictionaryDeleteDialog, { type DictionaryDeleteTarget } from '@/app/admin/dictionaries/_components/DictionaryDeleteDialog';
import DictionaryPagination from './DictionaryPagination';

type Resource = Exclude<ResidentialDictionaryResource, 'developers'>;
type Entry = { id: number; name: string; slug: string; created_at: string | null; sort_order?: number; is_active?: boolean };
const titles: Record<Resource, string> = { materials: 'Материалы', features: 'Особенности', 'construction-stages': 'Этапы строительства' };

export default function ResidentialDictionaryList({ resource }: { resource: Resource }) {
  const me = useMe();
  const canManage = me.data?.status === 'active' && isPlatformAdminRole(me.data?.role?.slug);
  const query = useResidentialDictionaryPage<Entry>(resource);
  const [deleteTarget, setDeleteTarget] = useState<DictionaryDeleteTarget | null>(null);
  const base = residentialDictionaryPaths[resource];
  const stages = resource === 'construction-stages';
  const rows = query.isError ? [] : query.data?.data ?? [];
  return <section className="min-w-0 space-y-6">
    <h1 className="text-2xl font-semibold">{titles[resource]}</h1>
    <div className="flex flex-wrap items-end gap-3">
      <div className="min-w-0 grow"><Input name="search" label="Поиск по названию или slug" maxLength={255} value={query.params.search} onChange={e => query.setSearch(e.target.value)} /></div>
      <Link href={`${base}/create`} className="rounded-lg bg-[#006341] px-6 py-3 text-white">Добавить</Link>
    </div>
    {query.isError && <div role="alert" className="text-red-700">Не удалось загрузить справочник. {parseDictionaryError(query.error).message} <Button variant="outline" onClick={() => void query.refetch()}>Повторить</Button></div>}
    <div className="overflow-x-auto rounded-2xl border" role="region" aria-label={`Таблица: ${titles[resource]}`} tabIndex={0}>
      <table className="min-w-full text-sm">
        <thead className="bg-gray-50 text-left"><tr>
          <th className="p-3">ID</th><th className="p-3">Название</th><th className="p-3">Slug</th>
          {stages && <><th className="p-3">Порядок</th><th className="p-3">Активность</th></>}
          <th className="p-3">Дата создания</th><th className="p-3">Действия</th>
        </tr></thead>
        <tbody>
          {query.isPending && <tr><td colSpan={stages ? 7 : 5} className="p-6 text-center" role="status">Загрузка…</td></tr>}
          {!query.isPending && !query.isError && rows.length === 0 && <tr><td colSpan={stages ? 7 : 5} className="p-6 text-center">По вашему запросу ничего не найдено</td></tr>}
          {rows.map(record => <tr key={record.id} className="border-t">
            <td className="p-3">#{record.id}</td><td className="p-3 font-medium">{record.name}</td><td className="p-3">{record.slug}</td>
            {stages && <><td className="p-3">{record.sort_order ?? '—'}</td><td className="p-3">{record.is_active ? 'Активен' : 'Неактивен'}</td></>}
            <td className="p-3">{record.created_at ? new Date(record.created_at).toLocaleDateString('ru-RU') : '—'}</td>
            <td className="p-3">{canManage && <div className="flex gap-2">
              <Link href={`${base}/${record.id}/edit`} className="rounded-lg border px-3 py-2">Редактировать</Link>
              <Button size="sm" variant="secondary" onClick={() => setDeleteTarget({ id: record.id, label: record.name })}>Удалить</Button>
            </div>}</td>
          </tr>)}
        </tbody>
      </table>
    </div>
    <DictionaryPagination data={query.isError ? undefined : query.data} busy={query.isFetching} perPage={query.params.per_page} setPage={query.setPage} setPerPage={query.setPerPage} />
    <DictionaryDeleteDialog resource={resource} target={deleteTarget} onClose={() => setDeleteTarget(null)} onCompleted={query.afterDelete} />
  </section>;
}
