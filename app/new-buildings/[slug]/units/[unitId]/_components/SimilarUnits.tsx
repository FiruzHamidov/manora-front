'use client';

import { measureResidential } from '@/services/new-buildings/track';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { API_BASE_URL } from '@/config/api';
import { fetchSimilarUnits } from '@/services/new-buildings/public-unit-api';
import { formatResidentialDecimal, type PublicUnit } from '@/services/new-buildings/public-unit';
import type { SimilarStage } from '@/services/new-buildings/similar-units';
import { UnitSelectionList } from '../../../_components/UnitSelectionResults';

const missingLabels = { rooms: 'комнатность', area: 'площадь', price: 'бюджет', city: 'город' };
function stageLabel(stage: SimilarStage): string {
  const range = (values: [string, string]) => values.map(value => formatResidentialDecimal(value)).join('–');
  return (stage.scope === 'building' ? 'Тот же ЖК' : 'Другие ЖК этого города')
    + (stage.area_range ? ' · площадь ' + range(stage.area_range) + ' м² (±' + stage.area_percent + '%)' : '')
    + (stage.price_range ? ' · бюджет ' + range(stage.price_range) + ' TJS (±' + stage.price_percent + '%)' : '');
}
export default function SimilarUnits({ unit, unavailable }: { unit: PublicUnit; unavailable: boolean }) {
  const query = useQuery({ queryKey: ['similar-units', unit.new_building_id, unit.id, unit.version], enabled: !unavailable,
    queryFn: ({ signal }) => measureResidential({ surface: 'unit', building_id: unit.new_building_id, unit_id: unit.id, endpoint: 'similar' }, () => fetchSimilarUnits(API_BASE_URL, String(unit.new_building_id), String(unit.id), signal), signal),
    refetchInterval: 30_000, refetchOnWindowFocus: 'always', retry: false });
  const data = query.data;
  return <section id="similar-units" aria-labelledby="similar-heading" className="min-w-0 scroll-mt-28 space-y-4 rounded-2xl border bg-white p-4 md:p-6">
    <h2 id="similar-heading" className="text-xl font-semibold">Похожие свободные квартиры</h2>
    <p className="text-sm text-gray-600">Сначала тот же ЖК, затем другие ЖК того же города. Комнатность совпадает, если она известна.
      Площадь и бюджет учитываются вместе: сначала ±10% и ±15%, затем ±25% и ±30%. Внутри шага выше квартиры с меньшим суммарным относительным отклонением. Бронь и проданные исключены.</p>
    <button type="button" className="min-h-11 rounded-xl border border-green-800 px-3 py-2 text-green-800 disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-green-800"
      disabled={unavailable || query.isFetching} onClick={() => void query.refetch()}>Обновить похожие квартиры</button>
    {unavailable ? <p role="status">Сначала обновите исходную квартиру. Подбор по неподтверждённым данным скрыт.</p>
      : query.isPending ? <p role="status">Подбираем свободные квартиры…</p>
      : query.isError ? <p role="alert">Не удалось обновить похожие квартиры. Повторите загрузку; форма обращения доступна.</p>
      : data && <>
        {data.meta.missing_criteria.length > 0 && <p className="text-sm text-amber-800">Неизвестны: {data.meta.missing_criteria.map(key => missingLabels[key]).join(', ')}. Соответствующие критерии не использованы; без города поиск ограничен этим ЖК.</p>}
        <details className="text-sm"><summary className="cursor-pointer py-2">Применённые шаги подбора</summary>
          <ol className="list-decimal space-y-2 pl-5">{data.meta.stages.map(stage => <li key={stage.key}>{stageLabel(stage)}. Показано: {stage.shown_count}.</li>)}</ol>
        </details>
        {!data.data.length ? <p>{data.meta.insufficient_data ? 'Для подбора недостаточно данных исходной квартиры: не указаны комнатность, площадь и цена.' : 'Свободных квартир в этих диапазонах не найдено. Можно изменить условия в общем подборе.'}</p>
          : <UnitSelectionList units={data.data}
              href={id => { const row = data.data.find(item => item.id === id)!; return '/new-buildings/' + row.new_building_id + '/units/' + row.id; }}
              context={item => {
                const row = data.data.find(value => value.id === item.id)!;
                const stage = data.meta.stages.find(value => value.key === row.similarity_stage);
                return <div className="mb-2 space-y-1 text-sm"><Link href={'/new-buildings/' + row.new_building_id} className="text-green-800 underline">{row.building.title}</Link>
                  {stage && <p className="text-gray-600">{stageLabel(stage)}</p>}</div>;
              }} />}
        <p className="text-xs text-gray-600">Подбор обновлён: {new Date(data.meta.as_of).toLocaleTimeString('ru-RU')}. Наличие проверяется повторно при обращении.</p>
      </>}
    <Link href={'/new-buildings/' + unit.new_building_id + '#apartments'} className="inline-flex min-h-11 items-center text-green-800 underline">Все квартиры этого ЖК</Link>
  </section>;
}
