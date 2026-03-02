import {AxiosError} from "axios";
import {toast} from "react-toastify";

export default function showAxiosErrorToast(e: unknown, fallback = 'Ошибка запроса') {
    // axios error с response
    const err = e as AxiosError<any>;
    const status = err?.response?.status;

    // 422 — показываем message + все field errors
    if (status === 422) {
        const data = err.response?.data ?? {};
        const msg = data?.message || 'Ошибка валидации';
        toast.error(msg);

        const errors = data?.errors;
        if (errors && typeof errors === 'object') {
            Object.entries(errors).forEach(([field, messages]) => {
                if (Array.isArray(messages)) {
                    messages.forEach((m) => m && toast.error(`${field}: ${String(m)}`));
                } else if (messages) {
                    toast.error(`${field}: ${String(messages)}`);
                }
            });
        }
        return;
    }

    // Другие статусы (400/401/403/404/409/500/503 и т.д.)
    const data = err?.response?.data;
    const msg =
        (data && (data.message || data.error || data.detail)) ||
        err?.message ||
        (typeof e === 'string' ? e : '') ||
        fallback;

    toast.error(String(msg));
}