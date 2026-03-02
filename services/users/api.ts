import {axios, call} from '@/services/_shared/http';
import {Agent, CreateUserPayload, DeleteUserPayload, UserDto} from "@/services/users/types";
import {AGENT_ENDPOINTS} from "@/services/users/constants";


export type UpdateUserPayload = Partial<Omit<CreateUserPayload, 'auth_method'>> & {
    id: number;
};

export type PasswordChangePayload = {
    current_password: string;
    new_password: string;
    new_password_confirmation: string;
};

export const usersApi = {
    list: () => call(async () => await axios.get<UserDto[]>('/user')),
    get: (id: number) => call(async () => await axios.get<UserDto>(`/user/${id}`)),
    create: (payload: CreateUserPayload) =>
        call(async () => await axios.post<UserDto>('/user', payload)),
    update: ({id, ...payload}: UpdateUserPayload) =>
        call(async () => await axios.put<UserDto>(`/user/${id}`, payload)),
    remove: async ({ id, distribute_to_agents, agent_id }: DeleteUserPayload): Promise<{ message: string }> => {
        const { data } = await axios.delete(`/user/${id}`, {
            data: {
                distribute_to_agents,
                agent_id: distribute_to_agents ? undefined : agent_id,
            },
        });
        return data;
    },

    uploadPhoto: (userId: number, photo: File) =>
        call(async () => {
            const form = new FormData();
            form.append('photo', photo);
            return await axios.post<{ message: string; photo: string }>(`/user/${userId}/photo`, form, {
                headers: {'Content-Type': 'multipart/form-data'},
            });
        }),

    deletePhoto: (userId: number) =>
        call(async () => await axios.delete<{ message: string }>(`/user/${userId}/photo`)),

    deleteMyPhoto: () =>
        call(async () => await axios.delete<{ message: string }>('/user/photo')),

    changeMyPassword: (payload: PasswordChangePayload) =>
        call(async () => await axios.post<{ message: string }>('/user/password', payload)),

};

export const getAgents = async (): Promise<Agent[]> => {
    const response = await axios.get(AGENT_ENDPOINTS.AGENTS);
    return response.data;
};
