'use client';

import { isAxiosError } from 'axios';
import { axios } from '@/utils/axios';
import { UNIT_STATUS_LABELS } from '@/services/new-buildings/public-unit';

const valueLabels: Record<string, Record<string, string>> = {
  availability_status: { ...UNIT_STATUS_LABELS, withdrawn: 'Снята' },
  publication_status: { draft: 'Черновик', pending: 'На модерации', published: 'Опубликована', rejected: 'Отклонена', archived: 'В архиве' },
  pricing_basis: { total: 'Общая цена', per_sqm: 'Цена за м²' },
  window_view: { courtyard: 'Во двор', street: 'На улицу', park: 'На парк', mountains: 'На горы', city: 'На город', panoramic: 'Панорамный' },
};
export function inventoryValue(field: string, value: string | number | null): string | number {
  return value === null ? 'Не указано' : valueLabels[field]?.[String(value)] ?? value;
}

export const batchButton = 'min-h-11 rounded-xl border px-4 py-2 font-semibold text-green-800 disabled:opacity-50';
export const batchField = 'mt-1 block min-h-11 w-full rounded-xl border border-gray-400 bg-white p-3';
export const batchPath = (id: number) => '/manage/new-buildings/' + id + '/inventory-batches';
export function batchError(error: unknown): string {
  if (isAxiosError(error)) {
    if (error.response?.status === 401) return 'Сессия завершилась. Войдите снова.';
    if (error.response?.status === 403) return 'Нет прав на эту операцию.';
    if (error.response?.status === 409) return error.response.data?.message || 'Версия изменилась. Обновите пакет.';
    if (error.response?.status === 422) return Object.values(error.response.data?.errors ?? {}).flat().join(' ') || error.response.data?.message || 'Проверьте данные.';
    if (error.response?.status === 413) return 'Файл превышает ограничение сервера.';
    if (error.response?.status === 429) return 'Слишком много запросов. Повторите через минуту.';
  }
  return 'Результат запроса не подтверждён. Проверьте журнал или повторите тот же запрос.';
}
export async function downloadBatchFile(url: string, userId: number, name: string) {
  const response = await axios.get(url, { params: { expected_user_id: userId }, responseType: 'blob', timeout: 60_000 });
  const objectUrl = URL.createObjectURL(response.data);
  const link = document.createElement('a'); link.href = objectUrl; link.download = name; link.click();
  setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
}
