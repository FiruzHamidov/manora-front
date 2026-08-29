export type CompletionValue = {
  completion_precision?: 'date' | 'quarter' | 'year' | 'unknown';
  completion_at?: string | null;
  completion_year?: number | null;
  completion_quarter?: number | null;
};

export function formatCompletion(value: CompletionValue): string {
  const precision = value.completion_precision ?? (value.completion_at ? 'date' : 'unknown');
  if (precision === 'year' && value.completion_year) return `${value.completion_year} год`;
  if (precision === 'quarter' && value.completion_year && value.completion_quarter && value.completion_quarter >= 1 && value.completion_quarter <= 4) return `${value.completion_quarter} квартал ${value.completion_year}`;
  if (precision === 'date' && value.completion_at) {
    const date = new Date(value.completion_at);
    if (Number.isFinite(date.getTime())) return date.toLocaleDateString('ru-RU', { timeZone: 'UTC' });
  }
  return 'Срок не указан';
}

export function formatCompletionRange(value: { from: CompletionValue | null; to: CompletionValue | null; has_unknown: boolean }): string {
  if (!value.from || !value.to) return 'Срок не указан';
  const from = formatCompletion(value.from), to = formatCompletion(value.to);
  return (from === to ? from : from + ' — ' + to) + (value.has_unknown ? '; часть сроков не указана' : '');
}
