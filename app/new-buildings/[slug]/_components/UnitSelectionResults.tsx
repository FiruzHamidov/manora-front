'use client';

import ResidentialImage from '@/ui-components/ResidentialImage';

import Link from 'next/link';
import UnitComparisonButton from '@/ui-components/UnitComparisonButton';
import FavoriteButton from '@/ui-components/favorite-button/favorite-button';
import { useState, type ReactNode } from 'react';
import { formatCompletion } from '@/services/new-buildings/completion';
import { UNIT_STATUS_LABELS, formatResidentialDecimal, unitFloorLabel, unitPrice, unitTitle } from '@/services/new-buildings/public-unit';
import type { UnitCard, UnitGrid } from '@/services/new-buildings/unit-selection';

const linkClass = 'rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600';
export function UnitSelectionList({ units, href, context }: { units: UnitCard[]; href: (id: number) => string; context?: (unit: UnitCard) => ReactNode }) {
  return <ul className="space-y-3">
    {units.map(unit => <li key={unit.id}>
      {context?.(unit)}
      <Link href={href(unit.id)} className={linkClass + ' flex flex-col gap-4 border border-slate-200 p-4 hover:border-blue-400 sm:flex-row'}>
        <UnitThumbnail unit={unit} />
        <div className="min-w-0 flex-1 space-y-1">
          <h3 className="font-semibold text-slate-900">{unitTitle(unit)}</h3>
          <p className="text-sm text-slate-600">{unit.number ? '№ ' + unit.number + ' · ' : ''}{unit.block ? 'Корпус ' + unit.block.name : 'Корпус не указан'} · {unit.entrance ? 'Подъезд ' + unit.entrance.name : 'Подъезд не указан'}</p>
          <p className="text-sm text-slate-600">Этаж: {unitFloorLabel(unit)} · Сдача: {formatCompletion(unit.block ?? unit.building ?? {})}</p>
          <p className="font-bold">{unitPrice(unit.effective_total_price, unit.currency)}</p>
          <p className="text-sm text-slate-600">{unit.effective_price_per_sqm === null ? 'Цена за м² не указана' : unitPrice(unit.effective_price_per_sqm, unit.currency) + ' / м²'}</p>
          <p className="text-sm font-medium">{UNIT_STATUS_LABELS[unit.availability_status]}</p>
        </div>
      </Link>
      <div className="flex flex-wrap items-center gap-3 px-2">
        <UnitComparisonButton buildingId={unit.new_building_id} unitId={unit.id} />
        <FavoriteButton propertyId={unit.id} targetType="developer_unit" label="В избранное" className="flex min-h-11 items-center gap-2 rounded-xl border border-green-800 px-3 py-2 text-sm text-green-800" />
      </div>
    </li>)}
  </ul>;
}
function UnitThumbnail({ unit }: { unit: UnitCard }) {
  const [failed, setFailed] = useState(false);
  const plan = unit.plan?.image;
  return <div className="flex h-32 w-full shrink-0 items-center justify-center rounded-lg bg-slate-50 sm:w-36">
    {plan && !failed
      // eslint-disable-next-line @next/next/no-img-element
      ? <ResidentialImage image={plan} sizes="(max-width: 767px) 100vw, 280px" alt={plan.alt || 'Планировка квартиры'} width={plan.width} height={plan.height} loading="lazy" className="h-full w-full object-contain" onError={() => setFailed(true)} />
      : <span className="px-2 text-center text-sm text-slate-500">{failed ? 'План временно недоступен' : 'План не загружен'}</span>}
  </div>;
}
export function UnitSelectionGrid({ grid, href, onPage }: { grid: UnitGrid; href: (id: number) => string; onPage: (key: string, value: string) => void }) {
  const [zoom, setZoom] = useState(100);
  const geometry = grid.geometry;
  if (!geometry) return <p className="rounded-lg bg-slate-50 p-4">Выберите подъезд в фильтрах, чтобы открыть шахматку. Квартиры без подъезда доступны в списке.</p>;
  const cells = new Map(grid.cells.map(cell => [cell.floor + ':' + cell.position_on_floor, cell]));
  const emptyPlaces = new Set((geometry.spaces ?? []).map(space => space.floor + ':' + space.position));
  const pageControls = (label: string, key: string, page: number, total: number) => <div className="flex flex-wrap items-center gap-2">
    <span>{label}: {page} / {total}</span>
    <button type="button" className="rounded border px-3 py-2 disabled:opacity-40" disabled={page <= 1} onClick={() => onPage(key, String(page - 1))} aria-label={label + ': предыдущая часть'}>←</button>
    <button type="button" className="rounded border px-3 py-2 disabled:opacity-40" disabled={page >= total} onClick={() => onPage(key, String(page + 1))} aria-label={label + ': следующая часть'}>→</button>
  </div>;
  return <div className="min-w-0 space-y-3">
    <div className="flex flex-wrap gap-3 text-sm" aria-label="Легенда шахматки">
      <span className="rounded border border-green-700 bg-green-50 px-2 py-1">Свободна</span>
      <span className="rounded border border-amber-700 bg-amber-50 px-2 py-1">Забронирована</span>
      <span className="rounded border border-slate-400 bg-slate-100 px-2 py-1">Продана</span>
      <span className="rounded border border-slate-300 bg-white px-2 py-1">Пустое место</span>
      <span className="rounded border border-slate-500 bg-slate-200 px-2 py-1">Технический этаж</span>
      <span className="rounded border border-dashed px-2 py-1">Нет публичных данных</span>
    </div>
    <p className="text-sm text-slate-600">Совпадений в этом участке: {grid.meta.visible_matched_count ?? 0}. Несовпавшие квартиры приглушены; пустая ячейка не означает продажу.</p>
    {(!geometry.complete || grid.meta.unplaced_matching_count > 0) && <p className="rounded-lg bg-amber-50 p-3 text-sm">
      Данные схемы неполные.{grid.meta.unplaced_matching_count > 0 ? ' Без размещения на схеме: ' + grid.meta.unplaced_matching_count + '. Откройте список, чтобы увидеть эти квартиры.' : ' Показаны только известные этажи и позиции.'}
    </p>}
    <label className="flex flex-wrap items-center gap-2 text-sm">Масштаб
      <select className="rounded border px-3 py-2" value={zoom} onChange={e => setZoom(Number(e.target.value))}>
        {[75, 100, 125, 150, 200].map(v => <option key={v} value={v}>{v}%</option>)}
      </select>
    </label>
    <div className="max-w-full overflow-auto rounded-lg border p-2 focus-visible:outline-2 focus-visible:outline-blue-600" tabIndex={0} role="region" aria-label="Шахматка квартир, прокручиваемая область">
      <table className="border-separate border-spacing-2 text-sm" style={{ fontSize: 14 * zoom / 100 }}>
        <caption className="pb-2 text-left">Корпус {geometry.block.name}, подъезд {geometry.entrance.name}</caption>
        <thead><tr><th scope="col" className="sticky left-0 z-20 bg-white px-2 text-left">Этаж</th>{geometry.positions.map(position => <th key={position} scope="col" className="font-normal">Позиция {position}</th>)}</tr></thead>
        <tbody>{geometry.floors.map(row => <tr key={row.floor}>
          <th scope="row" className="sticky left-0 z-10 min-w-20 bg-white px-2 text-left align-middle">
            {row.floor}
            {!['residential', 'technical_floor'].includes(row.kind) && <span className="block text-xs font-normal">{row.kind === 'outside_residential' ? 'Вне жилого диапазона' : 'Назначение не указано'}</span>}
          </th>
          {row.kind === 'technical_floor' ? <td colSpan={Math.max(1, geometry.positions.length)} className="rounded border border-slate-500 bg-slate-200 p-3 text-left">
            <span className="sticky left-24 inline-block w-32">Технический этаж · квартир нет</span>
          </td> : geometry.positions.map(position => {
            const cell = cells.get(row.floor + ':' + position);
            const empty = emptyPlaces.has(row.floor + ':' + position);
            return <td key={position} className="align-top">
              {cell ? <Link href={href(cell.id)} className={linkClass + ' block border p-2 ' + (cell.matches ? '' : 'opacity-50 ') +
                (cell.availability_status === 'available' ? 'border-green-700 bg-green-50' : cell.availability_status === 'reserved' ? 'border-amber-700 bg-amber-50' : 'border-slate-400 bg-slate-100')}
                style={{ width: 135 * zoom / 100, minHeight: 115 * zoom / 100, overflowWrap: 'anywhere' }}
                title={unitTitle(cell) + ' · ' + unitPrice(cell.effective_total_price, cell.currency) + ' · ' + UNIT_STATUS_LABELS[cell.availability_status]}>
                <span className="block font-semibold">{cell.number ? '№ ' + cell.number : 'Квартира ' + cell.id}</span>
                <span className="block">{cell.rooms === null ? 'Комнаты не указаны' : cell.rooms === 0 ? 'Студия' : cell.rooms + '-комн.'}</span>
                <span className="block">{cell.area === null ? 'Площадь не указана' : formatResidentialDecimal(cell.area) + ' м²'}</span>
                <span className="block">{unitPrice(cell.effective_total_price, cell.currency)}</span>
                <span className="block font-medium">{UNIT_STATUS_LABELS[cell.availability_status]}</span>
                {!cell.matches && <span className="block text-xs">Не совпадает с фильтрами</span>}
              </Link> : <div className={'flex items-center justify-center rounded border p-2 text-center text-slate-500 ' + (empty ? 'border-slate-300 bg-white' : 'border-dashed bg-slate-50')}
                style={{ width: 135 * zoom / 100, minHeight: 115 * zoom / 100 }} aria-label={'Этаж ' + row.floor + ', позиция ' + position + (empty ? ': пустое место, квартиры нет' : ': нет публичных данных')}>
                {empty ? 'Пустое место · квартиры нет' : 'Нет публичных данных'}
              </div>}
            </td>;
          })}
        </tr>)}</tbody>
      </table>
      {!geometry.floors.length && <p className="p-3">Нет данных для построения схемы. Откройте список квартир.</p>}
    </div>
    <div className="flex flex-wrap gap-4 text-sm">
      {pageControls('Участки этажей', 'grid_floor_page', geometry.floor_page, geometry.floor_pages)}
      {pageControls('Участки позиций', 'grid_position_page', geometry.position_page, geometry.position_pages)}
    </div>
  </div>;
}
