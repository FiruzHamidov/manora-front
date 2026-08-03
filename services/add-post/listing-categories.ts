export type ListingCategory = 'secondary' | 'transport';

export const LISTING_CATEGORY_CARDS: ReadonlyArray<{
  id: ListingCategory;
  title: string;
  image: string;
}> = [
  { id: 'secondary', title: 'Недвижимость', image: '/categories/02_vtorichka-hq-v2.png' },
  { id: 'transport', title: 'Авто', image: '/categories/03_transport-hq-v2.png' },
];
