'use client';

import Link from 'next/link';
import { Map, Placemark, YMaps } from '@pbe/react-yandex-maps';
import { BRANCHES, BRANCHES_CENTER } from '@/app/branches/data';

export default function BranchesPreview() {
  return (
    <section className="mt-10 md:mt-14 rounded-[22px] border border-slate-200 bg-white p-4 sm:p-6">
      <div className="mb-4 sm:mb-5 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-[#0f172a]">Филиалы</h2>
          <p className="mt-1 text-sm sm:text-base text-slate-600">
            Наши офисы в Душанбе
          </p>
        </div>
        <Link
          href="/branches"
          className="inline-flex items-center rounded-full bg-[#0036A5] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0A62FF] transition-colors"
        >
          Посмотреть
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[320px_minmax(0,1fr)] gap-4">
        <div className="space-y-3">
          {BRANCHES.map((branch) => (
            <article key={branch.id} className="relative rounded-xl border border-slate-200 p-4">
              {branch.isNew && (
                <span className="absolute -top-2 -right-2 rounded-md bg-[#0036A5] px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
                  Новый офис
                </span>
              )}
              <div className="text-sm text-slate-500">{branch.name}</div>
              <div className="mt-1 font-semibold text-slate-900">{branch.address}</div>
            </article>
          ))}
        </div>

        <div className="overflow-hidden rounded-xl border border-slate-200">
          <YMaps query={{ apikey: process.env.NEXT_PUBLIC_YANDEX_MAPS_API_KEY }}>
            <Map
              defaultState={{ center: BRANCHES_CENTER, zoom: 12 }}
              width="100%"
              height="340px"
              options={{ suppressMapOpenBlock: true }}
            >
              {BRANCHES.map((branch) => (
                <Placemark
                  key={branch.id}
                  geometry={branch.coords}
                  options={{ preset: branch.isNew ? 'islands#darkBlueDotIcon' : 'islands#blueDotIcon' }}
                  properties={{
                    hintContent: branch.address,
                    balloonContentHeader: branch.name,
                    balloonContentBody: `${branch.address}${branch.isNew ? ' (Новый офис)' : ''}`,
                  }}
                />
              ))}
            </Map>
          </YMaps>
        </div>
      </div>
    </section>
  );
}

