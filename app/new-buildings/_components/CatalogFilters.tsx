'use client';

import { useId, useState } from 'react';
import { changeCatalog, type CatalogFacets, type CatalogFilters as Filters } from '@/services/new-buildings/residential-catalog';

const fieldClass = 'mt-1 min-h-11 w-full min-w-0 rounded-xl border border-gray-300 bg-white px-3 py-2 text-base focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#006341]';
export function CatalogFilters({ value, options, errors, onApply, onReset }: {
  value: Filters; options?: CatalogFacets['data']; errors: Record<string, string[]>;
  onApply: (value: Filters) => void; onReset: () => void;
}) {
  const [draft, setDraft] = useState(value);
  const id = useId();
  const edit = (key: string, next: string) => setDraft(current => changeCatalog(current, key, next));
  const error = (key: string) => Object.entries(errors).filter(([name]) => name === key || name.startsWith(key + '.')).flatMap(([, messages]) => messages).join(' ');
  const input = (key: string, label: string, numeric = false) => <label className="min-w-0 text-sm font-medium" key={key}>
    {label}<input className={fieldClass} name={key} aria-label={label} value={draft[key] ?? ''} onChange={event => edit(key, event.target.value)}
      inputMode={numeric ? 'decimal' : 'text'} maxLength={numeric ? 20 : 150} aria-invalid={!!error(key)} aria-describedby={error(key) ? id + key : undefined} />
    {error(key) && <span id={id + key} className="mt-1 block text-red-700">{error(key)}</span>}
  </label>;
  const select = (key: string, label: string, choices: { value: string; label: string }[]) => <label className="min-w-0 text-sm font-medium" key={key}>
    {label}<select className={fieldClass} name={key} aria-label={label} value={draft[key] ?? ''} onChange={event => edit(key, event.target.value)}
      aria-invalid={!!error(key)} aria-describedby={error(key) ? id + key : undefined}>
      <option value="">Все</option>
      {draft[key] && !choices.some(choice => choice.value === draft[key]) && <option value={draft[key]}>{draft[key]} — выбранное значение</option>}
      {choices.map(choice => <option key={choice.value} value={choice.value}>{choice.label}</option>)}
    </select>
    {error(key) && <span id={id + key} className="mt-1 block text-red-700">{error(key)}</span>}
  </label>;
  const districts = [...new Set(options?.districts.filter(district => !draft.city || district.city === draft.city).map(district => district.name) ?? [])];
  const named = (items?: { id: number; name: string }[]) => items?.map(item => ({ value: String(item.id), label: item.name })) ?? [];
  const rooms = (draft.rooms ?? '').split(',').filter(Boolean);
  return <form aria-label="Фильтры жилых комплексов" className="rounded-3xl border border-gray-200 bg-white p-4 md:p-6"
    onSubmit={event => { event.preventDefault(); const next = { ...draft }; delete next.page; onApply(next); }}>
    <div className="grid min-w-0 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <div className="sm:col-span-2">{input('search', 'Название ЖК или адрес')}</div>
      {select('city', 'Город', options?.cities.map(city => ({ value: city, label: city })) ?? [])}
      {select('district', 'Район', districts.map(district => ({ value: district, label: district })))}
      {select('developer_id', 'Застройщик', named(options?.developers))}
      {select('stage_id', 'Стадия строительства', named(options?.stages))}
      {input('completion_year_min', 'Сдача: год от', true)}
      {input('completion_year_max', 'Сдача: год до', true)}
      {input('price_min', 'Бюджет от, TJS', true)}
      {input('price_max', 'Бюджет до, TJS', true)}
      {input('area_min', 'Площадь от, м²', true)}
      {input('area_max', 'Площадь до, м²', true)}
    </div>
    <div className="mt-4 flex flex-wrap items-center gap-x-8 gap-y-4">
      <fieldset className="min-w-0">
        <legend className="mb-2 text-sm font-medium">Комнаты</legend>
        <div className="flex flex-wrap gap-2">{[['0', 'Студия'], ['1', '1'], ['2', '2'], ['3', '3'], ['4+', '4+']].map(([room, label]) =>
          <label key={room} className="flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border border-gray-300 px-3 has-checked:border-[#006341] has-checked:bg-green-50">
            <input type="checkbox" value={room} checked={rooms.includes(room)} onChange={() => edit('rooms', (rooms.includes(room) ? rooms.filter(value => value !== room) : [...rooms, room]).join(','))} />
            {label}
          </label>)}</div>
        {error('rooms') && <p className="mt-1 text-sm text-red-700">{error('rooms')}</p>}
      </fieldset>
      <label className="flex min-h-11 items-center gap-2"><input type="checkbox" checked={draft.installment_available === '1'} onChange={event => edit('installment_available', event.target.checked ? '1' : '')} />Есть рассрочка</label>
    </div>
    <details className="mt-4">
      <summary className="min-h-11 cursor-pointer py-3 font-medium">Дополнительные фильтры</summary>
      <div className="max-w-sm">{select('material_id', 'Материал стен', named(options?.materials))}</div>
    </details>
    <div className="mt-4 flex flex-wrap gap-3">
      <button type="submit" className="min-h-11 rounded-xl bg-[#006341] px-5 py-3 font-semibold text-white">Показать ЖК</button>
      <button type="button" onClick={onReset} className="min-h-11 rounded-xl border border-gray-300 px-5 py-3">Сбросить фильтры</button>
    </div>
  </form>;
}
