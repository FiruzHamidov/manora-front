'use client';

import { FC } from 'react';
import BusIcon from '@/icons/BusIcon';
import ChildZoneIcon from '@/icons/ChildZoneIcon';
import DownTownIcon from '@/icons/DownTownIcon';
import GymIcon from '@/icons/GymIcon';
import HospitalIcon from '@/icons/HospitalIcon';
import MarketIcon from '@/icons/MarketIcon';
import MosqueIcon from '@/icons/MosqueIcon';
import ParkIcon from '@/icons/ParkIcon';
import SchoolIcon from '@/icons/SchoolIcon';
import { NewBuilding, NearbyPlace } from '@/services/new-buildings/types';
import { YMaps, Map, Placemark } from '@pbe/react-yandex-maps';

interface ComfortNearbyProps {
  building: NewBuilding;
}

// Map place types to icons and labels
const placeConfig: Record<
  NearbyPlace['type'],
  { icon: React.ComponentType<{ className?: string }>; label: string }
> = {
  mosque: { icon: MosqueIcon, label: 'Мечеть' },
  bus_stop: { icon: BusIcon, label: 'Общественный транспорт' },
  downtown: { icon: DownTownIcon, label: 'Центр города' },
  hospital: { icon: HospitalIcon, label: 'Больница' },
  gym: { icon: GymIcon, label: 'Тренажерный зал' },
  park: { icon: ParkIcon, label: 'Парк' },
  school: { icon: SchoolIcon, label: 'Школа' },
  kindergarten: { icon: ChildZoneIcon, label: 'Детский сад' },
  supermarket: { icon: MarketIcon, label: 'Супермаркет' },
};

// Format distance in meters to readable format
const formatDistance = (meters: number): string => {
  if (meters < 1000) {
    return `${meters} м.`;
  }
  return `${(meters / 1000).toFixed(2)} км.`;
};

export const ComfortNearby: FC<ComfortNearbyProps> = ({ building }) => {
  const nearbyPlaces = building.nearby_places || [];
  const hasNearbyPlaces = nearbyPlaces.length > 0;

  return (
    <div className="mt-5 rounded-[26px] bg-white px-4 py-5 shadow-[0_2px_20px_rgba(15,23,42,0.05)] md:px-6 md:py-6">
      {hasNearbyPlaces && (
        <>
          <h2 className="text-[28px] font-extrabold text-[#111827]">Удобства рядом</h2>

          <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {nearbyPlaces.map((place) => {
              const config = placeConfig[place.type];
              if (!config) return null;

              const Icon = config.icon;

              return (
                <div key={place.id} className="flex items-center rounded-2xl bg-[#F8FAFC] px-4 py-4">
                  <div className="mr-2 text-[#0036A5]">
                    <Icon className="w-8 h-8" />
                  </div>
                  <div>
                    <span className="text-[#667085] text-lg">
                      {config.label}:{' '}
                    </span>
                    <span className="text-lg">
                      {formatDistance(place.distance)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      <h2
        className={`text-[28px] font-extrabold text-[#111827] ${
          hasNearbyPlaces ? 'mt-8' : ''
        }`}
      >
        На карте
      </h2>

      {building.latitude && building.longitude ? (
        <YMaps>
          <div className="relative mt-5 h-[400px] w-full overflow-hidden rounded-2xl">
            <Map
              defaultState={{
                center: [
                  parseFloat(building.latitude.toString()),
                  parseFloat(building.longitude.toString()),
                ],
                zoom: 15,
              }}
              width="100%"
              height="100%"
              modules={['placemark']}
            >
              <Placemark
                geometry={[
                  parseFloat(building.latitude.toString()),
                  parseFloat(building.longitude.toString()),
                ]}
                options={{
                  iconLayout: 'default#image',
                  iconImageHref: '/images/pin.svg',
                  iconImageSize: [38, 38],
                  iconImageOffset: [-19, -38],
                }}
              />
            </Map>
          </div>
        </YMaps>
      ) : (
        <div className="relative mt-5 flex h-[400px] w-full items-center justify-center overflow-hidden rounded-2xl bg-gray-100">
          <p className="text-[#667085]">Координаты местоположения не указаны</p>
        </div>
      )}
    </div>
  );
};
