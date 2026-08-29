import type { QueryClient } from '@tanstack/react-query';

/** A committed lot change affects its own pages and aggregate/cross-building selections. */
export async function invalidatePublicInventory(cache: QueryClient, buildingId: number): Promise<void> {
  await Promise.all([
    ['public-building', buildingId], ['public-unit', buildingId], ['residential-selection', buildingId],
    ['public-building-gallery', buildingId], ['public-unit-drawings', buildingId], ['public-masterplan', buildingId],
    ['residential-catalog'], ['similar-units'], ['public-payment-programs'], ['payment-units'],
  ].map(queryKey => cache.invalidateQueries({ queryKey })));
}
