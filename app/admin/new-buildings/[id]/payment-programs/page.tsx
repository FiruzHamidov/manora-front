'use client';

import { useState, type FormEvent } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { isAxiosError } from 'axios';
import { useBuildingBlocks, useBuildingUnits, useManagedNewBuilding } from '@/services/new-buildings/hooks';
import { useManagedPaymentPrograms, useChangePaymentProgram } from '@/services/new-buildings/use-payment-programs';
import { paymentKinds, paymentMethods, paymentScopes, type ManagedPaymentProgram, type ManagedPaymentPrograms, type PaymentProgramFields } from '@/services/new-buildings/payment-programs';
import { structureError } from '@/services/new-buildings/structure';
import { unitPrice } from '@/services/new-buildings/public-unit';

const button = 'min-h-11 rounded-xl border border-[#006341] px-3 py-2 text-[#006341] focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-40';
const input = 'mt-1 min-h-11 w-full min-w-0 rounded-lg border p-2';
const empty: PaymentProgramFields = { name: '', kind: 'installment', provider: null, currency: 'TJS', scope_type: 'building', calculation_method: null, rate_percent: null, fee_amount: null, min_down_payment_percent: null, term_min_months: null, term_max_months: null, payment_interval_months: null, custom_schedule: null, terms: null, source: null, valid_from: null, valid_to: null, verified_at: null };
type Editor = { program: ManagedPaymentProgram | null; version: number };

export default function PaymentProgramsPage() {
  const { id } = useParams<{ id: string }>(), buildingId = Number(id);
  const [page, setPage] = useState(1), [editor, setEditor] = useState<Editor | null>(null);
  const [archive, setArchive] = useState<Editor | null>(null), [error, setError] = useState('');
  const building = useManagedNewBuilding(buildingId), programs = useManagedPaymentPrograms(buildingId, page), mutation = useChangePaymentProgram(buildingId);
  const canManage = building.data?.capabilities?.manage === true && !building.isError && !programs.isError;
  async function confirmArchive() {
    if (!archive?.program || !canManage || mutation.isPending) return;
    try { await mutation.mutateAsync({ id: archive.program.id, version: archive.version, archived: !archive.program.archived_at }); setArchive(null); setError(''); }
    catch (e) { setError(structureError(e)); setArchive(null); }
  }
  if (building.isLoading) return <p>Загрузка ЖК…</p>;
  if (!building.data?.data) return <p role="alert">ЖК недоступен.</p>;
  return <div className="min-w-0 space-y-5">
    <h1 className="break-words text-2xl font-bold">Условия покупки — {building.data.data.title}</h1>
    <Link href={'/admin/new-buildings/' + buildingId} className="inline-flex min-h-11 items-center text-green-800 underline">← К жилому комплексу</Link>
    <p>Добавляйте только реальные программы. Без даты проверки программа остаётся черновиком. Любое изменение требует повторной модерации ЖК. Архив сохраняет историю условий.</p>
    <button className={button} disabled={programs.isFetching || building.isFetching} onClick={() => { void programs.refetch(); void building.refetch(); }}>Обновить программы</button>
    {(programs.isError || building.isError) && <p role="alert">Данные не получены. Ввод сохранён, отправка приостановлена.</p>}
    {programs.isLoading && <p role="status">Загрузка программ…</p>}{error && <p role="alert">{error}</p>}
    {programs.data && <>
      <p>Программ, включая архив: {programs.data.meta.total} · Версия ЖК: {programs.data.version}</p>
      {canManage && <button className={button} disabled={!!editor || !!archive || mutation.isPending} onClick={() => setEditor({ program: null, version: programs.data!.version })}>Добавить программу</button>}
      {editor && <ProgramEditor buildingId={buildingId} initial={editor} current={programs.data} disabled={!canManage} onClose={() => setEditor(null)} />}
      {archive?.program && <div role="group" aria-label="Подтверждение изменения архива" className="space-y-3 rounded-xl border p-4">
        <p>{archive.program.archived_at ? 'Восстановить' : 'Архивировать'} «{archive.program.name}»? ЖК будет отправлен на повторную модерацию.</p>
        <button className={button} disabled={!canManage || mutation.isPending} onClick={() => void confirmArchive()}>Подтвердить изменение архива</button>{' '}
        <button className={button} disabled={mutation.isPending} onClick={() => setArchive(null)}>Отмена</button>
      </div>}
      {!programs.data.data.length && <p>Программы ещё не добавлены. Ставки и комиссии не заполняются автоматически.</p>}
      <ul className="space-y-3">{programs.data.data.map(program => <li key={program.id} className="min-w-0 space-y-2 break-words rounded-xl border bg-white p-4">
        <h2 className="text-lg font-semibold">{program.name}</h2>
        <p>{paymentKinds[program.kind]} · {paymentScopes[program.scope_type]} · {program.archived_at ? 'В архиве' : program.verified_at ? 'Проверена ' + program.verified_at : 'Черновик — не проверена'}</p>
        <p>{program.provider || 'Поставщик условий не указан'} · {program.calculation_method ? paymentMethods[program.calculation_method] : 'Метод не указан'}</p>
        <p>Действует: {program.valid_from ?? '—'} — {program.valid_to ?? '—'} · Источник: {program.source ?? '—'}</p>
        {canManage && <div className="flex flex-wrap gap-3">
          {!program.archived_at && <button className={button} disabled={!!editor || !!archive || mutation.isPending} onClick={() => setEditor({ program, version: programs.data!.version })}>Изменить {program.name}</button>}
          <button className={button} disabled={!!editor || !!archive || mutation.isPending} onClick={() => setArchive({ program, version: programs.data!.version })}>{program.archived_at ? 'Восстановить' : 'В архив'} {program.name}</button>
        </div>}
      </li>)}</ul>
      <div className="flex flex-wrap items-center gap-3"><button className={button} disabled={page <= 1 || !!editor || !!archive || programs.isFetching} onClick={() => setPage(page - 1)}>Предыдущая страница</button><span>{page} / {programs.data.meta.last_page}</span><button className={button} disabled={page >= programs.data.meta.last_page || !!editor || !!archive || programs.isFetching} onClick={() => setPage(page + 1)}>Следующая страница</button></div>
    </>}
  </div>;
}

function ProgramEditor({ buildingId, initial, current, disabled, onClose }: { buildingId: number; initial: Editor; current: ManagedPaymentPrograms; disabled: boolean; onClose: () => void }) {
  const [draft, setDraft] = useState<PaymentProgramFields>(initial.program ?? empty), [blocks, setBlocks] = useState(initial.program?.block_ids ?? []), [units, setUnits] = useState(initial.program?.unit_ids ?? []);
  const [version, setVersion] = useState(initial.version), [reason, setReason] = useState(''), [error, setError] = useState(''), [conflict, setConflict] = useState(false);
  const mutation = useChangePaymentProgram(buildingId), latest = current.data.find(program => program.id === initial.program?.id);
  const missing = !!initial.program && !latest, archived = !!latest?.archived_at;
  const changed = current.version !== version || conflict;
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (disabled || missing || archived || changed || mutation.isPending) return;
    try { await mutation.mutateAsync({ id: initial.program?.id, version, reason, data: { ...draft, block_ids: blocks, unit_ids: units } }); onClose(); }
    catch (e) { setError(structureError(e)); setConflict(isAxiosError(e) && e.response?.status === 409); }
  }
  function changeScope(scope: PaymentProgramFields['scope_type']) { setDraft({ ...draft, scope_type: scope }); setBlocks([]); setUnits([]); }
  return <form onSubmit={submit} aria-label="Редактор программы оплаты" className="min-w-0 space-y-4 rounded-xl border-2 border-green-800 bg-white p-4">
    <h2 className="text-lg font-semibold">{initial.program ? 'Редактирование программы' : 'Новая программа'}</h2>
    {error && <p role="alert">{error}</p>}{missing && <p role="alert">Программа больше не находится на этой странице. Ввод сохранён. Обновите список перед продолжением.</p>}{archived && <p role="alert">Программа архивирована в другой вкладке. Редактирование приостановлено.</p>}
    <fieldset disabled={disabled || missing || archived || mutation.isPending} className="min-w-0 space-y-4">
      <div className="grid min-w-0 gap-4 lg:grid-cols-2">
        <label>Название программы<input className={input} required maxLength={200} value={draft.name} onChange={e => setDraft({ ...draft, name: e.target.value })} /></label>
        <label>Тип программы<select className={input} value={draft.kind} onChange={e => setDraft({ ...draft, kind: e.target.value as PaymentProgramFields['kind'] })}>{Object.entries(paymentKinds).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
        <label>Банк или застройщик<input className={input} maxLength={200} value={draft.provider ?? ''} onChange={e => setDraft({ ...draft, provider: e.target.value || null })} /></label>
        <label>Метод расчёта<select className={input} value={draft.calculation_method ?? ''} onChange={e => setDraft({ ...draft, calculation_method: (e.target.value || null) as PaymentProgramFields['calculation_method'], custom_schedule: null, payment_interval_months: null })}><option value="">Не указан</option>{Object.entries(paymentMethods).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
        {(['rate_percent', 'fee_amount', 'min_down_payment_percent'] as const).map(field => <label key={field}>{{ rate_percent: draft.calculation_method === 'annuity' || draft.calculation_method === 'differentiated' ? 'Номинальная годовая ставка, %' : 'Разовая наценка на остаток, %', fee_amount: 'Комиссия при оформлении, TJS', min_down_payment_percent: 'Минимальный первоначальный взнос, %' }[field]}<input className={input} inputMode="decimal" maxLength={18} value={draft[field] ?? ''} onChange={e => setDraft({ ...draft, [field]: e.target.value.replace(',', '.') || null })} /></label>)}
        {(['term_min_months', 'term_max_months', ...(draft.calculation_method !== 'custom' ? ['payment_interval_months' as const] : [])] as const).map(field => <label key={field}>{{ term_min_months: 'Минимальный срок, месяцев', term_max_months: 'Максимальный срок, месяцев', payment_interval_months: 'Платёж каждые N месяцев' }[field]}<input className={input} type="number" min={1} max={field === 'payment_interval_months' ? 12 : 600} step={1} value={draft[field] ?? ''} onChange={e => setDraft({ ...draft, [field]: e.target.value === '' ? null : Number(e.target.value) })} /></label>)}
      </div>
      <p className="text-sm">Валюта — TJS. Нулевая ставка и комиссия указываются явно. Комиссия оплачивается сразу и не включается в долг. Для равномерной беспроцентной программы наценка должна быть 0.</p>
      {draft.calculation_method === 'custom' && <div className="space-y-3"><p>Индивидуальный график: месяцы от начала финансирования и доли долга после наценки. Сумма долей — 100%, последний месяц равен фиксированному сроку (минимум = максимум).</p>
        {(draft.custom_schedule ?? []).map((row, index) => <div key={index} className="grid grid-cols-2 gap-2"><label>Месяц платежа {index + 1}<input className={input} type="number" min={1} max={600} value={row.month || ''} onChange={e => setDraft({ ...draft, custom_schedule: draft.custom_schedule!.map((value, i) => i === index ? { ...value, month: Number(e.target.value) } : value) })} /></label><label>Доля платежа {index + 1}, %<input className={input} inputMode="decimal" value={row.percent} onChange={e => setDraft({ ...draft, custom_schedule: draft.custom_schedule!.map((value, i) => i === index ? { ...value, percent: e.target.value.replace(',', '.') } : value) })} /></label><button className={button} type="button" onClick={() => setDraft({ ...draft, custom_schedule: draft.custom_schedule!.filter((_, i) => i !== index) })}>Удалить платёж {index + 1}</button></div>)}
        <button className={button} type="button" disabled={(draft.custom_schedule?.length ?? 0) >= 600} onClick={() => setDraft({ ...draft, custom_schedule: [...(draft.custom_schedule ?? []), { month: 0, percent: '' }] })}>Добавить платёж</button>
      </div>}
      <label className="block">Область действия<select className={input} value={draft.scope_type} onChange={e => changeScope(e.target.value as PaymentProgramFields['scope_type'])}>{Object.entries(paymentScopes).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
      {draft.scope_type === 'blocks' && <BlockTargets buildingId={buildingId} selected={blocks} onChange={setBlocks} />}
      {draft.scope_type === 'units' && <UnitTargets buildingId={buildingId} selected={units} onChange={setUnits} />}
      <label className="block">Полные условия<textarea rows={4} maxLength={10000} className={input} value={draft.terms ?? ''} onChange={e => setDraft({ ...draft, terms: e.target.value || null })} /></label>
      <label className="block">Источник подтверждения<input maxLength={1000} className={input} value={draft.source ?? ''} onChange={e => setDraft({ ...draft, source: e.target.value || null })} /></label>
      <div className="grid min-w-0 gap-4 lg:grid-cols-3">{(['valid_from', 'valid_to', 'verified_at'] as const).map(field => <label key={field}>{{ valid_from: 'Действует с', valid_to: 'Действует до включительно', verified_at: 'Дата проверки условий' }[field]}<input type="date" className={input} value={draft[field] ?? ''} onInput={e => setDraft({ ...draft, [field]: e.currentTarget.value || null })} onChange={e => setDraft({ ...draft, [field]: e.target.value || null })} /></label>)}</div>
      <p className="text-sm">Пустая дата проверки сохраняет черновик. Для проверенной программы нужны все условия, источник и даты действия. После модерации публикуются только действующие программы.</p>
      <label className="block">Причина изменения<textarea maxLength={1000} className={input} value={reason} onChange={e => setReason(e.target.value)} /></label>
      {changed && <div role="alert" className="space-y-3 break-words rounded-xl bg-amber-50 p-3"><p>ЖК изменён. Ваши поля сохранены. Сравните текущие условия перед сохранением поверх новой версии.</p>
        {latest ? <details><summary className="min-h-11 cursor-pointer">Текущая сохранённая программа</summary><pre className="whitespace-pre-wrap break-words text-xs">{JSON.stringify(latest, null, 2)}</pre></details> : <p>Сравните актуальный список программ ниже.</p>}
        <button type="button" className={button} disabled={current.version <= version || missing || archived} onClick={() => { setVersion(current.version); setConflict(false); setError(''); }}>Подтвердить актуальную версию ЖК</button>
      </div>}
      <button className={button} disabled={changed} type="submit">Сохранить программу</button>
    </fieldset>
    <button type="button" className={button} disabled={mutation.isPending} onClick={onClose}>Закрыть редактор программы</button>
  </form>;
}

function TargetChips({ selected, onChange }: { selected: number[]; onChange: (ids: number[]) => void }) {
  return <div className="space-y-2"><p>Выбрано: {selected.length}</p><div className="flex flex-wrap gap-2">{selected.map(id => <button key={id} className={button} type="button" onClick={() => onChange(selected.filter(value => value !== id))}>Убрать #{id}</button>)}</div></div>;
}
function BlockTargets({ buildingId, selected, onChange }: { buildingId: number; selected: number[]; onChange: (ids: number[]) => void }) {
  const query = useBuildingBlocks(buildingId);
  return <div className="space-y-2"><TargetChips selected={selected} onChange={onChange} />{query.isError ? <button type="button" className={button} onClick={() => void query.refetch()}>Повторить загрузку корпусов</button> : query.isLoading ? <p>Загрузка корпусов…</p> : <div className="space-y-2">{query.data?.filter(block => !block.archived_at).map(block => <label key={block.id} className="flex min-h-11 items-center gap-2"><input type="checkbox" checked={selected.includes(block.id)} disabled={!selected.includes(block.id) && selected.length >= 200} onChange={e => onChange(e.target.checked ? [...selected, block.id] : selected.filter(id => id !== block.id))} />{block.name} · #{block.id}</label>)}{!query.data?.length && <p>Корпуса не добавлены.</p>}</div>}</div>;
}
function UnitTargets({ buildingId, selected, onChange }: { buildingId: number; selected: number[]; onChange: (ids: number[]) => void }) {
  const [page, setPage] = useState(1), query = useBuildingUnits(buildingId, page, 20);
  return <div className="space-y-2"><TargetChips selected={selected} onChange={onChange} />{query.isError ? <button className={button} type="button" onClick={() => void query.refetch()}>Повторить загрузку квартир</button> : query.isLoading ? <p>Загрузка квартир…</p> : <>
    {query.data?.data.filter(unit => unit.publication_status !== 'archived').map(unit => <label key={unit.id} className="flex min-h-11 items-start gap-2 break-words"><input className="mt-1" type="checkbox" checked={selected.includes(unit.id)} disabled={!selected.includes(unit.id) && selected.length >= 1000} onChange={e => onChange(e.target.checked ? [...selected, unit.id] : selected.filter(id => id !== unit.id))} /><span>#{unit.id} · {unit.name || 'Квартира'} · {unit.number ?? 'без номера'} · {unitPrice(unit.discount_price ?? unit.total_price)} · {unit.publication_status}</span></label>)}
    {!query.data?.data.length && <p>Квартиры не добавлены.</p>}<div className="flex flex-wrap gap-3"><button type="button" className={button} disabled={page <= 1 || query.isFetching} onClick={() => setPage(page - 1)}>Предыдущие квартиры</button><span>Страница {page} / {query.data?.last_page ?? 1}</span><button type="button" className={button} disabled={page >= (query.data?.last_page ?? 1) || query.isFetching} onClick={() => setPage(page + 1)}>Следующие квартиры</button></div>
  </>}</div>;
}
