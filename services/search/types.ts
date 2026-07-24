export type SearchCatalog = 'properties' | 'cars' | 'new_buildings';
export type SearchEntityType = 'property' | 'car' | 'new_building';

export type CatalogSearchSuggestion = {
  key: string;
  entity_type: SearchEntityType;
  entity_id: number;
  title: string;
  subtitle: string;
  catalog: SearchCatalog;
  source: 'local' | 'aura';
};

export type CatalogSearchResponse = {
  query: string;
  suggestions: CatalogSearchSuggestion[];
  matches: Record<SearchCatalog, number>;
  recommended_catalog: SearchCatalog;
  intent: {
    catalog: SearchCatalog;
    offer_type: 'sale' | 'rent' | null;
    normalized_query: string;
  };
};
