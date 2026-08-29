'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { axios } from '@/utils/axios';
import type { OwnReview, ReviewInput } from './reviews';

const ownPath = (id: number) => '/my/new-building-reviews/' + id;
export function reviewError(error: unknown): string {
  if (isAxiosError(error)) {
    if (error.response?.status === 409) return 'Запись или аккаунт изменились. Обновите данные и сравните версии. Ваш текст сохранён в форме.';
    if (error.response?.status === 401) return 'Сессия завершилась. Войдите снова.';
    if (error.response?.status === 403) return 'Недостаточно прав для этого действия.';
    if (error.response?.status === 404) return 'ЖК или отзыв больше недоступен.';
    if (error.response?.status === 429) return 'Слишком много запросов. Повторите попытку через минуту.';
    if (error.response?.status === 422) return error.response.data?.message || 'Проверьте поля формы.';
  }
  return 'Результат не подтверждён. Обновите данные перед повторной отправкой.';
}
export function useOwnBuildingReview(id: number, userId?: number) {
  return useQuery({ queryKey: ['building-reviews', id, 'own', userId], enabled: !!userId,
    queryFn: async ({ signal }) => (await axios.get<{ data: OwnReview | null; user_id: number }>(ownPath(id),
      { signal, timeout: 12_000, params: { expected_user_id: userId } })).data,
    retry: false, refetchInterval: 30_000, refetchOnWindowFocus: true,
  });
}
export function useSaveBuildingReview(id: number, userId: number) {
  const cache = useQueryClient();
  return useMutation({
    mutationFn: async (change: { input: ReviewInput } | { withdrawVersion: number }) => {
      const data = 'input' in change ? { ...change.input, expected_user_id: userId } : { version: change.withdrawVersion, expected_user_id: userId };
      const response = 'input' in change
        ? await axios.put<{ data: OwnReview; user_id: number }>(ownPath(id), data, { timeout: 15_000 })
        : await axios.delete<{ data: OwnReview; user_id: number }>(ownPath(id), { data, timeout: 15_000 });
      return response.data;
    },
    onSettled: () => cache.invalidateQueries({ queryKey: ['building-reviews', id] }),
  });
}
