import { isAxiosError } from 'axios';
import { axios } from '@/utils/axios';

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
};

type SubmitLeadParams = {
  lead: LeadRequestPayload;
  telegram?: Record<string, unknown>;
};

export type SubmitLeadResult = {
  ok: boolean;
  bitrixOk: boolean;
  telegramOk: boolean;
  status?: number;
  validationErrors?: Record<string, string[]>;
  message?: string;
  leadId?: number;
};

type BitrixResponse = {
  message?: string;
  lead_id?: number;
};

const TG_LEAD_ENDPOINT = '/api/telegram/lead';

export const getSourceUrl = () =>
  typeof window !== 'undefined' ? window.location.href : '';

export const getUtmFromUrl = (sourceUrl?: string): Record<string, string> => {
  if (!sourceUrl) return {};

  try {
    const parsed = new URL(sourceUrl);
    const utm: Record<string, string> = {};

    parsed.searchParams.forEach((value, key) => {
      if (key.toLowerCase().startsWith('utm_') && value) {
        utm[key] = value;
      }
    });

    return utm;
  } catch {
    return {};
  }
};

const sendToBitrix = async (
  lead: LeadRequestPayload
): Promise<{ ok: true; data: BitrixResponse } | { ok: false; status?: number; validationErrors?: Record<string, string[]>; message?: string }> => {
  try {
    const { data } = await axios.post<BitrixResponse>('/lead-requests', lead, {
      headers: { 'Content-Type': 'application/json' },
    });

    return { ok: true, data };
  } catch (error: unknown) {
    if (isAxiosError(error)) {
      const status = error.response?.status;
      const payload = error.response?.data as
        | {
            message?: string;
            errors?: Record<string, string[]>;
          }
        | undefined;

      return {
        ok: false,
        status,
        validationErrors: payload?.errors,
        message: payload?.message,
      };
    }

    return { ok: false, message: 'Network error' };
  }
};

const sendToTelegram = async (
  payload?: Record<string, unknown>
): Promise<boolean> => {
  if (!payload) return false;

  try {
    const res = await fetch(TG_LEAD_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const json = await res.json();
    return Boolean(json?.ok);
  } catch {
    return false;
  }
};

export const submitLead = async ({
  lead,
  telegram,
}: SubmitLeadParams): Promise<SubmitLeadResult> => {
  const [bitrixResult, telegramOk] = await Promise.all([
    sendToBitrix(lead),
    sendToTelegram(telegram),
  ]);

  if (bitrixResult.ok) {
    return {
      ok: true,
      bitrixOk: true,
      telegramOk,
      status: 201,
      leadId: bitrixResult.data.lead_id,
      message: bitrixResult.data.message,
    };
  }

  if (bitrixResult.status === 422) {
    return {
      ok: false,
      bitrixOk: false,
      telegramOk,
      status: 422,
      validationErrors: bitrixResult.validationErrors,
      message: bitrixResult.message,
    };
  }

  if (telegramOk) {
    return {
      ok: true,
      bitrixOk: false,
      telegramOk: true,
      status: bitrixResult.status,
      message: bitrixResult.message,
    };
  }

  return {
    ok: false,
    bitrixOk: false,
    telegramOk: false,
    status: bitrixResult.status,
    message: bitrixResult.message,
  };
};

export const getLeadErrorMessage = (
  result: SubmitLeadResult,
  fallback = 'Не удалось отправить заявку. Попробуйте ещё раз.'
) => {
  if (result.status === 422 && result.validationErrors) {
    const firstField = Object.keys(result.validationErrors)[0];
    const firstMessage = firstField
      ? result.validationErrors[firstField]?.[0]
      : undefined;

    if (firstMessage) return firstMessage;
  }

  if (result.status === 502 || result.status === 503) {
    return 'Не удалось отправить заявку, попробуйте позже.';
  }

  return fallback;
};
