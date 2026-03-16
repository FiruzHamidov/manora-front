'use client';

import { FormEvent, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Eye } from 'lucide-react';
import { toast } from 'react-toastify';
import { Input } from '@/ui-components/Input';
import { Select } from '@/ui-components/Select';
import { Button } from '@/ui-components/Button';
import { ReelScenesEditor, type ReelSceneFormValue } from '@/app/admin/reels/_components/ReelScenesEditor';
import { ReelScenarioPreview } from '@/app/admin/reels/_components/ReelScenarioPreview';
import { ReelSourceFields } from '@/app/admin/reels/_components/ReelSourceFields';
import { useCreateReel, useUpdateReel } from '@/services/reels/hooks';
import type {
  CreateReelPayload,
  Reel,
  ReelContentType,
  ReelScene,
  ReelSourceData,
  ReelSourceType,
  UpdateReelPayload,
} from '@/services/reels/types';
import showAxiosErrorToast from '@/utils/showAxiosErrorToast';

type ReelFormProps = {
  mode: 'create' | 'edit';
  reel?: Reel;
};

type ReelFormValues = {
  sourceType: ReelSourceType;
  sourceId: string;
  duration: string;
  title: string;
  description: string;
  posterSecond: string;
  aspectRatio: string;
  hook: string;
  cta: string;
  language: string;
  tone: string;
  sourceDataTitle: string;
  sourceDataDescription: string;
  sourceDataHook: string;
  scenes: ReelSceneFormValue[];
};

function detectSourceType(reel?: Reel): ReelSourceType {
  if (!reel) return 'property';
  if (reel.content_type === 'generic') return 'generic';

  const raw = reel.reelable_type?.toLowerCase() ?? '';
  if (raw.includes('property')) return 'property';
  if (raw.includes('car')) return 'car';
  if (raw.includes('developer')) return 'developer';

  if (reel.content_type === 'property') return 'property';
  if (reel.content_type === 'car') return 'car';
  if (reel.content_type === 'developer') return 'developer';

  return 'generic';
}

function createEmptyScene(lastEndSecond?: string): ReelSceneFormValue {
  const nextStart = lastEndSecond && !Number.isNaN(Number(lastEndSecond))
    ? String(Number(lastEndSecond))
    : '';

  return {
    start_second: nextStart,
    end_second: '',
    visual: '',
    voiceover: '',
    onscreen_text: '',
  };
}

function mapScenesToForm(scenes?: ReelScene[]): ReelSceneFormValue[] {
  if (!scenes?.length) return [];

  return scenes.map((scene) => ({
    start_second: String(scene.start_second ?? ''),
    end_second: String(scene.end_second ?? ''),
    visual: scene.visual ?? '',
    voiceover: scene.voiceover ?? '',
    onscreen_text: scene.onscreen_text ?? '',
  }));
}

function getInitialValues(reel?: Reel): ReelFormValues {
  const sourceType = detectSourceType(reel);
  const sourceData = reel?.source_data ?? {};

  return {
    sourceType,
    sourceId: reel?.reelable_id ? String(reel.reelable_id) : '',
    duration: reel?.duration ? String(reel.duration) : '30',
    title: reel?.title ?? '',
    description: reel?.description ?? '',
    posterSecond:
      reel?.poster_second === undefined || reel?.poster_second === null
        ? ''
        : String(reel.poster_second),
    aspectRatio: reel?.aspect_ratio ?? '9:16',
    hook: reel?.hook ?? '',
    cta: reel?.cta ?? '',
    language: reel?.language ?? 'ru',
    tone: reel?.tone ?? 'selling',
    sourceDataTitle: String(sourceData.title ?? reel?.title ?? ''),
    sourceDataDescription: String(sourceData.description ?? reel?.description ?? ''),
    sourceDataHook: String(sourceData.hook ?? reel?.hook ?? ''),
    scenes: mapScenesToForm(reel?.scenes),
  };
}

function sanitizeText(value: string) {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function validateValues(values: ReelFormValues) {
  const errors: Record<string, string> = {};
  const duration = Number(values.duration);
  const posterSecond = values.posterSecond === '' ? null : Number(values.posterSecond);

  if (!Number.isFinite(duration) || duration <= 0) {
    errors.duration = 'Укажите длительность больше 0 секунд';
  }

  if (values.sourceType !== 'generic' && !values.sourceId) {
    errors.source_id = 'Выберите источник, к которому будет привязан рилс';
  }

  if (values.sourceType === 'generic') {
    if (!values.sourceDataTitle.trim()) {
      errors.source_data_title = 'Для generic-рила нужен заголовок основы';
    }
    if (!values.sourceDataHook.trim()) {
      errors.source_data_hook = 'Для generic-рила нужен hook основы';
    }
  }

  if (posterSecond !== null) {
    if (!Number.isFinite(posterSecond) || posterSecond < 0) {
      errors.posterSecond = 'Укажите корректную секунду постера';
    } else if (Number.isFinite(duration) && posterSecond > duration) {
      errors.posterSecond = 'Постер не может быть позже длительности рилса';
    }
  }

  values.scenes.forEach((scene, index) => {
    const start = Number(scene.start_second);
    const end = Number(scene.end_second);

    if (scene.start_second !== '' && !Number.isFinite(start)) {
      errors[`scene-${index}-start_second`] = 'Укажите число';
    }

    if (scene.end_second !== '' && !Number.isFinite(end)) {
      errors[`scene-${index}-end_second`] = 'Укажите число';
    }

    if (scene.start_second !== '' && scene.end_second !== '' && Number.isFinite(start) && Number.isFinite(end)) {
      if (end <= start) {
        errors[`scene-${index}-end_second`] = 'Окончание должно быть больше начала';
      } else if (Number.isFinite(duration) && end > duration) {
        errors[`scene-${index}-end_second`] = 'Сцена не должна выходить за длительность рилса';
      }
    }
  });

  return errors;
}

function buildScenesPayload(values: ReelFormValues): ReelScene[] {
  return values.scenes
    .filter((scene) => {
      return (
        scene.start_second !== '' ||
        scene.end_second !== '' ||
        scene.visual.trim() ||
        scene.voiceover.trim() ||
        scene.onscreen_text.trim()
      );
    })
    .map((scene) => ({
      start_second: Number(scene.start_second || 0),
      end_second: Number(scene.end_second || 0),
      visual: scene.visual.trim(),
      voiceover: scene.voiceover.trim(),
      onscreen_text: scene.onscreen_text.trim(),
    }));
}

function buildSourceData(values: ReelFormValues, reel?: Reel): ReelSourceData | null | undefined {
  if (values.sourceType !== 'generic') {
    return reel?.source_data ?? undefined;
  }

  const base = reel?.source_data ?? {};
  return {
    ...base,
    title: values.sourceDataTitle.trim(),
    description: values.sourceDataDescription.trim(),
    hook: values.sourceDataHook.trim(),
  };
}

function buildUpdatePayload(values: ReelFormValues, reel?: Reel): UpdateReelPayload {
  return {
    content_type: values.sourceType as ReelContentType,
    language: values.language.trim() || 'ru',
    tone: values.tone.trim() || 'selling',
    title: sanitizeText(values.title),
    description: sanitizeText(values.description),
    duration: Number(values.duration),
    poster_second: values.posterSecond === '' ? null : Number(values.posterSecond),
    aspect_ratio: values.aspectRatio.trim() || '9:16',
    hook: sanitizeText(values.hook),
    scenes: buildScenesPayload(values),
    cta: sanitizeText(values.cta),
    source_data: buildSourceData(values, reel),
  };
}

function needsPostCreateUpdate(values: ReelFormValues) {
  if (values.sourceType === 'generic') return true;

  return Boolean(
    values.title.trim() ||
      values.description.trim() ||
      values.posterSecond !== '' ||
      values.aspectRatio.trim() !== '9:16' ||
      values.hook.trim() ||
      values.cta.trim() ||
      values.language.trim() !== 'ru' ||
      values.tone.trim() !== 'selling' ||
      values.scenes.some((scene) =>
        Boolean(
          scene.start_second !== '' ||
            scene.end_second !== '' ||
            scene.visual.trim() ||
            scene.voiceover.trim() ||
            scene.onscreen_text.trim()
        )
      )
  );
}

export function ReelForm({ mode, reel }: ReelFormProps) {
  const router = useRouter();
  const createReel = useCreateReel();
  const updateReel = useUpdateReel();
  const [values, setValues] = useState<ReelFormValues>(() => getInitialValues(reel));
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isEditing = mode === 'edit';
  const isSubmitting = createReel.isPending || updateReel.isPending;

  const submitLabel = isEditing ? 'Сохранить изменения' : 'Создать рилс';

  const sceneCountLabel = useMemo(() => {
    if (!values.scenes.length) return 'Без сцен';
    return `${values.scenes.length} ${values.scenes.length === 1 ? 'сцена' : values.scenes.length < 5 ? 'сцены' : 'сцен'}`;
  }, [values.scenes.length]);

  const setField = <K extends keyof ReelFormValues>(field: K, value: ReelFormValues[K]) => {
    setValues((current) => ({
      ...current,
      [field]: value,
    }));
    setErrors((current) => {
      if (!(field in current)) return current;
      const next = { ...current };
      delete next[field as string];
      return next;
    });
  };

  const handleSourceTypeChange = (nextType: ReelSourceType) => {
    setValues((current) => ({
      ...current,
      sourceType: nextType,
      sourceId: '',
    }));
    setErrors((current) => {
      const next = { ...current };
      delete next.source_id;
      delete next.source_data_title;
      delete next.source_data_hook;
      return next;
    });
  };

  const handleSceneChange = (
    index: number,
    field: keyof ReelSceneFormValue,
    value: string
  ) => {
    setValues((current) => ({
      ...current,
      scenes: current.scenes.map((scene, sceneIndex) =>
        sceneIndex === index
          ? {
              ...scene,
              [field]: value,
            }
          : scene
      ),
    }));
    setErrors((current) => {
      const next = { ...current };
      delete next[`scene-${index}-${field}`];
      if (field === 'start_second' || field === 'end_second') {
        delete next[`scene-${index}-end_second`];
      }
      return next;
    });
  };

  const handleAddScene = () => {
    setValues((current) => ({
      ...current,
      scenes: [...current.scenes, createEmptyScene(current.scenes.at(-1)?.end_second)],
    }));
  };

  const handleRemoveScene = (index: number) => {
    setValues((current) => ({
      ...current,
      scenes: current.scenes.filter((_, sceneIndex) => sceneIndex !== index),
    }));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    const nextErrors = validateValues(values);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      toast.error('Проверьте поля формы и исправьте ошибки');
      return;
    }

    try {
      if (isEditing && reel) {
        await updateReel.mutateAsync({
          id: reel.id,
          payload: buildUpdatePayload(values, reel),
        });
        toast.success('Рилс обновлён');
        router.push(`/admin/reels/${reel.id}`);
        router.refresh();
        return;
      }

      const duration = Number(values.duration);
      const createPayload: CreateReelPayload =
        values.sourceType === 'generic'
          ? {
              content_type: 'generic',
              duration,
              source_data: {
                title: values.sourceDataTitle.trim(),
                description: values.sourceDataDescription.trim() || undefined,
                hook: values.sourceDataHook.trim(),
              },
            }
          : {
              source_type: values.sourceType,
              source_id: Number(values.sourceId),
              duration,
            };

      const createdReel = await createReel.mutateAsync(createPayload);

      if (needsPostCreateUpdate(values)) {
        await updateReel.mutateAsync({
          id: createdReel.id,
          payload: buildUpdatePayload(values, createdReel),
        });
      }

      toast.success('Рилс создан');
      router.push(`/admin/reels/${createdReel.id}`);
      router.refresh();
    } catch (error) {
      showAxiosErrorToast(error, isEditing ? 'Не удалось сохранить рилс' : 'Не удалось создать рилс');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="flex flex-col gap-4 rounded-[26px] bg-white p-5 shadow-[0_1px_2px_rgba(16,24,40,0.04)] md:flex-row md:items-center md:justify-between md:p-6">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-[#EEF4FF] px-3 py-1 text-xs font-semibold text-[#0B43B8]">
            {isEditing ? 'Редактирование рилса' : 'Новый рилс'}
          </div>
          <h1 className="mt-3 text-[28px] font-extrabold leading-tight text-[#101828]">
            {isEditing ? 'Редактор рилса' : 'Создание рилса'}
          </h1>
          <p className="mt-2 text-sm leading-6 text-[#667085]">
            {isEditing
              ? 'Меняйте поля сценария вручную и сохраняйте через backend API.'
              : 'Соберите заготовку сценария, привяжите её к источнику или создайте полностью вручную.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            href={isEditing && reel ? `/admin/reels/${reel.id}` : '/admin/reels'}
            className="inline-flex items-center gap-2 rounded-xl border border-[#D0D5DD] px-4 py-2.5 text-sm font-medium text-[#344054]"
          >
            <ArrowLeft className="h-4 w-4" />
            {isEditing ? 'К просмотру' : 'К списку'}
          </Link>
          {isEditing && reel ? (
            <Link
              href={`/admin/reels/${reel.id}`}
              className="inline-flex items-center gap-2 rounded-xl bg-[#F8FAFC] px-4 py-2.5 text-sm font-medium text-[#344054]"
            >
              <Eye className="h-4 w-4" />
              Просмотр
            </Link>
          ) : null}
          <Button type="submit" loading={isSubmitting} className="min-w-[180px]">
            {submitLabel}
          </Button>
        </div>
      </div>

      <ReelSourceFields
        sourceType={values.sourceType}
        sourceId={values.sourceId}
        genericFields={{
          title: values.sourceDataTitle,
          description: values.sourceDataDescription,
          hook: values.sourceDataHook,
        }}
        errors={errors}
        disabled={isSubmitting}
        locked={isEditing}
        onSourceTypeChange={handleSourceTypeChange}
        onSourceIdChange={(value) => setField('sourceId', value)}
        onGenericFieldChange={(field, value) => {
          const mappedField =
            field === 'title'
              ? 'sourceDataTitle'
              : field === 'description'
              ? 'sourceDataDescription'
              : 'sourceDataHook';
          setField(mappedField, value);
        }}
      />

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(340px,0.8fr)]">
        <div className="space-y-5">
          <section className="rounded-[24px] bg-white p-5 shadow-[0_1px_2px_rgba(16,24,40,0.04)] md:p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold text-[#101828]">Основные параметры</h2>
                <p className="mt-1 text-sm text-[#667085]">
                  Настройте метаданные рилса и отредактируйте сценарную основу.
                </p>
              </div>
              <div className="rounded-full bg-[#F8FAFC] px-3 py-1 text-xs font-semibold text-[#667085]">
                {sceneCountLabel}
              </div>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <Input
                label="Длительность"
                name="duration"
                type="number"
                value={values.duration}
                onChange={(event) => setField('duration', event.target.value)}
                error={errors.duration}
                disabled={isSubmitting}
              />
              <Input
                label="Секунда постера"
                name="poster_second"
                type="number"
                value={values.posterSecond}
                onChange={(event) => setField('posterSecond', event.target.value)}
                error={errors.posterSecond}
                disabled={isSubmitting}
              />
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <Input
                label="Aspect ratio"
                name="aspect_ratio"
                value={values.aspectRatio}
                onChange={(event) => setField('aspectRatio', event.target.value)}
                disabled={isSubmitting}
                placeholder="9:16"
              />
              <Input
                label="Язык"
                name="language"
                value={values.language}
                onChange={(event) => setField('language', event.target.value)}
                disabled={isSubmitting}
                placeholder="ru"
              />
            </div>

            <div className="mt-4">
              <Select
                label="Tone"
                name="tone"
                value={values.tone}
                onChange={(event) => setField('tone', event.target.value)}
                disabled={isSubmitting}
                options={[
                  { id: 'selling', name: 'selling' },
                  { id: 'informative', name: 'informative' },
                  { id: 'premium', name: 'premium' },
                  { id: 'neutral', name: 'neutral' },
                ]}
              />
            </div>

            <div className="mt-4 grid gap-4">
              <Input
                label="Заголовок"
                name="title"
                value={values.title}
                onChange={(event) => setField('title', event.target.value)}
                disabled={isSubmitting}
                placeholder="Например: 2-комнатная квартира"
              />
              <Input
                label="Описание"
                name="description"
                textarea
                rows={4}
                value={values.description}
                onChange={(event) => setField('description', event.target.value)}
                disabled={isSubmitting}
                placeholder="Короткое, ёмкое описание сценария"
              />
              <Input
                label="Hook"
                name="hook"
                value={values.hook}
                onChange={(event) => setField('hook', event.target.value)}
                disabled={isSubmitting}
                placeholder="Смотрите: 115 000 $ / Сино / Душанбе / 78 м2"
              />
              <Input
                label="CTA"
                name="cta"
                textarea
                rows={3}
                value={values.cta}
                onChange={(event) => setField('cta', event.target.value)}
                disabled={isSubmitting}
                placeholder="Напишите или позвоните, чтобы записаться на просмотр"
              />
            </div>
          </section>

          <ReelScenesEditor
            scenes={values.scenes}
            errors={errors}
            disabled={isSubmitting}
            onAdd={handleAddScene}
            onRemove={handleRemoveScene}
            onChange={handleSceneChange}
          />
        </div>

        <div className="space-y-5">
          <ReelScenarioPreview
            title={values.title}
            description={values.description}
            duration={values.duration}
            posterSecond={values.posterSecond}
            aspectRatio={values.aspectRatio}
            hook={values.hook}
            cta={values.cta}
            scenes={values.scenes}
          />
        </div>
      </div>
    </form>
  );
}
