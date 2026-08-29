'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { axios } from '@/utils/axios';
import { useMe } from '@/services/login/hooks';
import { reviewDate, reviewAuditSnapshot, reviewStatus, reportStatus, type ManagedReview, type ReviewReport, type ReviewPage } from '@/services/new-buildings/reviews';
import { reviewError } from '@/services/new-buildings/use-building-reviews';

const button = 'min-h-11 rounded-xl border px-4 py-2 font-semibold text-green-800 disabled:opacity-50';
const field = 'mt-1 block min-h-11 w-full rounded-xl border border-gray-400 bg-white p-3';
const basePath = (id: number) => '/manage/new-buildings/' + id;

export default function ReviewsModerationPage() {
  const params = useParams<{ id: string }>(), buildingId = Number(params.id);
  const me = useMe(), user = me.data;
  const allowed = user?.status === 'active' && ['admin', 'superadmin', 'moderator'].includes(user.role?.slug ?? '');
  return <div className="space-y-5">
    <Link className="inline-flex min-h-11 items-center text-green-800 underline" href={'/admin/new-buildings/' + buildingId}>← К жилому комплексу</Link>
    <h1 className="text-2xl font-semibold">Отзывы и жалобы о ЖК</h1>
    {me.isPending ? <p>Загрузка прав…</p> : !allowed || !user ? <p role="alert">Модерация доступна только уполномоченным сотрудникам Manora.</p>
      : <ModerationQueue key={buildingId + ':' + user.id} buildingId={buildingId} userId={user.id} />}
  </div>;
}

function ModerationQueue({ buildingId, userId }: { buildingId: number; userId: number }) {
  const [kind, setKind] = useState<'reviews' | 'review-reports'>('reviews');
  const [status, setStatus] = useState('pending'), [page, setPage] = useState(1);
  const query = useQuery({
    queryKey: ['building-reviews', buildingId, 'moderation', userId, kind, status, page],
    queryFn: async ({ signal }) => (await axios.get<ReviewPage<ManagedReview | ReviewReport>>(basePath(buildingId) + '/' + kind,
      { signal, timeout: 12_000, params: { status, page, expected_user_id: userId } })).data,
    retry: false, refetchInterval: 30_000, refetchOnWindowFocus: true,
  });
  const statuses = kind === 'reviews' ? { pending: 'На проверке', published: 'Опубликованные', rejected: 'Отклонённые', withdrawn: 'Отозванные', all: 'Все отзывы' }
    : { open: 'Открытые жалобы', actioned: 'Отзыв скрыт', dismissed: 'Без скрытия', all: 'Все жалобы' };
  return <>
    <p className="text-sm text-gray-600">Проверяйте личный опыт и соблюдение правил. Низкая оценка сама по себе не является причиной отказа. Собственные отзывы и жалобы передаются другому модератору.</p>
    <div className="flex flex-wrap gap-3">{(['reviews', 'review-reports'] as const).map(value =>
      <button key={value} className={button} aria-pressed={kind === value} onClick={() => { setKind(value); setStatus(value === 'reviews' ? 'pending' : 'open'); setPage(1); }}>{value === 'reviews' ? 'Отзывы' : 'Жалобы'}</button>)}</div>
    <label className="block max-w-sm">Статус очереди<select className={field} value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}>{Object.entries(statuses).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
    {query.isPending && <p role="status">Загрузка очереди…</p>}
    {query.isError && <div role="alert"><p>Не удалось получить актуальную очередь. Решения временно недоступны.</p><button className={button} onClick={() => void query.refetch()}>Обновить очередь</button></div>}
    {!query.isError && query.data && !query.data.data.length && <p>Записей с выбранным статусом нет.</p>}
    <div className="space-y-4">{query.data?.data.map(item => <ModerationCard key={kind + ':' + item.id} item={item} buildingId={buildingId} userId={userId} blocked={query.isError} />)}</div>
    {query.data && query.data.meta.last_page > 1 && <nav aria-label="Страницы очереди" className="flex flex-wrap items-center gap-3">
      <button className={button} disabled={page <= 1 || query.isFetching} onClick={() => setPage(p => p - 1)}>Назад</button>
      <span>Страница {page} из {query.data.meta.last_page}</span>
      <button className={button} disabled={page >= query.data.meta.last_page || query.isFetching} onClick={() => setPage(p => p + 1)}>Далее</button>
    </nav>}
  </>;
}

function ModerationCard({ item, buildingId, userId, blocked }: { item: ManagedReview | ReviewReport; buildingId: number; userId: number; blocked: boolean }) {
  const report = 'review_snapshot' in item ? item : null;
  const review = report ? report.review : item as ManagedReview;
  // Capture the reviewed revision. Background refresh must not approve unseen text.
  const [seen, setSeen] = useState({ version: item.version, reviewVersion: review.version });
  const [reason, setReason] = useState(''), [decision, setDecision] = useState(report ? 'dismiss' : 'publish');
  const [busy, setBusy] = useState(false), [error, setError] = useState(''), [message, setMessage] = useState(''), [history, setHistory] = useState(false);
  const cache = useQueryClient();
  const conflict = seen.version !== item.version || seen.reviewVersion !== review.version;
  const own = review.author_user_id === userId || report?.reporter_user_id === userId;
  const actionable = report ? report.status === 'open' : ['pending', 'published'].includes(review.status);
  const canHide = !!report && report.review_version === review.version && review.status === 'published';
  const submit = async () => {
    setBusy(true); setError(''); setMessage('');
    try {
      await axios.patch(basePath(buildingId) + '/reviews/' + review.id + (report ? '/reports/' + report.id : ''),
        { version: seen.version, decision: !report && review.status === 'published' ? 'reject' : decision, reason, expected_user_id: userId }, { timeout: 15_000 });
      setMessage('Решение сохранено.'); setReason('');
    } catch (e) { setError(reviewError(e)); }
    finally { await cache.invalidateQueries({ queryKey: ['building-reviews', buildingId] }); setBusy(false); }
  };
  return <article className="min-w-0 space-y-3 rounded-2xl border bg-white p-4">
    <h2 className="break-words text-lg font-semibold">{report ? 'Жалоба №' + report.id : 'Отзыв №' + review.id} · {review.display_name}</h2>
    <p>Статус: {report ? reportStatus[report.status] : reviewStatus[review.status]} · Оценка: {review.rating} из 5 · {reviewDate(review.updated_at)}</p>
    <p className="text-sm text-gray-600">Автор: {review.author_user_id ?? 'аккаунт удалён'} · Версия отзыва: {review.version}</p>
    <p className="whitespace-pre-wrap break-words">{review.text}</p>
    {review.moderation_reason && <p className="break-words">Решение по отзыву: {review.moderation_reason}</p>}
    {report && <div className="space-y-2 rounded-xl bg-amber-50 p-3">
      <p className="whitespace-pre-wrap break-words"><strong>Причина жалобы:</strong> {report.reason}</p>
      <p>Отправитель: {report.reporter_user_id ?? 'аккаунт удалён'} · Версия жалобы: {report.version}</p>
      <details><summary className="min-h-11 cursor-pointer">Текст на момент жалобы (версия {report.review_version})</summary><p className="whitespace-pre-wrap break-words">{report.review_snapshot.text}</p><p>Оценка: {report.review_snapshot.rating} · Имя: {report.review_snapshot.display_name}</p></details>
      {!canHide && report.status === 'open' && <p>Текущий отзыв отличается от версии в жалобе или уже не опубликован. Скрытие по этой жалобе недоступно; новую версию проверяйте отдельно.</p>}
      {report.resolution_reason && <p>Результат рассмотрения: {report.resolution_reason}</p>}
    </div>}
    {conflict && <div role="alert" className="space-y-2 rounded-xl border border-amber-400 p-3"><p>Запись обновилась. Перед решением прочитайте актуальный текст выше.</p>
      <button className={button} disabled={busy || blocked} onClick={() => { setSeen({ version: item.version, reviewVersion: review.version }); setError(''); }}>Актуальная версия прочитана</button></div>}
    {own && <p>Эту запись должен рассмотреть другой модератор.</p>}
    {actionable && !own && <form className="space-y-3" onSubmit={e => { e.preventDefault(); void submit(); }}>
      <fieldset disabled={busy || blocked || conflict} className="space-y-3 disabled:opacity-50">
        <label className="block">Решение<select className={field} value={!report && review.status === 'published' ? 'reject' : decision}
          onChange={e => setDecision(e.target.value)}>
          {report ? <><option value="dismiss">Закрыть жалобу без скрытия отзыва</option><option value="hide_review" disabled={!canHide}>Скрыть отзыв и удовлетворить жалобу</option></>
            : <><option value="publish" disabled={review.status !== 'pending'}>Опубликовать</option><option value="reject">Отклонить / снять с публикации</option></>}
        </select></label>
        <label className="block">Обоснование решения<textarea className={field} required maxLength={1000} rows={3} value={reason} onChange={e => setReason(e.target.value)} /></label>
        <p className="text-sm text-gray-600">Обоснование решения по отзыву видно автору. Не включайте в него данные заявителя.</p>
        <button className={button} disabled={!!report && decision === 'hide_review' && !canHide}>Сохранить решение</button>
      </fieldset>
    </form>}
    {error && <p role="alert" className="text-red-700">{error}</p>}{message && <p role="status" className="text-green-800">{message}</p>}
    <button className={button} aria-expanded={history} onClick={() => setHistory(value => !value)}>{history ? 'Скрыть историю' : 'История отзыва и жалоб'}</button>
    {history && <ReviewHistory buildingId={buildingId} reviewId={review.id} userId={userId} />}
  </article>;
}

type AuditEntry = { id: number; subject_type: string; actor_id: number | null; version: number; reason: string; created_at: string; before: string; after: string };
function ReviewHistory({ buildingId, reviewId, userId }: { buildingId: number; reviewId: number; userId: number }) {
  const [page, setPage] = useState(1);
  const query = useQuery({ queryKey: ['building-reviews', buildingId, 'history', reviewId, userId, page],
    queryFn: async ({ signal }) => (await axios.get<ReviewPage<AuditEntry>>(basePath(buildingId) + '/reviews/' + reviewId + '/history',
      { signal, timeout: 12_000, params: { page, expected_user_id: userId } })).data, retry: false });
  return <div className="space-y-3 border-t pt-3">
    {query.isPending && <p>Загрузка истории…</p>}
    {query.isError ? <p role="alert">История недоступна. Закройте и откройте её повторно.</p> : query.data?.data.map(entry => <details key={entry.id} className="min-w-0 rounded-xl border p-3">
      <summary className="min-h-11 cursor-pointer break-words">{entry.subject_type === 'new_building_review' ? 'Отзыв' : 'Жалоба'} · Версия {entry.version} · {reviewDate(entry.created_at)} · {entry.reason}</summary>
      <p>Автор действия: {entry.actor_id ?? 'аккаунт удалён'}</p>
      <p>Время записи: {entry.created_at}</p>
      <h4 className="mt-2 font-semibold">До изменения</h4><pre className="whitespace-pre-wrap break-all text-xs">{reviewAuditSnapshot(entry.before)}</pre>
      <h4 className="mt-2 font-semibold">После изменения</h4><pre className="whitespace-pre-wrap break-all text-xs">{reviewAuditSnapshot(entry.after)}</pre>
    </details>)}
    {query.data && <nav aria-label="Страницы истории" className="flex flex-wrap gap-3"><button className={button} disabled={page <= 1} onClick={() => setPage(p => p - 1)}>История: назад</button><span>{page} / {query.data.meta.last_page}</span><button className={button} disabled={page >= query.data.meta.last_page} onClick={() => setPage(p => p + 1)}>История: далее</button></nav>}
  </div>;
}
