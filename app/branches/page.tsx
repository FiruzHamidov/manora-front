'use client';

import { useCallback, useMemo, useState } from 'react';
import Link from 'next/link';
import { Map, Placemark, YMaps, ZoomControl } from '@pbe/react-yandex-maps';
import type * as ymaps from 'yandex-maps';
import { BRANCHES, BRANCHES_CENTER, type BranchPoint } from './data';

export default function BranchesPage() {
  const [selectedBranchId, setSelectedBranchId] = useState<number>(BRANCHES[0].id);
  const [mapInstance, setMapInstance] = useState<ymaps.Map | null>(null);

  const selectedBranch = useMemo(
    () => BRANCHES.find((b) => b.id === selectedBranchId) ?? BRANCHES[0],
    [selectedBranchId]
  );

  const focusBranch = useCallback(
    (branch: BranchPoint) => {
      setSelectedBranchId(branch.id);
      if (!mapInstance) return;
      mapInstance.setCenter(branch.coords, 15, { duration: 350 });
    },
    [mapInstance]
  );

  return (
    <main className="mx-auto max-w-[1520px] px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <div className="mb-4 sm:mb-6 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0f172a]">Наши филиалы</h1>
          <p className="mt-1 text-sm sm:text-base text-slate-600">
            Два офиса Manora на карте
          </p>
        </div>
        <Link
          href="/"
          className="shrink-0 inline-flex items-center rounded-full border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          На главную
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[340px_minmax(0,1fr)] gap-4 sm:gap-6">
        <section className="space-y-3">
          {BRANCHES.map((branch) => (
            <button
              key={branch.id}
              type="button"
              onClick={() => focusBranch(branch)}
              className={`relative w-full text-left rounded-2xl border bg-white p-4 shadow-sm transition-all cursor-pointer ${
                selectedBranchId === branch.id
                  ? 'border-[#0036A5] ring-2 ring-[#0036A5]/25'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              {branch.isNew && (
                <div className="absolute -top-2 -right-2 rotate-6 rounded-md bg-[#0036A5] px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-white shadow">
                  Новый офис
                </div>
              )}
              <div className="text-sm text-slate-500">{branch.name}</div>
              <div className="mt-1 text-base font-semibold text-slate-900">{branch.address}</div>
            </button>
          ))}
        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <YMaps query={{ apikey: process.env.NEXT_PUBLIC_YANDEX_MAPS_API_KEY }}>
            <Map
              defaultState={{ center: BRANCHES_CENTER, zoom: 13 }}
              width="100%"
              height="560px"
              instanceRef={setMapInstance}
              modules={['control.ZoomControl']}
              options={{ suppressMapOpenBlock: true }}
            >
              <ZoomControl options={{ position: { right: 12, top: 12 } }} />
              {BRANCHES.map((branch) => (
                <Placemark
                  key={branch.id}
                  geometry={branch.coords}
                  options={{
                    preset:
                      selectedBranch.id === branch.id
                        ? 'islands#darkBlueDotIcon'
                        : branch.isNew
                          ? 'islands#blueDotIcon'
                          : 'islands#blueCircleDotIcon',
                  }}
                  properties={{
                    hintContent: branch.address,
                    balloonContentHeader: branch.name,
                    balloonContentBody: `${branch.address}${branch.isNew ? ' (Новый офис)' : ''}`,
                  }}
                />
              ))}
            </Map>
          </YMaps>
        </section>
      </div>
    </main>
  );
}
