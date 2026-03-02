'use client';
import { useQuery } from '@tanstack/react-query';
import { rolesApi } from '@/services/roles/api';

export function useRoles() {
    return useQuery({
        queryKey: ['roles'],
        queryFn: rolesApi.list,
    });
}