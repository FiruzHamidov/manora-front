import { sameUnitQuote, type PublicUnit } from './public-unit.ts';

export const paymentKinds = { installment: 'Рассрочка', mortgage: 'Ипотека' } as const;
export const paymentScopes = { building: 'Весь ЖК', blocks: 'Выбранные корпуса', units: 'Выбранные квартиры' } as const;
export const paymentMethods = { equal: 'Равномерная, без процентов', flat_markup: 'Равномерная с разовой наценкой', annuity: 'Аннуитет', differentiated: 'Дифференцированные платежи', custom: 'Индивидуальный график с разовой наценкой' } as const;

export type PaymentProgramFields = {
  name: string; kind: keyof typeof paymentKinds; provider: string | null; currency: 'TJS'; scope_type: keyof typeof paymentScopes;
  calculation_method: keyof typeof paymentMethods | null; rate_percent: string | null; fee_amount: string | null; min_down_payment_percent: string | null;
  term_min_months: number | null; term_max_months: number | null; payment_interval_months: number | null;
  custom_schedule: { month: number; percent: string }[] | null; terms: string | null; source: string | null;
  valid_from: string | null; valid_to: string | null; verified_at: string | null;
};
export type PublicPaymentProgram = PaymentProgramFields & { id: number; version: number; building: { id: number; title: string }; scope_label: string };
export type ManagedPaymentProgram = PaymentProgramFields & { id: number; version: number; new_building_id: number; archived_at: string | null; block_ids: number[]; unit_ids: number[] };
export type PaymentPage<T> = { data: T[]; meta: { page: number; last_page: number; total: number; as_of?: string } };
export type ManagedPaymentPrograms = PaymentPage<ManagedPaymentProgram> & { version: number };
export type PaymentUnit = { id: number; version: number; name: string | null; number: string | null; rooms: number | null; area: string | null; floor: number | null; block_id: number | null; availability_status: 'available' | 'reserved'; price: string | null; total_price: string | null; discount_price: string | null; currency: 'TJS' };
export type PaymentTarget = Omit<PaymentUnit, 'availability_status'> & Pick<PublicUnit, 'availability_status'>;

/** Selected lots are checked independently of the paginated list of candidates. */
export function paymentTargetState(target: PaymentTarget | null, current: PaymentTarget | null, failed = false): { unavailable: boolean; changed: PaymentTarget | null } {
  if (!target) return { unavailable: false, changed: null };
  if (failed || !current || current.id !== target.id || current.version < target.version) return { unavailable: true, changed: null };
  return { unavailable: false, changed: sameUnitQuote(target, current) ? null : current };
}
export type PaymentCalculationInput = {
  program_version: number; price?: string; unit_id?: number; expected_unit_version?: number; expected_total_price?: string;
  down_payment_mode: 'amount' | 'percent'; down_payment: string; term_months: number;
};
export type PaymentCalculation = {
  currency: 'TJS'; price: string; down_payment: string; financed_amount: string; fee_amount: string; upfront_total: string; payments_total: string;
  total_cost: string; overpayment: string; term_months: number; payment_count: number; first_payment: string; last_payment: string;
  schedule: { number: number; month: number; payment: string; balance: string; principal?: string; interest?: string }[]; assumptions: string[];
};
export type PaymentQuote = { program: PublicPaymentProgram; unit: PaymentUnit | null; calculation: PaymentCalculation; as_of: string };
