'use client';

import {ChangeEvent, useEffect, useState} from 'react';
import {toast} from 'react-toastify';
import {Input} from '@/ui-components/Input';
import {axios} from '@/utils/axios';
import {AxiosError} from "axios";

const PASSWORD_URL = '/user/update-password';

type Props = {
    open: boolean;
    onClose: () => void;
};

export default function PasswordChangeModal({open, onClose}: Props) {
    const [form, setForm] = useState({
        current_password: '',
        new_password: '',
        new_password_confirmation: '',
    });
    const [errors, setErrors] = useState<{ [k: string]: string }>({});
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (!open) return;
        const onEsc = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
        window.addEventListener('keydown', onEsc);
        return () => window.removeEventListener('keydown', onEsc);
    }, [open, onClose]);

    useEffect(() => {
        if (!open) {
            setForm({
                current_password: '',
                new_password: '',
                new_password_confirmation: '',
            });
            setErrors({});
            setSubmitting(false);
        }
    }, [open]);

    const setField = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const {name, value} = e.target;
        setForm((prev) => ({...prev, [name]: value}));
        if (errors[name]) setErrors((prev) => ({...prev, [name]: ''}));
    };

    const validate = () => {
        const errs: { [k: string]: string } = {};
        if (!form.current_password) errs.current_password = 'Укажите текущий пароль';
        if (!form.new_password) errs.new_password = 'Укажите новый пароль';
        if (form.new_password && form.new_password.length < 6)
            errs.new_password = 'Минимум 6 символов';
        if (form.new_password && form.current_password && form.new_password === form.current_password)
            errs.new_password = 'Новый пароль не должен совпадать с текущим';
        if (!form.new_password_confirmation)
            errs.new_password_confirmation = 'Повторите новый пароль';
        if (
            form.new_password &&
            form.new_password_confirmation &&
            form.new_password !== form.new_password_confirmation
        )
            errs.new_password_confirmation = 'Пароли не совпадают';
        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const submit = async () => {
        if (!validate()) return;
        setSubmitting(true);
        try {

            await axios.post(
                PASSWORD_URL,
                {
                    current_password: form.current_password,
                    new_password: form.new_password,
                    new_password_confirmation: form.new_password_confirmation,
                },
            );

            toast.success('Пароль успешно обновлён');
            onClose();
        } catch (err) {
            const error = err as AxiosError<{ message?: string; errors?: Record<string, string[]> }>;
            const data = error.response?.data ?? {};
            if (data.errors) {
                const serverErrs: Record<string, string> = {};
                Object.entries(data.errors).forEach(([k, v]) => {
                    serverErrs[k] = Array.isArray(v) ? v[0] : String(v);
                });
                setErrors(serverErrs);
            }
            const msg =
                data.message ||
                (typeof data === 'string' ? data : '') ||
                error.message ||
                'Не удалось обновить пароль';
            toast.error(msg);
        } finally {
            setSubmitting(false);
        }
    };

    const handleSubmit = (e?: React.FormEvent) => {
        e?.preventDefault();
        submit();
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center" role="dialog" aria-modal="true">
            <div className="absolute inset-0 bg-black/30" onClick={onClose}/>
            <div className="relative z-10 w-full max-w-md bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-lg font-semibold mb-4">Смена пароля</h3>

                {/* <<< обернули в форму >>> */}
                <form onSubmit={handleSubmit}>
                    <div className="space-y-4">
                        <Input
                            label="Текущий пароль"
                            name="current_password"
                            type="password"
                            value={form.current_password}
                            onChange={setField}
                            placeholder="Введите текущий пароль"
                            error={errors.current_password}
                        />
                        <Input
                            label="Новый пароль"
                            name="new_password"
                            type="password"
                            value={form.new_password}
                            onChange={setField}
                            placeholder="Минимум 6 символов"
                            error={errors.new_password}
                        />
                        <Input
                            label="Подтверждение нового пароля"
                            name="new_password_confirmation"
                            type="password"
                            value={form.new_password_confirmation}
                            onChange={setField}
                            placeholder="Повторите новый пароль"
                            error={errors.new_password_confirmation}
                        />
                        <div className="text-xs text-gray-500">
                            Рекомендуем использовать буквы в разных регистрах и цифры.
                        </div>
                    </div>

                    <div className="mt-6 flex gap-3 justify-end">
                        <button
                            type="button"
                            className="px-4 py-2 rounded-md bg-gray-100 hover:bg-gray-200"
                            onClick={onClose}
                            disabled={submitting}
                        >
                            Отмена
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 rounded-md bg-[#0036A5] text-white hover:bg-blue-800 disabled:opacity-50"
                            disabled={submitting}
                        >
                            {submitting ? 'Обновление...' : 'Обновить пароль'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}