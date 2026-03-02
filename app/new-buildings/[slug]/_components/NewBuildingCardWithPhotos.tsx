import { useNewBuildingPhotos } from '@/services/new-buildings/hooks';
import NewBuildingCard from '@/ui-components/new-buildings/new-buildings-card';
import { resolveMediaUrl } from '@/constants/base-url';

// eslint-disable-next-line
export function NewBuildingCardWithPhotos({ building, className }: { building: any; className?: string }) {
  const source = building?.__source === 'aura' ? 'aura' : 'local';
  const { data: photos } = useNewBuildingPhotos(building.id, source);
  const previewUnits = Array.isArray(building.preview_units)
    ? building.preview_units
    : Array.isArray(building.units)
      ? building.units
      : [];

  const apartmentOptions = previewUnits.slice(0, 3).map((unit: any) => ({
    rooms: Number(unit.rooms || unit.bedrooms || 1),
    area: Number(unit.area_from || unit.area || 0),
    price: Number(unit.price_from || unit.price || unit.total_price || 0),
    currency: unit.currency || 'TJS',
  }));

  const locationText = [building.address, building.district].filter(Boolean).join(', ') || 'Таджикистан';

  return (
    <NewBuildingCard
      key={building.id}
      id={building.id}
      slug={`${building.id}?source=${source}`}
      title={building.title}
      subtitle={building.description || ''}
      photos={photos || []}
      image={{
        src: resolveMediaUrl(photos?.[0]?.path || building.photos?.[0]?.path),
        alt: building.title,
      }}
      apartmentOptions={apartmentOptions}
      location={locationText}
      developer={
        typeof building?.developer === 'string'
          ? {
              id: building.id,
              name: building.developer,
              logo_path: '/images/no-image.png',
              phone: null,
            }
          : building?.developer?.name
          ? {
              id: building.developer.id,
              name: building.developer.name,
              logo_path: building.developer.logo_path,
              phone: building.developer.phone,
            }
          : {
              id: 0,
              name: 'Неизвестно',
              logo_path: '/images/no-image.png',
              phone: null,
          }
      }
      hasInstallmentOption={building.installment_available}
      stageName={typeof building?.stage === 'string' ? building.stage : building.stage?.name || null}
      className={className || ''}
    />
  );
}
