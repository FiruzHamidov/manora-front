'use client';

import { useState, type FormEvent, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { isAxiosError } from 'axios';
import { useManagedNewBuilding, useBuildingUnit, useBuildingBlocks, useCreateBuildingUnit, useUpdateBuildingUnit } from '@/services/new-buildings/hooks';
import { useEntrances, useLayouts } from '@/services/new-buildings/structure';
import { unitDraft, unitPayload, applyLayoutDefaults, rebaseUnitDraft, unitConflictChanges, type UnitDraft } from '@/services/new-buildings/unit-form';
import type { BuildingUnit, BuildingBlock } from '@/services/new-buildings/types';
import { Button } from '@/ui-components/Button';

const control = 'mt-1 w-full rounded-lg border border-gray-300 bg-white p-2 disabled:bg-gray-100';
const views = { courtyard: 'Во двор', street: 'На улицу', park: 'На парк', mountains: 'На горы', city: 'На город', panoramic: 'Панорамный' };
const conflictValueLabels: Partial<Record<keyof UnitDraft, Record<string, string>>> = {
  window_view: views,
  pricing_basis: { total: 'Общая стоимость', per_sqm: 'Цена за м²' },
  publication_status: { draft: 'Черновик', pending: 'На модерацию', published: 'Опубликована', rejected: 'Отклонена', archived: 'Архив' },
  availability_status: { available: 'Свободна', reserved: 'Бронь', sold: 'Продана', withdrawn: 'Снята с продажи' },
};

export function StructurePager({ page, last, onChange }: { page: number; last: number; onChange: (page: number) => void }) {
  return last > 1 ? <div className="flex items-center gap-3 text-sm"><button type="button" disabled={page <= 1} onClick={() => onChange(page - 1)}>← Назад</button><span>{page} / {last}</span><button type="button" disabled={page >= last} onClick={() => onChange(page + 1)}>Далее →</button></div> : null;
}

export default function UnitEditor({ buildingId, unitId }: { buildingId: number; unitId?: number }) {
  const building = useManagedNewBuilding(buildingId);
  const unit = useBuildingUnit(buildingId, unitId);
  const blocks = useBuildingBlocks(buildingId);
  if (!Number.isSafeInteger(buildingId) || buildingId < 1 || (unitId !== undefined && (!Number.isSafeInteger(unitId) || unitId < 1))) return <p role="alert">Некорректный адрес объекта.</p>;
  if (building.isLoading || blocks.isLoading || (unitId && unit.isLoading)) return <p>Загрузка редактора…</p>;
  if (!building.data?.data || (unitId && !unit.data)) return <p role="alert">Не удалось загрузить объект. Проверьте доступ и обновите страницу.</p>;
  if (!building.data.capabilities?.manage) return <p>Для этого ЖК доступен только просмотр.</p>;
  return <div className="space-y-5"><h1 className="text-2xl font-semibold">{unitId ? 'Редактирование квартиры' : 'Новая квартира'}</h1><p>{building.data.data.title}</p>
    {unitId && <Link href={`/admin/new-buildings/${buildingId}/units/${unitId}/drawings`} className="text-green-800 underline">Индивидуальные чертежи квартиры →</Link>}
    <UnitFields key={`${buildingId}:${unitId ?? 'new'}`} buildingId={buildingId} initial={unit.data} blocks={blocks.data ?? []}
      canSave={!building.isError && !unit.isError && !blocks.isError}
      refresh={async () => {
        const [result, blockResult] = await Promise.all([unit.refetch(), blocks.refetch()]);
        if (result.isError || blockResult.isError || !result.data) throw new Error('Не удалось загрузить актуальные данные. Ваш ввод сохранён; повторите загрузку или проверьте доступ.');
        if (result.data.id !== unitId || result.data.new_building_id !== buildingId) throw new Error('Ответ не соответствует редактируемой квартире.');
        return result.data;
      }} />
  </div>;
}

function UnitFields({ buildingId, initial, blocks, canSave, refresh }: { buildingId: number; initial?: BuildingUnit; blocks: BuildingBlock[]; canSave: boolean; refresh: () => Promise<BuildingUnit> }) {
  const [baseline, setBaseline] = useState(() => unitDraft(initial));
  const [draft, setDraft] = useState(() => unitDraft(initial));
  const [conflict, setConflict] = useState(false);
  const [latest, setLatest] = useState<BuildingUnit>();
  const [refreshing, setRefreshing] = useState(false);
  const [refreshError, setRefreshError] = useState('');
  const [message, setMessage] = useState('');
  const [notice, setNotice] = useState('');
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [layoutPage, setLayoutPage] = useState(1);
  const [entrancePage, setEntrancePage] = useState(1);
  const [chosenLayout, setChosenLayout] = useState(initial?.layout);
  const [chosenEntrance, setChosenEntrance] = useState(initial?.entrance);
  const [layoutSearch, setLayoutSearch] = useState('');
  const entrances = useEntrances(buildingId, Number(draft.block_id) || undefined, entrancePage);
  const layouts = useLayouts(buildingId, layoutPage, layoutSearch);
  const create = useCreateBuildingUnit(buildingId);
  const update = useUpdateBuildingUnit(buildingId, initial?.id ?? 0);
  const busy = create.isPending || update.isPending;
  const router = useRouter();
  const selectedLayout = layouts.data?.data.find(item => String(item.id) === draft.layout_id) ?? (chosenLayout?.id === Number(draft.layout_id) ? chosenLayout : undefined);
  const field = <K extends keyof UnitDraft>(key: K, value: UnitDraft[K]) => setDraft(previous => ({ ...previous, [key]: value }));
  const label = (key: keyof UnitDraft, title: string, child: ReactNode) => <label className="block text-sm" key={key}>{title}{child}{errors[key] && <span className="block text-red-700">{errors[key].join(' ')}</span>}</label>;
  const input = (key: keyof UnitDraft, title: string, mode?: 'decimal' | 'numeric') => label(key, title, <input className={control} value={String(draft[key] ?? '')} inputMode={mode} onChange={event => field(key, event.target.value)} aria-invalid={!!errors[key]} />);

  async function loadLatest() {
    setRefreshing(true); setRefreshError(''); setLatest(undefined);
    try { setLatest(await refresh()); }
    catch (error) { setRefreshError(error instanceof Error ? error.message : 'Не удалось загрузить актуальную версию.'); }
    finally { setRefreshing(false); }
  }

  function applyChanges() {
    if (!latest) return;
    try {
      const next = rebaseUnitDraft(baseline, draft, latest);
      setDraft(next); setBaseline(unitDraft(latest));
      if (String(latest.entrance?.id ?? '') === next.entrance_id) setChosenEntrance(latest.entrance);
      if (String(latest.layout?.id ?? '') === next.layout_id) setChosenLayout(latest.layout);
      setConflict(false); setLatest(undefined); setErrors({}); setRefreshError('');
      setMessage('');
      setNotice(`Правки перенесены в форму для версии ${latest.version}. Проверьте поля и нажмите «Сохранить квартиру»; запись пока не изменена.`);
    } catch (error) { setRefreshError(error instanceof Error ? error.message : 'Не удалось перенести правки.'); }
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!canSave || conflict || refreshing) return;
    setMessage(''); setNotice(''); setErrors({});
    try {
      const payload = unitPayload(draft);
      if (initial) await update.mutateAsync(payload); else await create.mutateAsync(payload);
      router.push(`/admin/new-buildings/${buildingId}/units`);
    } catch (error) {
      if (isAxiosError(error)) {
        setErrors(error.response?.data?.errors ?? {});
        if (initial && error.response?.status === 409 && error.response.data?.code === 'version_conflict') {
          setConflict(true);
          setMessage('Квартира изменена другим сотрудником. Ваши правки сохранены. Сравните версии перед повторным сохранением.');
          void loadLatest();
        } else setMessage(error.response?.data?.message ?? 'Не удалось сохранить квартиру.');
      } else setMessage(error instanceof Error ? error.message : 'Не удалось сохранить квартиру.');
    }
  }

  return <form onSubmit={submit} className="space-y-6">
    <p className="rounded-lg bg-blue-50 p-3 text-sm">Это уникальная квартира. Неизвестные параметры оставьте пустыми. Для публикации нужны фактическая площадь и комнатность; для шахматки — корпус, подъезд, этаж и позиция.</p>
    {initial && <p className="text-sm">Редактируется версия {draft.version}.</p>}
    {!canSave && <p role="alert">Актуальные данные или доступ не подтверждены. Ввод сохранён, отправка приостановлена.</p>}
    {message && <div role="alert" className="rounded-lg border border-red-300 p-3 text-red-800">{message}{Object.values(errors).flat().map((error, i) => <p key={i}>{error}</p>)}</div>}
    {notice && <p role="status" className="rounded-lg border border-green-300 p-3 text-green-900">{notice}</p>}
    {conflict && <section aria-label="Сравнение версий квартиры" className="space-y-3 rounded-xl border border-amber-400 bg-amber-50 p-4">
      <h2 className="font-semibold">Сравните изменения</h2>
      <p className="text-sm">Нетронутые вами поля будут взяты с сервера. Ваши изменения, включая связанные параметры цены и размещения, будут перенесены только после подтверждения. Конфликтующие поля останутся вашими.</p>
      {refreshing && <p role="status">Загрузка актуальной версии…</p>}
      {refreshError && <p role="alert">{refreshError}</p>}
      {latest && <>
        <p>Ваша исходная версия: {baseline.version}. На сервере: {latest.version}.</p>
        {latest.publication_status === 'archived' && <p role="alert">Квартира архивирована. Правки сохранены в форме, автоматического восстановления нет.</p>}
        <div className="overflow-x-auto" role="region" aria-label="Изменённые поля квартиры" tabIndex={0}><table className="w-full text-left text-sm">
          <thead><tr>{['Поле', 'Было', 'На сервере', 'Ваша форма', 'После переноса'].map(title => <th key={title} className="p-2">{title}</th>)}</tr></thead>
          <tbody>{unitConflictChanges(baseline, draft, latest).map(row => <tr key={row.key} className="border-t align-top">
            <th className="p-2">{row.label}</th>{[row.before, row.current, row.local, row.keepLocal ? row.local : row.current].map((value, i) => <td key={i} className="max-w-60 whitespace-pre-wrap break-words p-2">{typeof value === 'boolean' ? (value ? 'Да' : 'Нет') : conflictValueLabels[row.key]?.[value] ?? (value || 'Не указано')}</td>)}
          </tr>)}</tbody>
        </table></div>
        <button type="button" disabled={busy || refreshing || !canSave || latest.publication_status === 'archived' || latest.version <= (baseline.version ?? 0)} onClick={applyChanges} className="min-h-11 rounded-lg border border-amber-700 px-3 py-2 disabled:opacity-50">Применить мои правки к версии {latest.version}</button>
      </>}
      <button type="button" disabled={refreshing || busy} onClick={() => void loadLatest()} className="ml-3 min-h-11 underline disabled:opacity-50">Загрузить актуальную версию</button>
    </section>}
    <fieldset disabled={busy} className="space-y-5">
      <legend className="font-semibold">Идентификация и размещение</legend>
      <div className="grid gap-4 md:grid-cols-3">
        {input('name', 'Название (необязательно)')}{input('number', 'Фактический номер квартиры')}{input('external_id', 'Внешний ID для импорта')}
        {label('block_id', 'Корпус', <select className={control} value={draft.block_id} onChange={event => { setDraft(previous => ({ ...previous, block_id: event.target.value, entrance_id: '', position_on_floor: '' })); setEntrancePage(1); }}><option value="">Не указан</option>{blocks.filter(item => !item.archived_at || String(item.id) === draft.block_id).map(item => <option value={item.id} key={item.id}>{item.name}{item.archived_at ? ' (архив)' : ''}</option>)}</select>)}
        {label('entrance_id', 'Подъезд', <select className={control} disabled={!draft.block_id} value={draft.entrance_id} onChange={event => { setDraft(previous => ({ ...previous, entrance_id: event.target.value, position_on_floor: '' })); setChosenEntrance(entrances.data?.data.find(item => item.id === Number(event.target.value))); }}><option value="">Не указан</option>{chosenEntrance && !entrances.data?.data.some(item => item.id === chosenEntrance.id) && String(chosenEntrance.block_id) === draft.block_id && <option value={chosenEntrance.id}>{chosenEntrance.name} (сохранённый)</option>}{entrances.data?.data.filter(item => !item.archived_at || String(item.id) === draft.entrance_id).map(item => <option value={item.id} key={item.id}>{item.name}{item.archived_at ? ' (архив)' : ''}</option>)}</select>)}
        {input('floor', 'Этаж', 'numeric')}{input('position_on_floor', 'Позиция на этаже', 'numeric')}
      </div>
      <StructurePager page={entrancePage} last={entrances.data?.last_page ?? 1} onChange={setEntrancePage} />
      {entrances.isError && <p role="alert">Не удалось загрузить подъезды.</p>}
      <Link className="text-green-800 underline" href={`/admin/new-buildings/${buildingId}/structure`}>Управление подъездами и типовыми планировками</Link>
      <div className="grid gap-4 md:grid-cols-3">
        <label className="text-sm">Поиск кода планировки<input className={control} value={layoutSearch} onChange={event => { setLayoutSearch(event.target.value); setLayoutPage(1); }} /></label>
        {label('layout_id', 'Типовая планировка', <select className={control} value={draft.layout_id} onChange={event => { field('layout_id', event.target.value); setChosenLayout(layouts.data?.data.find(item => item.id === Number(event.target.value))); }}><option value="">Не указана</option>{chosenLayout && !layouts.data?.data.some(item => item.id === chosenLayout.id) && <option value={chosenLayout.id}>{chosenLayout.code} (сохранённая)</option>}{layouts.data?.data.filter(item => !item.archived_at || String(item.id) === draft.layout_id).map(item => <option key={item.id} value={item.id}>{item.code} {item.name}{item.archived_at ? ' (архив)' : ''}</option>)}</select>)}
        <button type="button" className="rounded-lg border px-3 py-2 text-sm" disabled={!selectedLayout} onClick={() => selectedLayout && setDraft(previous => applyLayoutDefaults(previous, selectedLayout))}>Заполнить пустые параметры из планировки</button>
      </div>
      <StructurePager page={layoutPage} last={layouts.data?.last_page ?? 1} onChange={setLayoutPage} />
      {layouts.isError && <p role="alert">Не удалось загрузить планировки.</p>}
      <p className="text-xs text-gray-600">Привязка не меняет параметры квартиры автоматически. Кнопка переносит только незаполненные площади и комнатность; проверьте их по фактическому лоту.</p>
      <div className="grid gap-4 md:grid-cols-3">
        {label('rooms', 'Комнатность', <select className={control} value={draft.rooms} onChange={event => field('rooms', event.target.value)}><option value="">Неизвестно</option><option value="0">Студия (подтверждено)</option>{Array.from({ length: 10 }, (_, i) => <option key={i + 1} value={i + 1}>{i + 1}</option>)}</select>)}
        {input('bathrooms', 'Санузлы', 'numeric')}{input('area', 'Общая площадь, м²', 'decimal')}{input('living_area', 'Жилая площадь, м²', 'decimal')}{input('kitchen_area', 'Кухня, м²', 'decimal')}{input('finishing', 'Отделка')}
        {label('window_view', 'Вид из окон', <select className={control} value={draft.window_view} onChange={event => field('window_view', event.target.value)}><option value="">Не указан</option>{Object.entries(views).map(([value, title]) => <option key={value} value={value}>{title}</option>)}</select>)}
      </div>
      <h2 className="font-semibold">Цена в TJS</h2>
      <label className="flex items-center gap-2"><input type="checkbox" checked={draft.on_request} onChange={event => field('on_request', event.target.checked)} />Цена по запросу</label>
      <div className="grid gap-4 md:grid-cols-3">
        {label('pricing_basis', 'Основание цены', <select className={control} value={draft.pricing_basis} onChange={event => setDraft(previous => ({ ...previous, pricing_basis: event.target.value as UnitDraft['pricing_basis'], amount: '' }))}><option value="total">Общая стоимость</option><option value="per_sqm">Цена за м²</option></select>)}
        {label('amount', draft.pricing_basis === 'total' ? 'Общая сумма' : 'Сумма за м²', <input className={control} inputMode="decimal" disabled={draft.on_request} value={draft.amount} onChange={event => field('amount', event.target.value)} />)}
        {input('discount_price', 'Скидочная общая цена (если есть)', 'decimal')}
      </div>
      <p className="text-xs text-gray-600">Производная цена рассчитывается сервером после сохранения. При неизвестной площади она остаётся неизвестной. Смена основания очищает сумму.</p>
      <div className="grid gap-4 md:grid-cols-2">
        {label('publication_status', 'Публикация', <select className={control} value={draft.publication_status} onChange={event => field('publication_status', event.target.value as UnitDraft['publication_status'])}><option value="draft">Черновик</option><option value="pending">Отправить на модерацию</option>{draft.publication_status === 'archived' && <option value="archived">Архив</option>}</select>)}
        {label('availability_status', 'Доступность', <select className={control} value={draft.availability_status} onChange={event => field('availability_status', event.target.value as UnitDraft['availability_status'])}><option value="available">Свободна</option><option value="reserved">Бронь</option><option value="sold">Продана</option><option value="withdrawn">Снята с продажи</option></select>)}
      </div>
      {label('description', 'Описание', <textarea className={control} rows={4} value={draft.description} onChange={event => field('description', event.target.value)} />)}
      {input('reason', 'Комментарий к изменению')}
      <div className="flex gap-4"><Button type="submit" disabled={busy || !canSave || conflict || refreshing}>{busy ? 'Сохранение…' : 'Сохранить квартиру'}</Button><Link className="p-2 underline" href={`/admin/new-buildings/${buildingId}/units`}>Отмена</Link></div>
    </fieldset>
  </form>;
}
