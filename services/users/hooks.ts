'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {getAgents, usersApi} from '@/services/users/api';
import {AGENT_QUERY_KEYS} from "@/services/users/constants";

/**
 * Список пользователей
 * GET /users
 */
export function useUsers() {
    return useQuery({
        queryKey: ['users'],
        queryFn: usersApi.list,
    });
}

/**
 * Один пользователь
 * GET /users/:id
 */
export function useUser(id?: number) {
    return useQuery({
        queryKey: ['users', id],
        queryFn: () => usersApi.get(id as number),
        enabled: !!id,
    });
}

/**
 * Создать пользователя
 * POST /users
 */
export function useCreateUser() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: usersApi.create,
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['users'] });
        },
    });
}

/**
 * Обновить пользователя
 * PUT /users/:id
 */
export function useUpdateUser() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: usersApi.update,
        onSuccess: (_data, vars) => {
            // vars — это аргументы, с которыми вы вызвали mutate({ id, ... })
            qc.invalidateQueries({ queryKey: ['users'] });
            qc.invalidateQueries({ queryKey: ['users', (vars as any).id] });
            qc.invalidateQueries({ queryKey: ['me'] }); // если редактировали себя
        },
    });
}

/**
 * Удалить пользователя
 * DELETE /users/:id
 */
export function useDeleteUser() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: usersApi.remove,
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['users'] });
        },
    });
}

/**
 * Загрузить фото пользователя (через админку или свой профиль)
 * POST /users/:id/photo
 */
export function useUploadUserPhoto() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ userId, photo }: { userId: number; photo: File }) =>
            usersApi.uploadPhoto(userId, photo),
        onSuccess: (_data, vars) => {
            qc.invalidateQueries({ queryKey: ['users', vars.userId] });
            qc.invalidateQueries({ queryKey: ['users'] });
            qc.invalidateQueries({ queryKey: ['me'] }); // если это своё фото
        },
    });
}

/**
 * Удалить фото пользователя (админ)
 * DELETE /user/:id/photo
 */
export function useDeleteUserPhoto() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ userId }: { userId: number }) => usersApi.deletePhoto(userId),
        onSuccess: (_data, vars) => {
            qc.invalidateQueries({ queryKey: ['users', vars.userId] });
            qc.invalidateQueries({ queryKey: ['users'] });
            qc.invalidateQueries({ queryKey: ['me'] });
        },
    });
}

/**
 * Удалить СВОЁ фото
 * DELETE /user/photo
 */
export function useDeleteMyPhoto() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: usersApi.deleteMyPhoto,
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['me'] });
        },
    });
}

/**
 * Сменить СВОЙ пароль
 * POST /user/password
 */
export function useChangeMyPassword() {
    return useMutation({
        mutationFn: usersApi.changeMyPassword,
    });
}

/**
 * (Опционально) Получить список агентов
 * GET /agents  — убедись, что реализован usersApi.agents()
 */
export function useAgents() {
    return useQuery({
        queryKey: ['agents'],
        queryFn: getAgents
    });
}

export const useGetAgentsQuery = () => {
    return useQuery({
        queryKey: [AGENT_QUERY_KEYS.AGENTS],
        queryFn: getAgents,
    });
};

/**
 * Текущий пользователь (алиас на профиль)
 * GET /me
 * Если у тебя уже есть useProfile/useMe в другом месте — можешь не дублировать.
 */
export function useMe() {
    return useQuery({
        queryKey: ['me'],
        queryFn: async () => {
            // Лучше иметь отдельный authApi.getMe(); здесь — быстрый вариант через usersApi.get(…)
            // Но "me" — это отдельный endpoint. Зависит от твоей реализации.
            // Если есть endpoint /me, добавь в соответствующий api и дерни его тут.
            throw new Error('Реализуй authApi.getMe() и используй его тут, либо переиспользуй свой useProfile');
        },
        enabled: false, // чтобы не стрелял пока не реализуешь
    });
}
