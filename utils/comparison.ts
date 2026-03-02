const STORAGE_KEY = "aura_comparison_properties";
const MAX_COMPARISON_ITEMS = 2;

export function addToComparison(propertyId: string | number): string[] {
  const id = String(propertyId);

  const currentIds = getComparisonIds();

  if (currentIds.includes(id)) {
    return currentIds;
  }

  const newIds = [id, ...currentIds.filter((item) => item !== id)].slice(
    0,
    MAX_COMPARISON_ITEMS
  );

  localStorage.setItem(STORAGE_KEY, JSON.stringify(newIds));

  return newIds;
}

export function getComparisonIds(): string[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch (error) {
    console.error("Error retrieving comparison IDs from localStorage:", error);
    return [];
  }
}

export function removeFromComparison(propertyId: string | number): string[] {
  const id = String(propertyId);
  const currentIds = getComparisonIds();
  const newIds = currentIds.filter((item) => item !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(newIds));
  return newIds;
}

export function isComparisonFull(): boolean {
  return getComparisonIds().length >= MAX_COMPARISON_ITEMS;
}
