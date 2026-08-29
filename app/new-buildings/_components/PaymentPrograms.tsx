'use client';

import { measureResidential } from '@/services/new-buildings/track';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { API_BASE_URL } from '@/config/api';
import { fetchPaymentPrograms, fetchPaymentUnits, calculatePayment, PaymentProgramError } from '@/services/new-buildings/payment-program-api';
import { paymentKinds, paymentMethods, paymentTargetState, type PaymentTarget, type PublicPaymentProgram, type PaymentUnit, type PaymentQuote, type PaymentCalculationInput } from '@/services/new-buildings/payment-programs';
import { unitPrice, unitTitle, formatResidentialDecimal as decimal, type PublicUnit } from '@/services/new-buildings/public-unit';
import { fetchPublicUnit, PublicUnitError } from '@/services/new-buildings/public-unit-api';
import { ResidentialContactForm } from '../[slug]/_components/ResidentialContactForm';

const button = 'min-h-11 rounded-xl border border-[#006341] px-4 py-2 font-medium text-[#006341] focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-40';
const input = 'mt-1 min-h-11 w-full min-w-0 rounded-lg border p-3';
const columns = { gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))' };
const date = (value: string | null) => value?.split('-').reverse().join('.') || 'Не указана';

export default function PaymentPrograms({ buildingId, unit, initialPrice = '', kind, unavailable = false }: { buildingId?: number; unit?: PublicUnit; initialPrice?: string; kind?: 'mortgage' | 'installment'; unavailable?: boolean }) {
  const [page, setPage] = useState(1), [selected, setSelected] = useState<PublicPaymentProgram | null>(null);
  const [review, setReview] = useState(false);
  const [leadPending, setLeadPending] = useState(false);
  const query = useQuery({
    queryKey: ['public-payment-programs', buildingId, unit?.id, kind, page],
    queryFn: ({ signal }) => measureResidential({ surface: 'payment', building_id: buildingId, unit_id: unit?.id, endpoint: 'payment-programs' }, () => fetchPaymentPrograms(API_BASE_URL, { buildingId, unitId: unit?.id, kind, page }, signal), signal),
    refetchInterval: 30_000, refetchOnWindowFocus: true, retry: 1,
  });
  const latest = query.data?.data.find(program => program.id === selected?.id);
  const stale = !!selected && (review || !latest || latest.version !== selected.version);
  function choose(program: PublicPaymentProgram) { if (leadPending) return; setSelected(program); setReview(false); }
  return <div className="min-w-0 space-y-5">
    <p className="text-sm text-gray-600">Только подтверждённые программы конкретных ЖК. Расчёт предварительный: не одобрение банка и не бронирование. Обращение поступает консультанту Manora.</p>
    {leadPending && <p role="status" className="rounded-xl border border-amber-400 bg-amber-50 p-3 text-sm">Сначала подтвердите исходную отправку заявки в форме ниже. До получения результата смена программы и квартиры недоступна, чтобы не потерять заявку.</p>}
    <button className={button} disabled={query.isFetching} onClick={() => void query.refetch()}>Обновить условия покупки</button>
    {query.isLoading && <p role="status">Загрузка подтверждённых программ…</p>}
    {query.isError && <p role="alert">Условия не удалось обновить. Показанный ранее расчёт не подтверждён. Повторите загрузку; введённые поля сохранены.</p>}
    {!query.isError && query.data && <>
      {!query.data.data.length && <p>Условия уточняются. Подтверждённых действующих программ пока нет.</p>}
      <ul aria-label="Подтверждённые программы" className="grid min-w-0 gap-3" style={columns}>{query.data.data.map(program => <li key={program.id} className={'min-w-0 space-y-2 break-words rounded-xl border p-4 ' + (selected?.id === program.id ? 'border-green-800 bg-green-50' : 'bg-white')}>
        <h3 className="font-semibold">{program.name}</h3>
        <p>{paymentKinds[program.kind]} · {program.provider}</p><Link className="inline-flex min-h-11 items-center underline" href={'/new-buildings/' + program.building.id}>{program.building.title}</Link>
        <p className="text-sm">{program.scope_label} · {program.term_min_months === program.term_max_months ? program.term_min_months : program.term_min_months + '–' + program.term_max_months} мес. · Взнос от {decimal(program.min_down_payment_percent)}%</p>
        <p className="text-sm">{program.calculation_method === 'annuity' || program.calculation_method === 'differentiated' ? 'Ставка в год' : 'Разовая наценка'}: {decimal(program.rate_percent)}% · Комиссия: {unitPrice(program.fee_amount)}</p>
        <p className="text-sm">Проверено {date(program.verified_at)} · До {date(program.valid_to)} включительно</p>
        <button className={button} disabled={leadPending} aria-pressed={selected?.id === program.id} onClick={() => choose(program)}>{selected?.id === program.id && !stale ? 'Программа выбрана' : 'Выбрать ' + program.name}</button>
      </li>)}</ul>
      {query.data.meta.last_page > 1 && <div className="flex flex-wrap items-center gap-3"><button className={button} disabled={leadPending || page <= 1 || query.isFetching} onClick={() => { if (!leadPending) { setSelected(null); setPage(page - 1); } }}>Предыдущие программы</button><span>{page} / {query.data.meta.last_page}</span><button className={button} disabled={leadPending || page >= query.data.meta.last_page || query.isFetching} onClick={() => { if (!leadPending) { setSelected(null); setPage(page + 1); } }}>Следующие программы</button></div>}
    </>}
    {selected && <>
      {stale && !query.isError && <div role="alert" className="space-y-2 rounded-xl bg-amber-50 p-4"><p>Программа изменилась или больше не доступна. Проверьте свежие условия выше; предыдущий расчёт скрыт.</p>{latest && <button className={button} disabled={leadPending} onClick={() => choose(latest)}>Принять обновлённые условия программы</button>}</div>}
      <ProgramCalculator key={selected.id} program={selected} fixedUnit={unit} initialPrice={initialPrice} leadPending={leadPending} onSubmissionPendingChange={setLeadPending} disabled={unavailable || query.isError || stale || query.isLoading} onProgramChanged={() => { setReview(true); void query.refetch(); }} />
    </>}
    {!selected && <div className="max-w-xl rounded-xl border bg-white p-4"><ResidentialContactForm building={buildingId ? { id: buildingId } : undefined} unit={unit}
      scope={kind === 'mortgage' && !buildingId && !unit ? 'mortgage' : 'residential'} unavailable={unavailable} onSubmissionPendingChange={setLeadPending} /></div>}
  </div>;
}

function paymentUnit(unit: PublicUnit): PaymentTarget {
  return { id: unit.id, version: unit.version, name: unit.name, number: unit.number, rooms: unit.rooms, area: unit.area, floor: unit.floor, block_id: unit.block_id, availability_status: unit.availability_status, price: unit.effective_total_price, total_price: unit.total_price, discount_price: unit.discount_price, currency: 'TJS' };
}

function ProgramCalculator({ program, fixedUnit, initialPrice, disabled, onProgramChanged, leadPending, onSubmissionPendingChange }: { program: PublicPaymentProgram; fixedUnit?: PublicUnit; initialPrice: string; disabled: boolean; onProgramChanged: () => void; leadPending: boolean; onSubmissionPendingChange: (pending: boolean) => void }) {
  const [target, setTarget] = useState<PaymentTarget | null>(fixedUnit ? paymentUnit(fixedUnit) : null), [unitPage, setUnitPage] = useState(1);
  const [price, setPrice] = useState(initialPrice), [down, setDown] = useState(program.min_down_payment_percent ?? ''), [mode, setMode] = useState<'amount' | 'percent'>('percent'), [term, setTerm] = useState(String(program.term_min_months ?? ''));
  const [result, setResult] = useState<{ signature: string; quote: PaymentQuote; input: PaymentCalculationInput } | null>(null), [busy, setBusy] = useState(false), [error, setError] = useState('');
  const [unitConflict, setUnitConflict] = useState<PaymentUnit | null>(null), [needsRefresh, setNeedsRefresh] = useState(false);
  const candidates = useQuery({ queryKey: ['payment-units', program.id, program.version, unitPage], queryFn: ({ signal }) => measureResidential({ surface: 'payment', building_id: program.building.id, endpoint: 'payment-units' }, () => fetchPaymentUnits(API_BASE_URL, program, unitPage, signal), signal), enabled: !fixedUnit, refetchInterval: 30_000, refetchOnWindowFocus: true, retry: 1 });
  const selectedUnit = useQuery({ queryKey: ['public-unit', program.building.id, target?.id], enabled: !fixedUnit && !!target,
    queryFn: ({ signal }) => measureResidential({ surface: 'payment', building_id: program.building.id, unit_id: target!.id, endpoint: 'detail' }, () => fetchPublicUnit(API_BASE_URL, String(program.building.id), String(target!.id), signal), signal),
    refetchInterval: 30_000, refetchOnWindowFocus: 'always', retry: false });
  const candidate = fixedUnit ? paymentUnit(fixedUnit) : selectedUnit.data ? paymentUnit(selectedUnit.data) : null;
  const verified = paymentTargetState(target, candidate, !fixedUnit && (selectedUnit.isError || selectedUnit.isPending));
  const latestUnit = verified.unavailable ? null : unitConflict ?? verified.changed;
  const canCalculate = !disabled && !verified.unavailable && !latestUnit && !needsRefresh && (program.scope_type === 'building' || !!target) && (!target || target.price !== null && target.availability_status !== 'sold');
  const signature = JSON.stringify([program.id, program.version, target?.id, target?.version, target?.price, price, down, mode, term]);
  const currentResult = canCalculate && result?.signature === signature ? result : null;
  function selectUnit(value: PaymentTarget | null) { if (leadPending) return; setTarget(value); setUnitConflict(null); setNeedsRefresh(false); setResult(null); setError(''); }
  async function calculate(event: FormEvent) {
    event.preventDefault();
    if (!canCalculate || busy) return;
    const data: PaymentCalculationInput = { program_version: program.version, down_payment_mode: mode, down_payment: down.replace(',', '.'), term_months: Number(term),
      ...(target ? { unit_id: target.id, expected_unit_version: target.version, expected_total_price: target.price! } : { price: price.replace(',', '.') }) };
    setBusy(true); setError(''); setResult(null);
    try { setResult({ signature, input: data, quote: await measureResidential({ surface: 'payment', building_id: program.building.id, unit_id: target?.id, endpoint: 'payment-calculation' }, () => calculatePayment(API_BASE_URL, program, data)) }); }
    catch (e) {
      if (e instanceof PaymentProgramError) {
        setError(Object.values(e.fields ?? {})[0]?.[0] || e.message);
        if (e.code === 'program_changed') onProgramChanged();
        if (e.code === 'unit_quote_changed' && e.current?.id === target?.id) setUnitConflict(e.current as PaymentUnit);
        if (e.status === 404) { setNeedsRefresh(true); onProgramChanged(); }
      } else setError('Расчёт не получен. Повторите попытку.');
    } finally { setBusy(false); }
  }
  return <div className="min-w-0 space-y-5 rounded-2xl border bg-white p-4 md:p-6">
    <h3 className="text-xl font-semibold">Расчёт: {program.name}</h3>
    <details className="break-words"><summary className="min-h-11 cursor-pointer font-medium">Полные условия и источник</summary><div className="space-y-2 pb-3 text-sm"><p>{program.calculation_method ? paymentMethods[program.calculation_method] : 'Метод не указан'}</p><p>Источник: {program.source}</p><p>Действует с {date(program.valid_from)} до {date(program.valid_to)} включительно. Проверено {date(program.verified_at)}.</p><p>{program.scope_label} · {program.payment_interval_months ? 'Платёж каждые ' + program.payment_interval_months + ' мес.' : 'Индивидуальные месяцы платежей'}</p><p className="whitespace-pre-wrap">{program.terms}</p>{program.custom_schedule && <p>Доли долга: {program.custom_schedule.map(row => 'месяц ' + row.month + ' — ' + decimal(row.percent) + '%').join('; ')}</p>}</div></details>
    {!fixedUnit && <details><summary className="min-h-11 cursor-pointer font-medium">Выбрать реальную квартиру этого ЖК</summary><div className="space-y-2">
      {candidates.isLoading && <p>Загрузка квартир…</p>}{candidates.isError && <p role="alert">Список квартир не обновлён. Выбранная квартира проверяется отдельно.</p>}
      <button type="button" className={button} disabled={candidates.isFetching} onClick={() => void candidates.refetch()}>Обновить квартиры программы</button>
      {!candidates.isError && candidates.data?.data.map(value => <button type="button" key={value.id} disabled={leadPending || busy || candidates.data?.program_version !== program.version} onClick={() => selectUnit(value)} className={button + ' block w-full text-left'}>№ {value.number || value.id} · {unitTitle(value)} · {unitPrice(value.price)}{value.availability_status === 'reserved' ? ' · Забронирована' : ''}</button>)}
      {!candidates.isError && candidates.data?.data.length === 0 && <p>Подходящих квартир сейчас нет.</p>}
      <div className="flex flex-wrap gap-3"><button type="button" className={button} disabled={unitPage <= 1 || candidates.isFetching} onClick={() => setUnitPage(unitPage - 1)}>Предыдущие квартиры</button><span>{unitPage} / {candidates.data?.meta.last_page ?? 1}</span><button type="button" className={button} disabled={unitPage >= (candidates.data?.meta.last_page ?? 1) || candidates.isFetching} onClick={() => setUnitPage(unitPage + 1)}>Следующие квартиры</button></div>
    </div></details>}
    {target && <div className="space-y-2 rounded-xl bg-gray-50 p-3">
      {verified.unavailable ? <p role={selectedUnit.isPending ? 'status' : 'alert'}>{selectedUnit.isPending ? 'Проверка выбранной квартиры…' : selectedUnit.error instanceof PublicUnitError && selectedUnit.error.status === 404 ? 'Выбранная квартира снята с публикации или недоступна. Её данные и прежний расчёт скрыты.' : 'Выбранную квартиру не удалось обновить. Прежняя цена и расчёт скрыты; введённые поля сохранены.'}</p>
        : <><Link className="inline-flex min-h-11 items-center underline" href={'/new-buildings/' + program.building.id + '/units/' + target.id}>Квартира № {target.number || target.id} · {unitPrice(target.price)}</Link>{target.availability_status === 'reserved' && <p>Квартира забронирована. Расчёт не подтверждает возможность покупки.</p>}</>}
      {!fixedUnit && <button type="button" className={button} disabled={selectedUnit.isFetching} onClick={() => void selectedUnit.refetch()}>Обновить выбранную квартиру</button>}
      {!fixedUnit && program.scope_type === 'building' && <button type="button" className={button} disabled={leadPending || busy} onClick={() => selectUnit(null)}>Перейти к примерной стоимости</button>}
    </div>}
    {!target && program.scope_type !== 'building' && <p>Программа действует на выбранные корпуса или квартиры. Для расчёта и обращения по программе выберите подходящую квартиру.</p>}
    {target?.price === null && <p>Стоимость по запросу. Можно отправить консультацию без расчёта.</p>}
    {latestUnit && <div role="alert" className="space-y-2 rounded-xl bg-amber-50 p-3"><p>Данные квартиры изменились: {unitPrice(latestUnit.price)}. Прежний расчёт скрыт.</p><button type="button" className={button} disabled={leadPending || busy} onClick={() => selectUnit(latestUnit)}>Принять актуальную квартиру</button></div>}
    {needsRefresh && <p role="alert">Квартира или программа недоступна. Обновите условия и выберите доступную квартиру.</p>}
    <form onSubmit={calculate} aria-label="Калькулятор программы оплаты" className="space-y-4">
      {error && <p role="alert">{error}</p>}
      <fieldset disabled={busy || disabled} className="grid min-w-0 gap-4" style={columns}>
        {!target && program.scope_type === 'building' && <label>Примерная стоимость, TJS<input className={input} inputMode="decimal" required maxLength={17} value={price} onChange={e => setPrice(e.target.value)} /><span className="text-xs text-gray-600">Расчёт относится к выбранной программе ЖК и не подтверждает условия другого объекта.</span></label>}
        <label>Взнос в<select className={input} value={mode} onChange={e => { setMode(e.target.value as 'amount' | 'percent'); setDown(''); }}><option value="percent">Процентах</option><option value="amount">Деньгах, TJS</option></select></label>
        <label>Первоначальный взнос{mode === 'percent' ? ', %' : ', TJS'}<input className={input} inputMode="decimal" required maxLength={17} value={down} onChange={e => setDown(e.target.value)} /><span className="text-xs">Минимум по программе: {decimal(program.min_down_payment_percent)}%</span></label>
        <label>Срок, месяцев<input className={input} required type="number" min={program.term_min_months ?? 1} max={program.term_max_months ?? 600} step={program.payment_interval_months ?? 1} value={term} onChange={e => setTerm(e.target.value)} /></label>
      </fieldset>
      <button className={button} type="submit" disabled={!canCalculate || busy}>{busy ? 'Расчёт…' : 'Рассчитать по подтверждённым условиям'}</button>
    </form>
    {currentResult && <div role="status" className="min-w-0 space-y-4 rounded-xl bg-green-50 p-4">
      <h4 className="font-semibold">Предварительный расчёт</h4>
      <dl className="grid min-w-0 gap-3" style={columns}>{([
        ['Первоначальный взнос', currentResult.quote.calculation.down_payment], ['Комиссия при оформлении', currentResult.quote.calculation.fee_amount],
        ['Всего при оформлении', currentResult.quote.calculation.upfront_total], ['Сумма финансирования', currentResult.quote.calculation.financed_amount],
        ['Первый платёж', currentResult.quote.calculation.first_payment], ['Последний платёж', currentResult.quote.calculation.last_payment],
        ['Сумма платежей по графику', currentResult.quote.calculation.payments_total], ['Полная стоимость со взносом и комиссией', currentResult.quote.calculation.total_cost], ['Переплата', currentResult.quote.calculation.overpayment],
      ] as const).map(([label, value]) => <div key={label}><dt className="text-sm text-gray-600">{label}</dt><dd className="break-words font-semibold">{unitPrice(value)}</dd></div>)}</dl>
      <details><summary className="min-h-11 cursor-pointer font-medium">График · платежей: {currentResult.quote.calculation.payment_count}</summary><div className="max-h-80 overflow-auto" tabIndex={0} aria-label="График платежей"><table className="w-full text-left text-sm"><thead><tr><th className="p-2">Месяц</th><th className="p-2">Платёж, TJS</th><th className="p-2">Остаток, TJS</th></tr></thead><tbody>{currentResult.quote.calculation.schedule.map(row => <tr key={row.number}><td className="p-2">{row.month}</td><td className="p-2">{decimal(row.payment)}</td><td className="p-2">{decimal(row.balance)}</td></tr>)}</tbody></table></div></details>
      <ul className="list-disc space-y-1 pl-5 text-sm">{currentResult.quote.calculation.assumptions.map(value => <li key={value}>{value}</li>)}</ul>
    </div>}
    <div className="max-w-xl border-t pt-5"><ResidentialContactForm key={target?.id ?? 'manual'} building={{ id: program.building.id }} unit={target ?? undefined} onSubmissionPendingChange={onSubmissionPendingChange}
      payment={{ id: program.id, version: program.version, calculation: currentResult ? { price: currentResult.input.price, down_payment_mode: currentResult.input.down_payment_mode, down_payment: currentResult.input.down_payment, term_months: currentResult.input.term_months } : undefined }}
      unavailable={disabled || verified.unavailable || !!latestUnit || needsRefresh || target?.availability_status === 'sold' || (program.scope_type !== 'building' && !target)} onPaymentChanged={onProgramChanged}
      onUnitChanged={() => { setResult(null); setNeedsRefresh(true); if (!fixedUnit) { void candidates.refetch(); void selectedUnit.refetch(); } }} />
      <p className="mt-3 text-xs text-gray-600">{currentResult ? 'В заявку войдут выбранная программа и проверенный сервером расчёт.' : 'Консультация по программе без приложенного расчёта.'} Данные сохраняются только в CRM Manora.</p>
    </div>
  </div>;
}
