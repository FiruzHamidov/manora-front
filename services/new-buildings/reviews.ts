export type ReviewStatus = 'pending' | 'published' | 'rejected' | 'withdrawn';
export type PublicReview = { id: number; display_name: string; rating: number; text: string; version: number; created_at: string; updated_at: string; published_at: string | null };
export type OwnReview = PublicReview & { status: ReviewStatus; moderation_reason: string | null };
export type ManagedReview = OwnReview & { author_user_id: number | null; moderated_by: number | null; moderated_at: string | null };
export type ReviewReport = { id: number; review_id: number; reporter_user_id: number | null; review_version: number; review_snapshot: PublicReview;
  reason: string; status: 'open' | 'actioned' | 'dismissed'; version: number; resolved_at: string | null; resolution_reason: string | null; review: ManagedReview };
export type ReviewPage<T> = { data: T[]; meta: { current_page: number; last_page: number; total: number } };
export type ReviewRules = { version: string; items: string[] };
export type PublicReviews = ReviewPage<PublicReview> & { rating: { count: number; average: number | null }; rules: ReviewRules };
export type ReviewInput = { version: number; display_name: string; rating: number; text: string; rules_version: string; accept_rules: boolean };
export const reviewStatus: Record<ReviewStatus, string> = { pending: 'На проверке', published: 'Опубликован', rejected: 'Отклонён', withdrawn: 'Отозван автором' };
export const reportStatus = { open: 'Ожидает решения', actioned: 'Отзыв скрыт', dismissed: 'Рассмотрена без скрытия' };
export const reviewDate = (date: string | null) => date ? new Date(date).toLocaleDateString('ru-RU', { timeZone: 'Asia/Dushanbe' }) : '—';
export function reviewAuditSnapshot(value: string): string {
  try { return JSON.stringify(JSON.parse(value), null, 2); }
  catch { return value; }
}
export function ratingLabel(rating: PublicReviews['rating']): string {
  return rating.count > 0 && rating.average !== null ? rating.average.toLocaleString('ru-RU', { maximumFractionDigits: 2 }) + ' из 5 · Отзывов: ' + rating.count : 'Опубликованных отзывов пока нет';
}
export function reviewDraft(review: OwnReview | null, rulesVersion: string): ReviewInput {
  return { version: review?.version ?? 0, display_name: review?.display_name ?? '', rating: review?.rating ?? 5,
    text: review?.text ?? '', rules_version: rulesVersion, accept_rules: false };
}
export function reviewVersionChanged(draft: Pick<ReviewInput, 'version'>, current: OwnReview | null): boolean {
  return draft.version !== (current?.version ?? 0);
}
export class ReviewsError extends Error {
  status: number;
  constructor(message: string, status: number) { super(message); this.status = status; }
}
export async function fetchBuildingReviews(base: string, id: number, page: number, signal?: AbortSignal, transport: typeof fetch = fetch): Promise<PublicReviews> {
  try {
    const response = await transport(base.replace(/\/$/, '') + '/v2/new-buildings/' + id + '/reviews?page=' + page, {
      cache: 'no-store', headers: { Accept: 'application/json' },
      signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(12_000)]) : AbortSignal.timeout(12_000),
    });
    if (!response.ok) throw new ReviewsError('Отзывы недоступны.', response.status);
    const data: PublicReviews = await response.json();
    if (!Array.isArray(data.data) || !Number.isInteger(data.rating?.count) || data.rating.count < 0 ||
      (data.rating.count === 0 ? data.rating.average !== null : typeof data.rating.average !== 'number' || data.rating.average < 1 || data.rating.average > 5) ||
      !Array.isArray(data.rules?.items) || !data.rules.version || !data.meta || data.data.length > 10)
      throw new ReviewsError('Получены некорректные данные отзывов.', 502);
    return data;
  } catch (error) {
    if (error instanceof ReviewsError) throw error;
    throw new ReviewsError('Не удалось загрузить отзывы. Повторите попытку.', 503);
  }
}
