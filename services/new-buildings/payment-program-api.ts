import type { PaymentCalculationInput, PaymentPage, PaymentQuote, PaymentUnit, PublicPaymentProgram } from './payment-programs';

export class PaymentProgramError extends Error {
  readonly status: number;
  readonly fields?: Record<string, string[]>;
  readonly code?: string;
  readonly current?: Record<string, unknown>;

  constructor(status: number, message: string, fields?: Record<string, string[]>, code?: string, current?: Record<string, unknown>) {
    super(message);
    this.status = status;
    this.fields = fields;
    this.code = code;
    this.current = current;
  }
}

async function request<T>(url: string, body?: PaymentCalculationInput, signal?: AbortSignal, transport: typeof fetch = fetch): Promise<T> {
  try {
    const response = await transport(url, {
      method: body ? 'POST' : 'GET', cache: 'no-store', headers: { Accept: 'application/json', ...(body ? { 'Content-Type': 'application/json' } : {}) },
      ...(body ? { body: JSON.stringify(body) } : {}),
      signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(12_000)]) : AbortSignal.timeout(12_000),
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new PaymentProgramError(response.status, error.message || (response.status === 404 ? 'Программа или квартира больше не доступна' : 'Не удалось получить условия покупки'), error.errors, error.code, error.current);
    }
    return await response.json() as T;
  } catch (error) {
    if (signal?.aborted || error instanceof PaymentProgramError) throw error;
    throw new PaymentProgramError(503, 'Не удалось связаться с сервером. Условия и расчёт не подтверждены.');
  }
}

export function fetchPaymentPrograms(base: string, filters: { buildingId?: number; unitId?: number; kind?: 'installment' | 'mortgage'; page?: number }, signal?: AbortSignal, transport: typeof fetch = fetch) {
  const query = new URLSearchParams();
  if (filters.buildingId) query.set('building_id', String(filters.buildingId));
  if (filters.unitId) query.set('unit_id', String(filters.unitId));
  if (filters.kind) query.set('kind', filters.kind);
  if (filters.page) query.set('page', String(filters.page));
  return request<PaymentPage<PublicPaymentProgram>>(base.replace(/\/$/, '') + '/v2/payment-programs?' + query, undefined, signal, transport);
}

export function fetchPaymentUnits(base: string, program: Pick<PublicPaymentProgram, 'id' | 'building'>, page: number, signal?: AbortSignal, transport: typeof fetch = fetch) {
  return request<PaymentPage<PaymentUnit> & { program_version: number }>(base.replace(/\/$/, '') + '/v2/new-buildings/' + program.building.id + '/payment-programs/' + program.id + '/units?page=' + page, undefined, signal, transport);
}

export function calculatePayment(base: string, program: Pick<PublicPaymentProgram, 'id' | 'building'>, input: PaymentCalculationInput, signal?: AbortSignal, transport: typeof fetch = fetch) {
  return request<PaymentQuote>(base.replace(/\/$/, '') + '/v2/new-buildings/' + program.building.id + '/payment-programs/' + program.id + '/calculate', input, signal, transport);
}
