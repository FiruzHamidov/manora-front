type PropertyTypeLike = {
  id: number | string;
  slug?: string | null;
};

type CatalogHrefOptions = {
  offerType?: 'sale' | 'rent';
  propertyTypeIds?: Array<string | number>;
};

const DEFAULT_LISTING_QUERY = {
  listing_type: 'regular',
  sort: 'listing_type',
  dir: 'desc',
} as const;

const PROPERTY_TYPE_ID_FALLBACKS: Record<string, string> = {
  apartment: '1',
  house: '2',
  houses: '2',
  cottage: '3',
  room: '4',
  commercial: '5',
};

const normalizeSlug = (value?: string | null) => (value ?? '').trim().toLowerCase();

export const getPropertyTypeIdsBySlugs = (
  propertyTypes: unknown,
  slugs: string[]
): string[] => {
  const normalizedSlugs = new Set(slugs.map(normalizeSlug));
  const resolvedIds = new Set<string>();

  if (Array.isArray(propertyTypes) && propertyTypes.length > 0) {
    (propertyTypes as PropertyTypeLike[])
      .filter((type) => normalizedSlugs.has(normalizeSlug(type.slug)))
      .forEach((type) => {
        resolvedIds.add(String(type.id));
      });
  }

  normalizedSlugs.forEach((slug) => {
    const fallbackId = PROPERTY_TYPE_ID_FALLBACKS[slug];
    if (fallbackId) {
      resolvedIds.add(fallbackId);
    }
  });

  return Array.from(resolvedIds);
};

export const buildListingsCatalogHref = ({
  offerType = 'sale',
  propertyTypeIds = [],
}: CatalogHrefOptions = {}): string => {
  const params = new URLSearchParams({
    ...DEFAULT_LISTING_QUERY,
    offer_type: offerType,
  });

  if (propertyTypeIds.length > 0) {
    params.set('propertyTypes', propertyTypeIds.map(String).join(','));
  }

  return `/listings?${params.toString()}`;
};
