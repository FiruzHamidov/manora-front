/** Verification is a calendar date in the property's timezone, not the viewer's. */
export function residentialDateInput(value: string | null | undefined): string {
  if (!value) return '';
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return '';
  const parts = new Intl.DateTimeFormat('en', {
    timeZone: 'Asia/Dushanbe', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(date);
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find(item => item.type === type)?.value;
  return `${part('year')}-${part('month')}-${part('day')}`;
}

export function residentialDateLabel(value: string | null | undefined): string | null {
  const date = residentialDateInput(value);
  return date ? date.split('-').reverse().join('.') : null;
}
