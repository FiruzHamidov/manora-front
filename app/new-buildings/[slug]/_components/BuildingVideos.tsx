'use client';

import { measureResidential } from '@/services/new-buildings/track';

import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { API_BASE_URL } from '@/config/api';
import { fetchPublicVideos } from '@/services/new-buildings/public-building-api';
import { videoFrameBlocked, videoLinks, type PublicBuildingVideo } from '@/services/new-buildings/videos';
import { useResidentialResourceFailure } from '@/services/new-buildings/use-resource-failure';

const button = 'inline-flex min-h-11 items-center justify-center rounded-xl border border-green-800 px-4 py-2 text-green-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-800 disabled:opacity-40';
export default function BuildingVideos({ buildingId, version, scrollOffset, unavailable }: { buildingId: number; version: number; scrollOffset: number; unavailable: boolean }) {
  const section = useRef<HTMLElement>(null), [visible, setVisible] = useState(false);
  useEffect(() => {
    const observer = new IntersectionObserver(entries => { if (entries.some(entry => entry.isIntersecting)) { setVisible(true); observer.disconnect(); } }, { rootMargin: '200px' });
    if (section.current) observer.observe(section.current);
    return () => observer.disconnect();
  }, []);
  const query = useQuery({ queryKey: ['public-building-videos', buildingId, version], enabled: visible && !unavailable,
    queryFn: ({ signal }) => measureResidential({ surface: 'building', building_id: buildingId, endpoint: 'videos' }, () => fetchPublicVideos(API_BASE_URL, buildingId, signal), signal), retry: 1, refetchInterval: 30_000, refetchOnWindowFocus: true });
  return <section ref={section} id="videos" className="min-w-0 space-y-4 rounded-3xl border border-gray-200 bg-white p-4 md:p-6" style={{ scrollMarginTop: scrollOffset }}>
    <h2 className="text-2xl font-bold">Видео о комплексе</h2>
    <p className="text-sm text-gray-600">Плеер стороннего сервиса загрузится только после нажатия. Воспроизведение запускается в плеере.</p>
    {unavailable || query.isError ? <div role="alert" className="space-y-3"><p>Видео сейчас недоступны. Вы можете продолжить выбор квартиры или оставить заявку.</p><button className={button} disabled={unavailable || query.isFetching} onClick={() => void query.refetch()}>Повторить загрузку видео</button></div>
      : !query.data ? <p role="status">{visible ? 'Загрузка списка видео…' : 'Список видео загрузится при просмотре раздела.'}</p>
      : !query.data.videos.length ? <p>Видео пока не опубликованы.</p>
      : <div className="space-y-5">{query.data.videos.map(video => <VideoPlayer key={video.id + ':' + video.embed_url} buildingId={buildingId} video={video} />)}</div>}
  </section>;
}

function VideoPlayer({ buildingId, video }: { buildingId: number; video: PublicBuildingVideo }) {
  const links = videoLinks(video), [active, setActive] = useState(false), [attempt, setAttempt] = useState(0), [loaded, setLoaded] = useState(false), [failed, setFailed] = useState(false);
  const frame = useRef<HTMLIFrameElement>(null);
  const embed = links?.embed;
  useEffect(() => {
    if (!embed) return;
    const blocked = (event: SecurityPolicyViolationEvent) => {
      if (frame.current && videoFrameBlocked(event, embed)) setFailed(true);
    };
    document.addEventListener('securitypolicyviolation', blocked);
    return () => document.removeEventListener('securitypolicyviolation', blocked);
  }, [embed]);
  useResidentialResourceFailure(failed, attempt, { surface: 'building', endpoint: 'video-player', building_id: buildingId });
  useEffect(() => {
    if (!active || loaded || failed) return;
    const timer = window.setTimeout(() => setFailed(true), 15_000);
    return () => window.clearTimeout(timer);
  }, [active, loaded, failed, attempt]);
  const start = () => { setFailed(false); setLoaded(false); setAttempt(value => value + 1); setActive(true); };
  return <article className="min-w-0 space-y-3 break-words rounded-2xl border p-3">
    <h3 className="text-lg font-semibold">{video.title}</h3>
    {!links ? <p role="alert">Ссылка на видео не поддерживается.</p> : <>
      {!active ? <div className="flex min-h-48 flex-col items-center justify-center gap-3 rounded-xl bg-gray-100 p-4 text-center"><p>{video.provider === 'youtube' ? 'YouTube' : 'Vimeo'}</p><button className={button} onClick={start}>Загрузить плеер: {video.title}</button></div>
        : failed ? <p role="alert">Не удалось загрузить плеер. Повторите попытку или откройте видео на сайте источника.</p>
        : <><iframe ref={frame} key={attempt} src={links.embed} title={'Видео: ' + video.title} className="aspect-video min-h-[200px] w-full rounded-xl border-0" loading="lazy"
          allow="fullscreen; picture-in-picture; encrypted-media" allowFullScreen referrerPolicy="strict-origin-when-cross-origin"
          onLoad={() => setLoaded(true)} onError={() => setFailed(true)} />
          {!loaded && <p role="status">Загрузка плеера…</p>}</>}
      <div className="flex flex-wrap items-center gap-3">
        <a className={button} href={links.source} target="_blank" rel="noopener noreferrer">Открыть видео на {video.provider === 'youtube' ? 'YouTube' : 'Vimeo'}</a>
        {active && <><button className={button} onClick={start}>Повторить загрузку плеера</button><button className={button} onClick={() => setActive(false)}>Закрыть плеер</button></>}
      </div>
      {active && <p className="text-sm text-gray-600">Если сервис ограничил доступ или встраивание, используйте ссылку на источник. Форма заявки остаётся доступной.</p>}
    </>}
    {video.caption && <p className="whitespace-pre-wrap text-sm text-gray-600">{video.caption}</p>}
  </article>;
}
