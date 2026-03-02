import { call, axios } from '@/services/_shared/http';
import {Role} from "@/services/login/types";



export const rolesApi = {
    list: () => call(async () => await axios.get<Role[]>('/roles')),
    get: (id: number) => call(async () => await axios.get<Role>(`/roles/${id}`)),
    create: (payload: Pick<Role, 'name' | 'slug'> & { description?: string | null }) =>
        call(async () => await axios.post<Role>('/roles', payload)),
    update: (id: number, payload: Partial<Role>) =>
        call(async () => await axios.put<Role>(`/roles/${id}`, payload)),
    remove: (id: number) => call(async () => await axios.delete<{ message: string }>(`/roles/${id}`)),
};