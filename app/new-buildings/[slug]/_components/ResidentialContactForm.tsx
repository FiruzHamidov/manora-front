'use client';

import { useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useResidentialLeadRecoveryTarget } from './ResidentialLeadRecoveryBoundary';
import { trackResidential } from '@/services/new-buildings/track';
import Link from 'next/link';
import { useLeadSubmission } from '@/services/leads/hooks';
import { genericLeadSource, leadFormPresentation, LEAD_CONSENT_VERSION, type LeadFormScope, type LeadIntent, type LeadRequestPayload } from '@/services/leads/client';
import { getUtmFromUrl } from '@/services/leads/api';
import type { NewBuilding } from '@/services/new-buildings/types';
import { quoteFromConflict, sameUnitQuote, unitIntents, unitPrice, UNIT_INTENT_LABELS, UNIT_STATUS_LABELS, type UnitQuote, type UnitFilters, type UnitAvailability } from '@/services/new-buildings/public-unit';

export function ResidentialContactForm({ building, unit, filters, unavailable = false, payment, scope = 'residential', onPaymentChanged, onUnitChanged, onSubmissionPendingChange }: {
  building?: Pick<NewBuilding, 'id' | '__source'>;
  unit?: UnitQuote & { block_id: number | null };
  filters?: UnitFilters;
  unavailable?: boolean;
  payment?: { id: number; version: number; calculation?: LeadRequestPayload['payment_calculation'] };
  scope?: LeadFormScope;
  onPaymentChanged?: () => void;
  onUnitChanged?: () => void;
  onSubmissionPendingChange?: (pending: boolean) => void;
}) {
  const id = useId();
  const recoveryTarget = useResidentialLeadRecoveryTarget();
  const started = useRef(false);
  const track = (event: 'form_start' | 'lead_result', data: Record<string, unknown> = {}) => {
    if (!building?.id || building.__source === 'aura') return;
    trackResidential(event, { surface: payment ? 'payment' : unit ? 'unit' : 'building', building_id: building.id, unit_id: unit?.id, ...data });
  };
  const { submitLead } = useLeadSubmission();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [comment, setComment] = useState('');
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [accepted, setAccepted] = useState(false);
  const [retryPayload, setRetryPayload] = useState<LeadRequestPayload | null>(null);
  const locked = busy || retryPayload !== null;
  // A refetch must never silently replace the terms the visitor is confirming.
  const [quote, setQuote] = useState<UnitQuote | undefined>(unit);
  const [conflict, setConflict] = useState<UnitQuote | null>(null);
  const allowedIntents = (status: UnitAvailability): LeadIntent[] => payment && status === 'available' ? ['payment_consultation'] : unitIntents(status);
  const [intent, setIntent] = useState<LeadIntent>(unit ? allowedIntents(unit.availability_status)[0] : payment ? 'payment_consultation' : 'consultation');
  const newer = unit && quote && unit.version >= quote.version && !sameUnitQuote(unit, quote) ? unit : null;
  const pending = conflict && (!newer || conflict.version >= newer.version) ? conflict : newer;
  const actions = allowedIntents((pending ?? quote)?.availability_status ?? 'available');
  const presentation = leadFormPresentation(scope, Boolean(unit), Boolean(payment));
  const genericSource = genericLeadSource(scope);
  const acceptTerms = () => {
    if (!pending) return;
    setQuote(pending); setConflict(null); setError('');
    if (!allowedIntents(pending.availability_status).includes(intent)) setIntent(allowedIntents(pending.availability_status)[0]);
  };
  const submit = async () => {
    if (busy || (!retryPayload && (pending || unavailable || (quote && !allowedIntents(quote.availability_status).includes(intent))))) return;
    setBusy(true); setError(''); setAccepted(false);
    onSubmissionPendingChange?.(true);
    const sourceUrl = window.location.href;
    const external = building?.__source === 'aura';
    const payload: LeadRequestPayload = retryPayload ?? structuredClone({
        ...genericSource, name: name.trim(), phone: phone.trim(), comment: comment.trim() || undefined,
        source_url: sourceUrl, utm: getUtmFromUrl(sourceUrl),
        new_building_id: external ? undefined : building?.id,
        block_id: !external && unit ? unit.block_id ?? undefined : undefined,
        developer_unit_id: !external ? quote?.id : undefined,
        expected_unit_version: !external ? quote?.version : undefined,
        expected_total_price: !external ? quote?.total_price : undefined,
        expected_availability_status: !external ? quote?.availability_status : undefined,
        payment_program_id: payment?.id, expected_program_version: payment?.version, payment_calculation: payment?.calculation,
        context: external ? { external_source: 'aura', external_building_id: building?.id } : filters ? { filters } : undefined,
        intent, consent, consent_version: LEAD_CONSENT_VERSION,
      });
    try {
      const result = await submitLead({ lead: payload });
      track('lead_result', { outcome: result.ok ? 'success' : 'error', http_status: result.status ?? 0 });
      if (!result.ok) {
        setRetryPayload(result.uncertain ? payload : null);
        onSubmissionPendingChange?.(!!result.uncertain);
        if (result.code === 'program_changed' || (payment && result.status === 404)) onPaymentChanged?.();
        if (result.code === 'listing_changed') {
          const current = quoteFromConflict(result.current);
          if (current?.id === unit?.id) { setConflict(current); onUnitChanged?.(); }
        }
        setError(result.message || 'Заявка не принята. Проверьте данные и повторите.'); return;
      }
      setRetryPayload(null); setAccepted(true); setName(''); setPhone(''); setComment(''); setConsent(false);
      onSubmissionPendingChange?.(false);
    } catch {
      track('lead_result', { outcome: 'error', http_status: 0 });
      setRetryPayload(payload);
      setError('Подтверждение от CRM не получено. Повторите исходную отправку.');
    } finally { setBusy(false); }
  };
  if (recoveryTarget && (retryPayload || busy || accepted)) return createPortal(
    <section aria-label="Подтверждение ранее отправленной заявки" className="space-y-3 rounded-xl border bg-white p-4">
      <h2 className="font-semibold">{presentation.label}</h2>
      {accepted ? <p role="status" className="text-sm text-green-800">Заявка сохранена в CRM Manora. Мы свяжемся с вами.</p> : <>
        <p role="status" className="text-sm">{busy ? 'Ожидаем подтверждение от CRM…' : 'Заявка могла быть сохранена. Повторите исходную отправку с теми же данными — это не создаст дубль.'}</p>
        <p className="text-sm text-gray-600">Подтверждение заявки не означает, что объект доступен для покупки.</p>
        {error && !busy && <p role="alert" className="text-sm text-red-700">Подтверждение пока не получено. Попробуйте ещё раз.</p>}
        <button type="button" disabled={busy || !retryPayload} onClick={() => void submit()} className="min-h-11 w-full rounded-xl bg-[#006341] px-4 py-3 font-semibold text-white disabled:opacity-50">{busy ? 'Отправка…' : 'Повторить исходную отправку'}</button>
      </>}
    </section>, recoveryTarget,
  );
  return <form onFocusCapture={() => { if (!started.current) { started.current = true; track('form_start'); } }} onSubmit={event => { event.preventDefault(); void submit(); }} aria-label={presentation.label} className="space-y-3">
    <p className="font-semibold">{presentation.heading}</p>
    {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
    {retryPayload && <p role="status" className="rounded-lg border border-amber-400 bg-amber-50 p-3 text-sm">Заявка могла быть сохранена. Повторим исходные данные с тем же ключом, чтобы не создать дубль. До подтверждения поля недоступны для изменений.</p>}
    {accepted && <p role="status" className="text-sm text-green-800">Заявка сохранена в CRM Manora. Мы свяжемся с вами.</p>}
    {pending && <div role="alert" className="space-y-2 rounded-lg border border-amber-400 bg-amber-50 p-3 text-sm">
      <p>Условия изменились: {UNIT_STATUS_LABELS[pending.availability_status]}, {unitPrice(pending.discount_price ?? pending.total_price, pending.currency)}. Проверьте их перед отправкой.</p>
      <button type="button" disabled={locked} onClick={acceptTerms} className="min-h-11 font-semibold underline">Подтвердить новые условия</button>
    </div>}
    {unit && <>
      <label htmlFor={id + '-intent'} className="block text-sm">Цель обращения</label>
      <select id={id + '-intent'} value={intent} disabled={locked || !!pending} onChange={(event) => { setIntent(event.target.value as LeadIntent); setAccepted(false); }} className="w-full rounded-lg border p-3">
        {Array.from(new Set([intent, ...actions])).map((action) => <option key={action} value={action}>{UNIT_INTENT_LABELS[action]}</option>)}
      </select>
      <p className="text-sm text-gray-600">Заявка не является резервированием квартиры.</p>
    </>}
    <label htmlFor={`${id}-name`} className="block text-sm">Ваше имя</label>
    <input id={`${id}-name`} disabled={locked} autoComplete="name" required maxLength={150} value={name} onChange={(event) => { setName(event.target.value); setAccepted(false); }} className="w-full rounded-lg border p-3" />
    <label htmlFor={`${id}-phone`} className="block text-sm">Телефон</label>
    <input id={`${id}-phone`} disabled={locked} type="tel" autoComplete="tel" required maxLength={30} value={phone} onChange={(event) => { setPhone(event.target.value); setAccepted(false); }} className="w-full rounded-lg border p-3" />
    <label htmlFor={id + '-comment'} className="block text-sm">Комментарий (необязательно)</label>
    <textarea id={id + '-comment'} disabled={locked} maxLength={5000} rows={3} value={comment} onChange={event => { setComment(event.target.value); setAccepted(false); }} className="w-full rounded-lg border p-3" />
    <label className="flex min-w-0 items-start gap-2 text-sm"><input type="checkbox" disabled={locked} required checked={consent} onChange={(event) => { setConsent(event.target.checked); setAccepted(false); }} className="mt-1 shrink-0" /><span className="min-w-0 break-words">Согласен на обработку данных по <Link href="/policy" className="break-words underline">политике конфиденциальности</Link>.</span></label>
    <button type="submit" disabled={busy || (!retryPayload && (!consent || !!pending || unavailable))} className="w-full rounded-xl bg-[#006341] px-4 py-3 font-semibold text-white disabled:opacity-50">{busy ? 'Отправка…' : retryPayload ? 'Повторить исходную отправку' : 'Отправить заявку'}</button>
  </form>;
}
