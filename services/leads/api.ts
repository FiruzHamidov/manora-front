import { axios } from '@/utils/axios';
import type { LeadAcceptance, LeadRequestPayload, SubmitLeadResult } from './client';

export type { LeadRequestPayload, SubmitLeadResult, LeadIntent } from './client';
export { LEAD_CONSENT_VERSION } from './client';

export const getSourceUrl = () => typeof window !== 'undefined' ? window.location.href : '';

export const getUtmFromUrl = (sourceUrl?: string): Record<string, string> => {
  if (!sourceUrl) return {};
  try {
    const parsed = new URL(sourceUrl);
    const utm: Record<string, string> = {};
    for (const key of ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content']) {
      const value = parsed.searchParams.get(key);
      if (value) utm[key] = value.slice(0, 160);
    }
    return utm;
  } catch {
    return {};
  }
};

export const postLeadRequest = async (lead: LeadRequestPayload): Promise<LeadAcceptance> => {
  const { data } = await axios.post<LeadAcceptance>('/lead-requests', lead, {
    timeout: 20_000,
    headers: { 'Content-Type': 'application/json', 'Idempotency-Key': lead.idempotency_key },
  });
  return data;
};

export const getLeadErrorMessage = (
  result: SubmitLeadResult,
  fallback = 'Не удалось отправить заявку. Попробуйте ещё раз.'
) => {
  if (result.status === 422 && result.validationErrors) {
    const first = Object.values(result.validationErrors)[0]?.[0];
    if (first) return first;
  }
  return result.message || fallback;
};
