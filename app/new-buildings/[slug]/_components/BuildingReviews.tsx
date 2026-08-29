'use client';

import { measureResidential } from '@/services/new-buildings/track';

import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { API_BASE_URL } from '@/config/api';
import { axios } from '@/utils/axios';
import { useMe } from '@/services/login/hooks';
import { fetchBuildingReviews, ratingLabel, reviewDate, reviewDraft, reviewStatus, reviewVersionChanged, type OwnReview, type PublicReview, type ReviewRules } from '@/services/new-buildings/reviews';
import { reviewError, useOwnBuildingReview, useSaveBuildingReview } from '@/services/new-buildings/use-building-reviews';

const button = 'min-h-11 rounded-xl border px-4 py-2 font-semibold text-[#006341] disabled:opacity-50';
const input = 'mt-1 block min-h-11 w-full rounded-xl border border-gray-400 bg-white p-3';

export default function BuildingReviews({ buildingId, scrollOffset, unavailable }: { buildingId: number; scrollOffset: number; unavailable: boolean }) {
  const [page, setPage] = useState(1);
  const [rules, setRules] = useState<ReviewRules | null>(null);
  const me = useMe(), userId = me.data?.id;
  const query = useQuery({ queryKey: ['building-reviews', buildingId, 'public', page],
    queryFn: ({ signal }) => measureResidential({ surface: 'building', building_id: buildingId, endpoint: 'reviews' }, () => fetchBuildingReviews(API_BASE_URL, buildingId, page, signal), signal), enabled: !unavailable,
    refetchInterval: 30_000, refetchOnWindowFocus: true, retry: false });
  const own = useOwnBuildingReview(buildingId, userId);
  useEffect(() => { if (query.data?.rules) setRules(query.data.rules); }, [query.data?.rules]);
  const data = !unavailable && !query.isError ? query.data : undefined;
  return <section id="reviews" className="min-w-0 rounded-3xl border border-gray-200 bg-white p-4 md:p-6" style={{ scrollMarginTop: scrollOffset }}>
    <h2 className="text-2xl font-bold">Отзывы о ЖК</h2>
    {query.isPending && <p role="status" className="mt-4">Загрузка отзывов…</p>}
    {(query.isError || unavailable) && <div role="alert" className="mt-4"><p>Актуальные отзывы и рейтинг не получены.</p><button className={button} onClick={() => void query.refetch()}>Повторить загрузку отзывов</button></div>}
    {data && <>
      <p className="my-4 font-semibold" aria-live="polite">{ratingLabel(data.rating)}</p>
      <p className="mb-4 text-sm text-gray-600">Рейтинг учитывает только опубликованные отзывы. После редактирования отзыв проходит повторную проверку.</p>
      <details className="mb-5 rounded-xl border p-3"><summary className="min-h-11 cursor-pointer font-semibold">Правила публикации отзывов</summary><ul className="list-disc space-y-2 pl-5">{data.rules.items.map(rule => <li key={rule}>{rule}</li>)}</ul></details>
      <div className="space-y-4">{data.data.map(review => <ReviewEntry key={review.id + ':' + userId} review={review} buildingId={buildingId}
        reporterId={!own.isError && own.data?.user_id === userId && own.data?.data?.id !== review.id ? userId : undefined} />)}</div>
      {!data.data.length && data.rating.count > 0 && <p>На этой странице нет отзывов. Перейдите на предыдущую.</p>}
      {data.meta.last_page > 1 && <nav aria-label="Страницы отзывов" className="my-4 flex flex-wrap items-center gap-3">
        <button className={button} disabled={page <= 1 || query.isFetching} onClick={() => setPage(p => p - 1)}>Предыдущие отзывы</button>
        <span>Страница {page} из {data.meta.last_page}</span>
        <button className={button} disabled={page >= data.meta.last_page || query.isFetching} onClick={() => setPage(p => p + 1)}>Следующие отзывы</button>
      </nav>}
    </>}
    {rules && <div className="mt-6 border-t pt-5">
        {!userId ? <><p>Чтобы оставить отзыв или жалобу, войдите в аккаунт.</p><button className={button + ' mt-3'} onClick={() => window.dispatchEvent(new Event('open-login-modal'))}>Войти для отзыва</button></>
          : own.data?.user_id === userId ? <ReviewEditor key={buildingId + ':' + userId} current={own.data.data} rules={rules} blocked={own.isError || !data} buildingId={buildingId} userId={userId} refresh={() => void own.refetch()} />
          : own.isError ? <div role="alert"><p>Не удалось получить ваш отзыв.</p><button className={button} onClick={() => void own.refetch()}>Загрузить мой отзыв</button></div> : <p role="status">Загрузка вашего отзыва…</p>}
      </div>}
  </section>;
}

function ReviewEditor({ current, rules, buildingId, userId, refresh, blocked }: { blocked: boolean; current: OwnReview | null; rules: ReviewRules; buildingId: number; userId: number; refresh: () => void }) {
  const [draft, setDraft] = useState(() => reviewDraft(current, rules.version));
  const [message, setMessage] = useState(''), [error, setError] = useState('');
  const save = useSaveBuildingReview(buildingId, userId);
  const conflict = reviewVersionChanged(draft, current) || draft.rules_version !== rules.version;
  const change = async (withdraw: boolean) => {
    setMessage(''); setError('');
    try {
      const response = await save.mutateAsync(withdraw ? { withdrawVersion: draft.version } : { input: draft });
      setDraft(reviewDraft(response.data, rules.version));
      setMessage(withdraw ? 'Отзыв отозван и больше не участвует в рейтинге.' : 'Отзыв отправлен на проверку. До одобрения он не виден другим посетителям.');
    } catch (e) { setError(reviewError(e)); }
  };
  return <form onSubmit={event => { event.preventDefault(); void change(false); }} className="space-y-4">
    <h3 className="text-xl font-semibold">{current ? 'Ваш отзыв' : 'Оставить отзыв'}</h3>
    {current && <p>Статус: {reviewStatus[current.status]} · Версия {current.version}</p>}
    {current?.moderation_reason && <p className="rounded-xl bg-amber-50 p-3">Решение модератора: {current.moderation_reason}</p>}
    {conflict && <div role="alert" className="space-y-3 rounded-xl border border-amber-400 p-3">
      <p>На сервере другая версия. Ваш текст ниже не изменён. Актуальный текст:</p>
      <p className="whitespace-pre-wrap break-words">{current?.text || 'Отзыва нет.'}</p>
      <p>Актуальная оценка: {current?.rating ?? '—'} · Имя: {current?.display_name ?? '—'}</p>
      <button type="button" className={button} onClick={() => { setDraft(d => ({ ...d, version: current?.version ?? 0, rules_version: rules.version, accept_rules: false })); setError(''); }}>Сравнил: оставить мой текст для повторной отправки</button>
      <button type="button" className={button} onClick={() => { setDraft(reviewDraft(current, rules.version)); setError(''); }}>Заменить форму актуальным отзывом</button>
    </div>}
    <fieldset disabled={save.isPending || blocked} className="space-y-4 disabled:opacity-60">
      <label className="block">Публичное имя<input className={input} autoComplete="nickname" required minLength={2} maxLength={80} value={draft.display_name} onChange={e => setDraft(d => ({ ...d, display_name: e.target.value }))} /></label>
      <label className="block">Оценка<select className={input} value={draft.rating} onChange={e => setDraft(d => ({ ...d, rating: Number(e.target.value) }))}>{[1, 2, 3, 4, 5].map(value => <option key={value} value={value}>{value} из 5</option>)}</select></label>
      <label className="block">Текст отзыва<textarea className={input} required minLength={10} maxLength={2000} rows={5} value={draft.text} onChange={e => setDraft(d => ({ ...d, text: e.target.value }))} /><span className="text-sm text-gray-600">От 10 до 2000 символов. Сейчас: {draft.text.length}.</span></label>
      <label className="flex min-h-11 items-start gap-3"><input type="checkbox" required className="mt-1 h-5 w-5 shrink-0" checked={draft.accept_rules} onChange={e => setDraft(d => ({ ...d, accept_rules: e.target.checked }))} /><span>Принимаю правила публикации выше и согласен на публикацию выбранного имени, оценки и текста.</span></label>
      <div className="flex flex-wrap gap-3"><button className={button} disabled={conflict}>{save.isPending ? 'Отправка…' : 'Отправить на проверку'}</button>
        {current && current.status !== 'withdrawn' && <button type="button" className={button} disabled={conflict} onClick={() => void change(true)}>Отозвать отзыв</button>}
        <button type="button" className={button} onClick={refresh}>Обновить статус</button></div>
    </fieldset>
    {blocked && <div role="alert"><p>Актуальные данные недоступны. Ваш текст сохранён в форме; отправка временно отключена.</p><button type="button" className={button} onClick={refresh}>Загрузить мой отзыв</button></div>}
    {error && <p role="alert" className="text-red-700">{error}</p>}
    {message && <p role="status" className="text-green-800">{message}</p>}
  </form>;
}

function ReviewEntry({ review, buildingId, reporterId }: { review: PublicReview; buildingId: number; reporterId?: number }) {
  const [report, setReport] = useState<{ version: number; reason: string } | null>(null);
  const [busy, setBusy] = useState(false), [message, setMessage] = useState(''), [error, setError] = useState('');
  const cache = useQueryClient();
  const send = async () => {
    if (!report || !reporterId) return;
    setBusy(true); setError(''); setMessage('');
    try {
      await axios.post('/v2/new-buildings/' + buildingId + '/reviews/' + review.id + '/reports',
        { review_version: report.version, reason: report.reason, expected_user_id: reporterId }, { timeout: 15_000 });
      setReport(null); setMessage('Жалоба принята. Решение примет модератор.');
    } catch (e) { setError(reviewError(e)); await cache.invalidateQueries({ queryKey: ['building-reviews', buildingId] }); }
    finally { setBusy(false); }
  };
  return <article className="min-w-0 rounded-2xl border p-4">
    <h3 className="break-words font-semibold">{review.display_name}</h3><p className="mt-1 text-sm">Оценка: {review.rating} из 5 · {reviewDate(review.updated_at)}</p>
    <p className="mt-3 whitespace-pre-wrap break-words">{review.text}</p>
    {reporterId && !report && <button type="button" className={button + ' mt-3'} onClick={() => { setReport({ version: review.version, reason: '' }); setMessage(''); }}>Пожаловаться на отзыв</button>}
    {reporterId && report && <form className="mt-4 space-y-3" onSubmit={e => { e.preventDefault(); void send(); }}>
      <label className="block">Причина жалобы<textarea className={input} required maxLength={1000} rows={3} disabled={busy} value={report.reason} onChange={e => setReport({ ...report, reason: e.target.value })} /></label>
      {report.version !== review.version && <p role="alert">Отзыв изменён. Закройте форму и ознакомьтесь с новой версией.</p>}
      <div className="flex flex-wrap gap-3"><button className={button} disabled={busy || report.version !== review.version}>Отправить жалобу</button><button type="button" className={button} disabled={busy} onClick={() => { setReport(null); setError(''); }}>Отмена</button></div>
      <p className="text-sm text-gray-600">Причина жалобы доступна только модерации.</p>
    </form>}
    {error && <p role="alert" className="mt-3 text-red-700">{error}</p>}{message && <p role="status" className="mt-3 text-green-800">{message}</p>}
  </article>;
}
