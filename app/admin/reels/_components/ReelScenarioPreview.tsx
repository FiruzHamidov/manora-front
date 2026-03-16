'use client';

import type { ReelSceneFormValue } from '@/app/admin/reels/_components/ReelScenesEditor';

type ReelScenarioPreviewProps = {
  title: string;
  description: string;
  duration: string;
  posterSecond: string;
  aspectRatio: string;
  hook: string;
  cta: string;
  scenes: ReelSceneFormValue[];
};

function PreviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-[#F8FAFC] px-4 py-3">
      <div className="text-xs font-semibold uppercase tracking-[0.08em] text-[#98A2B3]">
        {label}
      </div>
      <div className="mt-2 whitespace-pre-line text-sm leading-6 text-[#101828]">
        {value || 'Не заполнено'}
      </div>
    </div>
  );
}

export function ReelScenarioPreview({
  title,
  description,
  duration,
  posterSecond,
  aspectRatio,
  hook,
  cta,
  scenes,
}: ReelScenarioPreviewProps) {
  return (
    <section className="rounded-[24px] bg-white p-5 shadow-[0_1px_2px_rgba(16,24,40,0.04)] md:p-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-[#101828]">Предпросмотр структуры</h2>
          <p className="mt-1 text-sm text-[#667085]">
            Сценарий показывается в том виде, как его увидит редактор рилса после сохранения.
          </p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full bg-[#EEF4FF] px-3 py-1 text-xs font-semibold text-[#0B43B8]">
          Вертикальный формат {aspectRatio || '9:16'}
        </div>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <PreviewRow label="Заголовок" value={title} />
        <PreviewRow label="Хук" value={hook} />
        <PreviewRow label="Описание" value={description} />
        <PreviewRow
          label="Параметры"
          value={`Длительность: ${duration || '—'} сек\nПостер: ${posterSecond || '—'} сек\nФормат: ${aspectRatio || '9:16'}`}
        />
      </div>

      <div className="mt-5">
        <div className="text-xs font-semibold uppercase tracking-[0.08em] text-[#98A2B3]">
          Сцены
        </div>
        <div className="mt-3 space-y-3">
          {scenes.length === 0 ? (
            <div className="rounded-[20px] border border-dashed border-[#D0D5DD] px-4 py-6 text-sm text-[#667085]">
              Сцены ещё не добавлены.
            </div>
          ) : (
            scenes.map((scene, index) => (
              <div key={`preview-scene-${index}`} className="rounded-[20px] border border-[#EAECF0] p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-[#EEF4FF] px-2.5 py-1 text-xs font-semibold text-[#0B43B8]">
                    Сцена {index + 1}
                  </span>
                  <span className="text-xs text-[#667085]">
                    {scene.start_second || '—'}s - {scene.end_second || '—'}s
                  </span>
                </div>
                <div className="mt-3 grid gap-3 md:grid-cols-3">
                  <PreviewRow label="Визуал" value={scene.visual} />
                  <PreviewRow label="Озвучка" value={scene.voiceover} />
                  <PreviewRow label="Текст на экране" value={scene.onscreen_text} />
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="mt-5">
        <PreviewRow label="CTA" value={cta} />
      </div>
    </section>
  );
}
