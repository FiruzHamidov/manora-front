export type ResidentialShareTarget = { buildingId: number; unitId?: number; source?: 'local' | 'aura' };
export const RESIDENTIAL_SITE = new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://manora.tj').origin;

/** Construct identity, never copy window.location (filters, fragments, tokens, PII). */
export function residentialCanonical(target: ResidentialShareTarget, site = RESIDENTIAL_SITE): string {
  const validId = (id: number) => Number.isSafeInteger(id) && id > 0;
  if (!validId(target.buildingId) || (target.unitId !== undefined && !validId(target.unitId))
    || (target.unitId !== undefined && target.source === 'aura')) throw new Error('Некорректный объект.');
  const origin = new URL(site);
  if (!['http:', 'https:'].includes(origin.protocol)) throw new Error('Некорректный адрес сайта.');
  return origin.origin + '/new-buildings/' + target.buildingId + (target.unitId === undefined ? '' : '/units/' + target.unitId)
    + (target.source === 'aura' ? '?source=aura' : '');
}

type SharePort = { share?: (data: ShareData) => Promise<void>; canShare?: (data: ShareData) => boolean; clipboard?: { writeText: (text: string) => Promise<void> } };
export async function shareResidential(target: ResidentialShareTarget, title: string, port: SharePort, site = RESIDENTIAL_SITE): Promise<'native' | 'copied' | 'cancelled' | 'manual'> {
  const url = residentialCanonical(target, site), data = { title, url };
  try {
    if (port.share && (!port.canShare || port.canShare(data))) {
      await port.share(data);
      return 'native';
    }
  } catch (error) {
    if (error && typeof error === 'object' && 'name' in error && error.name === 'AbortError') return 'cancelled';
  }
  try {
    if (!port.clipboard) return 'manual';
    await port.clipboard.writeText(url);
    return 'copied';
  } catch { return 'manual'; }
}
