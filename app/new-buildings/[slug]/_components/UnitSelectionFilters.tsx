'use client';

import { changeSelection, selectionValues, toggleSelectionValue } from '@/services/new-buildings/unit-selection';
import type { UnitFacets } from '@/services/new-buildings/unit-selection';
import type { UnitFilters } from '@/services/new-buildings/public-unit';

const inputClass = 'min-w-0 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-blue-600';
export function UnitSelectionFilters({ value, onChange, facets, prefix, errors = {} }: {
  value: UnitFilters; onChange: (filters: UnitFilters) => void; facets?: UnitFacets; prefix: string; errors?: Record<string, string[]>;
}) {
  const update = (key: string, next: string) => onChange(changeSelection(value, key, next));
  const blocks = facets?.blocks ?? [];
  const entrances = blocks.filter(b => !value.block_id || String(b.id) === value.block_id).flatMap(b => b.entrances.map(e => ({ ...e, label: b.name + ' · ' + e.name })));
  const hasFirstFloor = entrances.some(e => e.residential_floor_from !== null) || Boolean(value.not_first);
  const hasLastFloor = entrances.some(e => e.residential_floor_to !== null) || Boolean(value.not_last || value.only_last);
  const range = (label: string, key: string, integer = false) => (
    <fieldset className="min-w-0">
      <legend className="mb-1 text-sm font-medium">{label}</legend>
      <div className="flex gap-2">
        {(['min', 'max'] as const).map(side => {
          const name = key + '_' + side, id = prefix + '-' + name;
          return <div key={side} className="min-w-0 flex-1">
            <label htmlFor={id} className="sr-only">{label} {side === 'min' ? 'от' : 'до'}</label>
            <input id={id} className={inputClass} inputMode={integer ? 'numeric' : 'decimal'} maxLength={16}
              value={value[name] ?? ''} placeholder={side === 'min' ? 'От' : 'До'}
              aria-invalid={Boolean(errors[name])} aria-describedby={errors[name] ? id + '-error' : undefined}
              onChange={event => update(name, event.target.value)} />
            {errors[name] && <p id={id + '-error'} className="mt-1 text-xs text-red-700">{errors[name].join(' ')}</p>}
          </div>;
        })}
      </div>
    </fieldset>
  );
  const check = (key: string, label: string) => <label className="flex items-start gap-2 text-sm" key={key}>
    <input type="checkbox" className="mt-1 h-4 w-4 shrink-0 accent-blue-600" checked={value[key] === '1'} onChange={e => update(key, e.target.checked ? '1' : '')} />
    {label}
  </label>;
  const multiple = (field: 'finishing' | 'window_view', label: string) => {
    const selected = selectionValues(value, field);
    const options = [...new Set([...(facets?.options[field] ?? []).map(o => o.value), ...selected])];
    if (!options.length) return null;
    return <fieldset className="min-w-0">
      <legend className="mb-2 text-sm font-medium">{label}</legend>
      <div className="flex flex-wrap gap-x-4 gap-y-2">
        {options.map(option => <label key={option} className="flex max-w-full items-start gap-2 text-sm break-words">
          <input type="checkbox" className="mt-1 h-4 w-4 shrink-0 accent-blue-600" checked={selected.includes(option)}
            onChange={() => onChange(toggleSelectionValue(value, field, option))} />{option}
        </label>)}
      </div>
    </fieldset>;
  };
  return <div className="space-y-4">
    <div className="grid min-w-0 gap-4 sm:grid-cols-2">
      <label className="min-w-0 text-sm font-medium">Корпус
        <select className={inputClass + ' mt-1'} value={value.block_id ?? ''} onChange={e => update('block_id', e.target.value)}>
          <option value="">Все корпуса</option>
          {value.block_id && !blocks.some(b => String(b.id) === value.block_id) && <option value={value.block_id}>Недоступный корпус</option>}
          {blocks.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
      </label>
      <label className="min-w-0 text-sm font-medium">Подъезд
        <select className={inputClass + ' mt-1'} value={value.entrance_id ?? ''} onChange={e => update('entrance_id', e.target.value)}>
          <option value="">Все подъезды</option>
          {value.entrance_id && !entrances.some(e => String(e.id) === value.entrance_id) && <option value={value.entrance_id}>Недоступный подъезд</option>}
          {entrances.map(e => <option key={e.id} value={e.id}>{e.label}</option>)}
        </select>
      </label>
    </div>
    <fieldset>
      <legend className="mb-2 text-sm font-medium">Комнаты</legend>
      <div className="flex flex-wrap gap-2">
        {['0', '1', '2', '3', '4+'].map(room => {
          const rooms = value.rooms?.split(',') ?? [], checked = rooms.includes(room);
          return <button type="button" key={room} aria-pressed={checked}
            className={'min-h-10 rounded-lg border px-3 text-sm focus-visible:outline-2 focus-visible:outline-blue-600 ' + (checked ? 'border-blue-600 bg-blue-50 text-blue-800' : 'border-slate-300')}
            onClick={() => update('rooms', (checked ? rooms.filter(v => v !== room) : [...rooms, room]).join(','))}>
            {room === '0' ? 'Студия' : room}
          </button>;
        })}
      </div>
    </fieldset>
    <div className="grid min-w-0 gap-4 sm:grid-cols-2">{range('Цена, TJS', 'price')}{range('Площадь, м²', 'area')}</div>
    {check('include_reserved', 'Показывать забронированные')}
    <details>
      <summary className="cursor-pointer py-2 text-sm font-medium text-blue-700">Дополнительные фильтры</summary>
      <div className="space-y-4 pt-2">
        <div className="grid gap-4 sm:grid-cols-2">
          {(facets?.meta.floor_min != null || value.floor_min || value.floor_max) && range('Этаж', 'floor', true)}
          {(facets?.meta.kitchen_area_min != null || value.kitchen_area_min || value.kitchen_area_max) && range('Кухня, м²', 'kitchen_area')}
        </div>
        <div className="flex flex-wrap gap-4">
          {hasFirstFloor && check('not_first', 'Не первый жилой этаж')}{hasLastFloor && <>{check('not_last', 'Не последний')}{check('only_last', 'Только последний')}</>}
        </div>
        {(hasFirstFloor || hasLastFloor) && <p className="text-xs text-slate-500">Первый и последний — по жилому диапазону подъезда. Квартиры без этих данных не совпадут с условием.</p>}
        {multiple('finishing', 'Отделка')}{multiple('window_view', 'Вид из окна')}
      </div>
    </details>
  </div>;
}
