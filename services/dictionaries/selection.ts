export type DictionaryOption = { id: number; name: string; is_active?: boolean; moderation_status?: string };

export function dictionarySelectionIds(values: readonly (number | string)[]): number[] {
  return [...new Set(values.map(Number).filter(id => Number.isSafeInteger(id) && id > 0))];
}

export function changeDictionarySelection(selected: readonly (number | string)[], id: number, multiple: boolean): number[] {
  if (!multiple) return [id];
  const ids = dictionarySelectionIds(selected);
  return ids.includes(id) ? ids.filter(value => value !== id) : [...ids, id];
}

export async function loadDictionarySelection(selected: readonly (number | string)[], fetchChunk: (ids: number[]) => Promise<DictionaryOption[]>): Promise<DictionaryOption[]> {
  const ids = dictionarySelectionIds(selected);
  const result: DictionaryOption[] = [];
  for (let offset = 0; offset < ids.length; offset += 100) {
    const chunk = ids.slice(offset, offset + 100);
    const records = await fetchChunk(chunk);
    result.push(...records.filter(record => chunk.includes(record.id)));
  }
  return result;
}
