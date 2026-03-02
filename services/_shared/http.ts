import { axios } from '@/utils/axios';

export type ApiErrorPayload = { message?: string; errors?: Record<string, string[] | string> };

export class ApiError extends Error {
    status?: number;
    payload?: ApiErrorPayload;
    constructor(message: string, status?: number, payload?: ApiErrorPayload) {
        super(message);
        this.status = status;
        this.payload = payload;
    }
}

export async function call<T>(fn: () => Promise<{ data: T }>): Promise<T> {
    try {
        const { data } = await fn();
        return data;
    } catch (e: any) {
        const status = e?.response?.status;
        const payload = e?.response?.data as ApiErrorPayload | undefined;
        const msg =
            payload?.message ||
            (typeof payload === 'string' ? payload : '') ||
            e?.message ||
            'Request failed';
        throw new ApiError(msg, status, payload);
    }
}

export { axios };