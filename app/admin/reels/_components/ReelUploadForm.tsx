'use client';

import { ChangeEvent, FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, CheckCircle2, Film, ImagePlus, UploadCloud, X } from 'lucide-react';
import { toast } from 'react-toastify';
import { useUploadReel } from '@/services/reels/hooks';
import { useGetMyPropertiesQuery } from '@/services/properties/hooks';
import showAxiosErrorToast from '@/utils/showAxiosErrorToast';

const MAX_VIDEO_BYTES = 100 * 1024 * 1024;
const VIDEO_TYPES = ['video/mp4', 'video/quicktime'];
const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

const formatSize = (bytes: number) => `${(bytes / 1024 / 1024).toFixed(1)} МБ`;

export function ReelUploadForm() {
  const router = useRouter();
  const videoInputRef = useRef<HTMLInputElement | null>(null);
  const previewInputRef = useRef<HTMLInputElement | null>(null);
  const uploadReel = useUploadReel();
  const { data: properties } = useGetMyPropertiesQuery(
    { page: 1, per_page: 100, moderation_status: 'approved' },
    true
  );

  const [video, setVideo] = useState<File | null>(null);
  const [preview, setPreview] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [propertyId, setPropertyId] = useState('');
  const [duration, setDuration] = useState<number | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!video) {
      setVideoUrl('');
      return;
    }
    const url = URL.createObjectURL(video);
    setVideoUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [video]);

  const propertyOptions = useMemo(
    () => properties?.data ?? [],
    [properties?.data]
  );

  const chooseVideo = (file?: File) => {
    setError('');
    if (!file) return;
    if (!VIDEO_TYPES.includes(file.type)) {
      setError('Поддерживаются видео MP4 и MOV.');
      return;
    }
    if (file.size > MAX_VIDEO_BYTES) {
      setError('Видео должно быть не больше 100 МБ.');
      return;
    }
    setVideo(file);
    if (!title.trim()) setTitle(file.name.replace(/\.[^.]+$/, ''));
  };

  const choosePreview = (file?: File) => {
    if (!file) return;
    if (!IMAGE_TYPES.includes(file.type) || file.size > 8 * 1024 * 1024) {
      toast.error('Обложка должна быть JPG, PNG или WEBP до 8 МБ.');
      return;
    }
    setPreview(file);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!video) {
      setError('Сначала выберите видео.');
      return;
    }

    const payload = new FormData();
    payload.append('video', video);
    if (preview) payload.append('preview_image', preview);
    if (title.trim()) payload.append('title', title.trim());
    if (description.trim()) payload.append('description', description.trim());
    if (propertyId) payload.append('property_id', propertyId);
    if (duration && Number.isFinite(duration)) payload.append('duration', String(Math.ceil(duration)));
    payload.append('aspect_ratio', '9:16');

    try {
      const reel = await uploadReel.mutateAsync(payload);
      toast.success('Видео загружено и отправлено в обработку');
      router.push(`/admin/reels/${reel.id}`);
      router.refresh();
    } catch (uploadError) {
      showAxiosErrorToast(uploadError, 'Не удалось загрузить рилс');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-5xl space-y-5">
      <header className="flex flex-col gap-4 rounded-[26px] bg-white p-5 shadow-[0_1px_2px_rgba(16,24,40,0.04)] sm:flex-row sm:items-center sm:justify-between md:p-6">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full bg-[#EFFAF5] px-3 py-1 text-xs font-semibold text-[#006341]">
            <Film className="h-3.5 w-3.5" />
            Новый рилс
          </span>
          <h1 className="mt-3 text-2xl font-extrabold text-[#101828] sm:text-[30px]">
            Загрузите вертикальное видео
          </h1>
          <p className="mt-2 text-sm leading-6 text-[#667085]">
            MP4 или MOV, до 100 МБ. После обработки рилс можно сразу опубликовать.
          </p>
        </div>
        <Link
          href="/admin/reels"
          className="inline-flex w-fit items-center gap-2 rounded-xl border border-[#D0D5DD] px-4 py-2.5 text-sm font-semibold text-[#344054]"
        >
          <ArrowLeft className="h-4 w-4" />
          К рилсам
        </Link>
      </header>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <section className="rounded-[26px] bg-white p-5 shadow-[0_1px_2px_rgba(16,24,40,0.04)] md:p-6">
          <h2 className="text-lg font-bold text-[#101828]">Видео</h2>
          <input
            ref={videoInputRef}
            type="file"
            accept="video/mp4,video/quicktime"
            className="sr-only"
            onChange={(event: ChangeEvent<HTMLInputElement>) => chooseVideo(event.target.files?.[0])}
          />

          {videoUrl ? (
            <div className="mt-4 overflow-hidden rounded-[24px] bg-[#0F172A]">
              <video
                src={videoUrl}
                controls
                playsInline
                className="mx-auto aspect-[9/16] max-h-[560px] w-full object-contain"
                onLoadedMetadata={(event) => setDuration(event.currentTarget.duration)}
              />
              <div className="flex items-center justify-between gap-3 border-t border-white/10 px-4 py-3 text-sm text-white">
                <span className="min-w-0 truncate">{video?.name}</span>
                <button
                  type="button"
                  onClick={() => {
                    setVideo(null);
                    setDuration(null);
                  }}
                  className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10"
                  aria-label="Удалить выбранное видео"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => videoInputRef.current?.click()}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();
                chooseVideo(event.dataTransfer.files?.[0]);
              }}
              className="mt-4 flex min-h-72 w-full flex-col items-center justify-center rounded-[24px] border-2 border-dashed border-[#BCD8CB] bg-[#F4FBF7] px-6 text-center transition hover:border-[#006341]"
            >
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-[#006341] shadow-sm">
                <UploadCloud className="h-6 w-6" />
              </span>
              <span className="mt-4 font-bold text-[#16352A]">Выбрать или перетащить видео</span>
              <span className="mt-1 text-sm text-[#668076]">Лучший формат — 9:16, от 5 до 60 секунд</span>
            </button>
          )}
          {error ? <p className="mt-3 text-sm font-medium text-[#B42318]">{error}</p> : null}

          <div className="mt-6 grid gap-4">
            <label className="grid gap-2 text-sm font-semibold text-[#344054]">
              Заголовок
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                maxLength={255}
                placeholder="Например, квартира с видом на город"
                className="h-12 rounded-xl border border-[#D0D5DD] px-4 font-normal outline-none transition focus:border-[#006341] focus:ring-2 focus:ring-[#D8F0E5]"
              />
            </label>
            <label className="grid gap-2 text-sm font-semibold text-[#344054]">
              Описание
              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                rows={4}
                placeholder="Коротко расскажите, что увидит пользователь"
                className="resize-none rounded-xl border border-[#D0D5DD] px-4 py-3 font-normal outline-none transition focus:border-[#006341] focus:ring-2 focus:ring-[#D8F0E5]"
              />
            </label>
            <label className="grid gap-2 text-sm font-semibold text-[#344054]">
              Привязать к объявлению
              <select
                value={propertyId}
                onChange={(event) => setPropertyId(event.target.value)}
                className="h-12 rounded-xl border border-[#D0D5DD] bg-white px-4 font-normal outline-none focus:border-[#006341]"
              >
                <option value="">Без привязки</option>
                {propertyOptions.map((property) => (
                  <option key={property.id} value={property.id}>
                    {property.title || `Объявление #${property.id}`}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </section>

        <aside className="space-y-5">
          <section className="rounded-[26px] bg-white p-5 shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
            <h2 className="font-bold text-[#101828]">Обложка</h2>
            <p className="mt-1 text-sm leading-6 text-[#667085]">
              Необязательно. Без неё система создаст кадр из видео.
            </p>
            <input
              ref={previewInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              onChange={(event) => choosePreview(event.target.files?.[0])}
            />
            <button
              type="button"
              onClick={() => previewInputRef.current?.click()}
              className="mt-4 flex w-full items-center gap-3 rounded-2xl border border-[#D8E4DE] bg-[#F8FBF9] p-4 text-left"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-[#006341] shadow-sm">
                {preview ? <CheckCircle2 className="h-5 w-5" /> : <ImagePlus className="h-5 w-5" />}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold text-[#26362F]">
                  {preview?.name || 'Выбрать обложку'}
                </span>
                <span className="mt-0.5 block text-xs text-[#7A8A82]">
                  {preview ? formatSize(preview.size) : 'JPG, PNG или WEBP'}
                </span>
              </span>
            </button>
          </section>

          <section className="rounded-[26px] border border-[#CFE6DA] bg-[#F1FAF6] p-5">
            <h2 className="font-bold text-[#075D40]">Что произойдёт дальше</h2>
            <ol className="mt-3 space-y-3 text-sm leading-6 text-[#4C6B5E]">
              <li>1. Видео загрузится и обработается.</li>
              <li>2. Появится готовая обложка и статус.</li>
              <li>3. Нажмите «Опубликовать» на странице рилса.</li>
            </ol>
          </section>

          <button
            type="submit"
            disabled={uploadReel.isPending || !video}
            className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#006341] px-5 text-sm font-bold text-white shadow-[0_10px_25px_rgba(0,99,65,0.2)] transition hover:bg-[#005438] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <UploadCloud className="h-4 w-4" />
            {uploadReel.isPending ? 'Загрузка…' : 'Загрузить рилс'}
          </button>
        </aside>
      </div>
    </form>
  );
}
