export const LEAD_CONSENT_VERSION = 'residential-complexes-v1';

export type LeadFormScope = 'residential' | 'mortgage';

export function leadFormPresentation(scope: LeadFormScope, hasUnit = false, hasPayment = false) {
  if (hasUnit) return { label: 'Обращение по квартире', heading: 'Обратиться в Manora' };
  if (hasPayment) return { label: 'Обращение по условиям покупки', heading: 'Получить консультацию' };
  if (scope === 'mortgage') return { label: 'Ипотечная консультация', heading: 'Получить ипотечную консультацию' };
  return { label: 'Обращение по ЖК', heading: 'Получить консультацию' };
}

export function genericLeadSource(scope: LeadFormScope) {
  return scope === 'mortgage'
    ? { service_type: 'Ипотека', source: 'web-mortgage-consultant' }
    : { service_type: 'Новостройки', source: 'web-new-building-consultant' };
}

export type LeadIntent = 'consultation' | 'viewing' | 'availability' | 'availability_notification' | 'similar_selection' | 'payment_consultation';

export const LEAD_INTENT_LABELS: Record<string, string> = {
  consultation: 'Консультация',
  viewing: 'Просмотр квартиры',
  availability: 'Уточнение наличия',
  availability_notification: 'Уведомление об освобождении',
  similar_selection: 'Подбор похожих квартир',
  payment_consultation: 'Консультация по оплате',
};

export type LeadRequestPayload = {
  service_type: string;
  name: string;
  phone: string;
  email?: string;
  comment?: string;
  source?: string;
  source_url?: string;
  utm?: Record<string, string>;
  context?: Record<string, unknown>;
  idempotency_key?: string;
  intent?: LeadIntent;
  new_building_id?: number;
  block_id?: number;
  developer_unit_id?: number;
  expected_unit_version?: number;
  expected_total_price?: string | null;
  expected_availability_status?: string;
  payment_program_id?: number;
  expected_program_version?: number;
  payment_calculation?: {
    price?: string;
    down_payment_mode: 'amount' | 'percent';
    down_payment: string;
    term_months: number;
  };
  consent?: boolean;
  consent_version?: string;
};

export type LeadAcceptance = {
  request_id: number;
  lead_id?: number;
  acceptance_id?: string;
  replayed?: boolean;
  message?: string;
};

export type SubmitLeadResult = {
  ok: boolean;
  /** The server may have committed; retry the unchanged payload with the same key. */
  uncertain?: boolean;
  status?: number;
  validationErrors?: Record<string, string[]>;
  message?: string;
  code?: string;
  current?: Record<string, unknown>;
  leadId?: number;
  acceptanceId?: string;
};

export type LeadTransport = (lead: LeadRequestPayload) => Promise<LeadAcceptance>;

export function stripSourceQuery(sourceUrl?: string): string | undefined {
  if (!sourceUrl) return undefined;
  try {
    const url = new URL(sourceUrl);
    if (!['http:', 'https:'].includes(url.protocol)) return undefined;
    return `${url.origin}${url.pathname}`;
  } catch {
    return undefined;
  }
}

/** One instance per form: retries retain a key; each confirmed new request gets a new key. */
export function createLeadSubmission(post: LeadTransport, createKey = () => crypto.randomUUID()) {
  let key: string | undefined;
  let inFlight: Promise<SubmitLeadResult> | undefined;
  let activePayload: string | undefined;
  let unresolved = false;

  const submitLead = ({ lead }: { lead: LeadRequestPayload }): Promise<SubmitLeadResult> => {
    const fingerprint = JSON.stringify(lead);
    if (inFlight) {
      if (fingerprint === activePayload) return inFlight;
      return Promise.resolve({ ok: false, code: 'submission_in_progress', message: 'Дождитесь завершения текущей отправки.' });
    }
    key = lead.idempotency_key ?? key ?? createKey();
    activePayload = fingerprint;
    const payload = { ...lead, idempotency_key: key, source_url: stripSourceQuery(lead.source_url) };

    inFlight = (async (): Promise<SubmitLeadResult> => {
      try {
        const accepted = await post(payload);
        if (!Number.isSafeInteger(accepted.request_id) || accepted.request_id <= 0) {
          unresolved = true;
          return { ok: false, uncertain: true, message: 'CRM не подтвердила сохранение заявки. Повторите отправку.' };
        }
        key = undefined;
        unresolved = false;
        return {
          ok: true, status: accepted.replayed ? 200 : 201,
          leadId: accepted.request_id, acceptanceId: accepted.acceptance_id, message: accepted.message,
        };
      } catch (error: unknown) {
        const failure = error as { response?: { status?: number; data?: {
          message?: string; errors?: Record<string, string[]>; code?: string; current?: Record<string, unknown>;
        } } } | null;
        const status = failure?.response?.status;
        // A rejected retry (e.g. throttling) cannot disprove an earlier commit.
        unresolved = unresolved || status === undefined || status === 408 || status >= 500;
        return {
          ok: false, status, uncertain: unresolved,
          validationErrors: failure?.response?.data?.errors,
          message: failure?.response?.data?.message ?? 'Подтверждение от CRM не получено. Повторите отправку.',
          code: failure?.response?.data?.code, current: failure?.response?.data?.current,
        };
      }
    })().finally(() => { inFlight = undefined; activePayload = undefined; });

    return inFlight;
  };

  return {
    submitLead,
    // Explicitly start a separate request; never discard an in-flight attempt.
    resetSubmission: () => { if (!inFlight) { key = undefined; unresolved = false; } },
  };
}
