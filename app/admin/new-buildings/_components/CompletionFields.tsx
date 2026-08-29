'use client';

import { ChangeEvent, useId } from 'react';
import type { CompletionValue } from '@/services/new-buildings/completion';

export function CompletionFields({ values, onChange, errors = {} }: {
  values: CompletionValue;
  onChange: (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  errors?: Record<string, string>;
}) {
  const id = useId();
  const precision = values.completion_precision ?? 'unknown';
  const fieldClass = 'mt-2 w-full rounded-lg border border-gray-300 bg-white p-3';
  return <fieldset className="space-y-3">
    <legend className="text-sm font-medium">Срок сдачи</legend>
    <label htmlFor={`${id}-precision`} className="block text-sm">Точность срока
      <select id={`${id}-precision`} name="completion_precision" value={precision} onChange={onChange} className={fieldClass}>
        <option value="unknown">Неизвестно</option><option value="year">Год</option><option value="quarter">Квартал</option><option value="date">Точная дата</option>
      </select>
    </label>
    {precision === 'date' && <label className="block text-sm">Дата сдачи<input name="completion_at" type="date" value={values.completion_at?.slice(0, 10) ?? ''} onChange={onChange} className={fieldClass} /></label>}
    {['year', 'quarter'].includes(precision) && <label className="block text-sm">Год сдачи<input name="completion_year" type="number" min={1900} max={2200} value={values.completion_year ?? ''} onChange={onChange} className={fieldClass} /></label>}
    {precision === 'quarter' && <label className="block text-sm">Квартал<select name="completion_quarter" value={values.completion_quarter ?? ''} onChange={onChange} className={fieldClass}>
      <option value="">Выберите квартал</option>{[1, 2, 3, 4].map((quarter) => <option key={quarter} value={quarter}>{quarter} квартал</option>)}
    </select></label>}
    {['completion_at', 'completion_year', 'completion_quarter', 'completion_precision'].map((field) => errors[field] && <p key={field} role="alert" className="text-sm text-red-700">{errors[field]}</p>)}
  </fieldset>;
}
