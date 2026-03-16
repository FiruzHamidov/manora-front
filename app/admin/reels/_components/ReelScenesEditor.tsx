'use client';

import { Plus, Trash2 } from 'lucide-react';
import { Input } from '@/ui-components/Input';

export type ReelSceneFormValue = {
  start_second: string;
  end_second: string;
  visual: string;
  voiceover: string;
  onscreen_text: string;
};

type ReelScenesEditorProps = {
  scenes: ReelSceneFormValue[];
  errors?: Record<string, string>;
  disabled?: boolean;
  onAdd: () => void;
  onRemove: (index: number) => void;
  onChange: (
    index: number,
    field: keyof ReelSceneFormValue,
    value: string
  ) => void;
};

export function ReelScenesEditor({
  scenes,
  errors,
  disabled = false,
  onAdd,
  onRemove,
  onChange,
}: ReelScenesEditorProps) {
  return (
    <section className="rounded-[24px] bg-white p-5 shadow-[0_1px_2px_rgba(16,24,40,0.04)] md:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-[#101828]">Сцены</h2>
          <p className="mt-1 text-sm text-[#667085]">
            Добавляйте сцены, задавайте тайминг и наполняйте сценарий голосом, визуалом и текстом на экране.
          </p>
        </div>
        <button
          type="button"
          onClick={onAdd}
          disabled={disabled}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#0036A5] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
        >
          <Plus className="h-4 w-4" />
          Добавить сцену
        </button>
      </div>

      <div className="mt-5 space-y-4">
        {scenes.length === 0 ? (
          <div className="rounded-[20px] border border-dashed border-[#D0D5DD] px-4 py-8 text-center text-sm text-[#667085]">
            Пока нет сцен. Добавьте первую сцену, чтобы собрать структуру рилса.
          </div>
        ) : null}

        {scenes.map((scene, index) => (
          <div
            key={`scene-${index}`}
            className="rounded-[22px] border border-[#EAECF0] bg-[#FCFCFD] p-4 md:p-5"
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-[#101828]">
                  Сцена {index + 1}
                </div>
                <div className="mt-1 text-xs text-[#667085]">
                  Настройте хронометраж и сценарные блоки для этого фрагмента.
                </div>
              </div>
              <button
                type="button"
                onClick={() => onRemove(index)}
                disabled={disabled}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#F3D0CD] text-[#D92D20] disabled:opacity-60"
                aria-label={`Удалить сцену ${index + 1}`}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <Input
                label="Секунда старта"
                name={`scene-${index}-start_second`}
                type="number"
                value={scene.start_second}
                onChange={(event) => onChange(index, 'start_second', event.target.value)}
                disabled={disabled}
                error={errors?.[`scene-${index}-start_second`]}
              />
              <Input
                label="Секунда окончания"
                name={`scene-${index}-end_second`}
                type="number"
                value={scene.end_second}
                onChange={(event) => onChange(index, 'end_second', event.target.value)}
                disabled={disabled}
                error={errors?.[`scene-${index}-end_second`]}
              />
            </div>

            <div className="mt-4 grid gap-4">
              <Input
                label="Визуал"
                name={`scene-${index}-visual`}
                textarea
                rows={3}
                value={scene.visual}
                onChange={(event) => onChange(index, 'visual', event.target.value)}
                disabled={disabled}
                error={errors?.[`scene-${index}-visual`]}
              />
              <Input
                label="Текст озвучки"
                name={`scene-${index}-voiceover`}
                textarea
                rows={3}
                value={scene.voiceover}
                onChange={(event) => onChange(index, 'voiceover', event.target.value)}
                disabled={disabled}
                error={errors?.[`scene-${index}-voiceover`]}
              />
              <Input
                label="Текст на экране"
                name={`scene-${index}-onscreen_text`}
                textarea
                rows={3}
                value={scene.onscreen_text}
                onChange={(event) => onChange(index, 'onscreen_text', event.target.value)}
                disabled={disabled}
                error={errors?.[`scene-${index}-onscreen_text`]}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
