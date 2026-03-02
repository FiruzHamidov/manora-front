'use client';

import {useEffect, useState} from 'react';
import Image from 'next/image';
import {Input} from '@/ui-components/Input';
import {toast} from 'react-toastify';
import {useRoles} from '@/services/roles/hooks';
import {useBranches} from '@/services/branches/hooks';
import type {UserDto} from '@/services/users/types';
import {STORAGE_URL} from '@/constants/base-url';

type Props = {
    mode: 'create' | 'edit';
    initial?: Partial<UserDto>;
    onSubmit: (values: Partial<UserDto>, photo?: File | null, deletePhoto?: boolean) => Promise<void>;
    onCancel: () => void;
    isSubmitting?: boolean;
};

export default function UserForm({mode, initial, onSubmit, onCancel, isSubmitting}: Props) {
    const {data: roles} = useRoles();
    const {data: branches} = useBranches();

    const [form, setForm] = useState<Partial<UserDto>>({
        name: '',
        phone: '',
        email: '',
        description: '',
        birthday: '',
        role_id: undefined as unknown as number,
        branch_id: undefined as unknown as number,
        auth_method: 'password',
        password: '',
        ...initial,
    });
    const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null);
    const [photoPreview, setPhotoPreview] = useState<string>('');
    const [deletePhoto, setDeletePhoto] = useState(false);

    // для edit пароль не обязателен
    // const showPassword = useMemo(() => form.auth_method === 'password' && mode === 'create', [form.auth_method, mode]);

    useEffect(() => {
        if (initial) setForm((f) => ({...f, ...initial}));
    }, [initial]);

    useEffect(() => {
        setSelectedPhoto(null);
        setDeletePhoto(false);
    }, [initial?.id, mode]);

    useEffect(() => {
        if (selectedPhoto) {
            const url = URL.createObjectURL(selectedPhoto);
            setPhotoPreview(url);
            return () => URL.revokeObjectURL(url);
        }

        if (deletePhoto) {
            setPhotoPreview('');
            return;
        }

        const photo = initial?.photo;
        if (!photo) {
            setPhotoPreview('');
            return;
        }

        if (photo.startsWith('http')) {
            setPhotoPreview(photo);
            return;
        }

        setPhotoPreview(STORAGE_URL ? `${STORAGE_URL}/${photo}` : photo);
    }, [selectedPhoto, initial?.photo, deletePhoto]);

    const updateField = (name: string, value: string | number) =>
        setForm((f) => ({...f, [name]: value}));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.name || !form.phone || !form.role_id || !form.branch_id) {
            toast.error('Заполните имя, телефон, роль и филиал');
            return;
        }
        if (mode === 'create' && form.auth_method === 'password' && !form.password) {
            toast.error('Введите пароль (или выберите вход по SMS)');
            return;
        }
        await onSubmit(form, selectedPhoto, deletePhoto);
    };

    return (
        <form onSubmit={handleSubmit} className="grid gap-4 max-w-xl">
            <Input className='' label="Имя" name="name" value={form.name || ''} onChange={(e) => updateField('name', e.target.value)}
                   required/>
            <Input label="Телефон" name="phone" value={form.phone || ''}
                   onChange={(e) => updateField('phone', e.target.value)} required/>
            <Input label="Email" type="email" name="email" value={form.email || ''}
                   onChange={(e) => updateField('email', e.target.value)}/>
            <div>
                <label className="block mb-2 text-sm text-gray-600">Дата рождения</label>
                <input
                    type="date"
                    className="w-full px-4 py-3 rounded-md bg-gray-50"
                    value={form.birthday || ''}
                    onChange={(e) => updateField('birthday', e.target.value)}
                />
            </div>
            <Input
                label="Описание"
                name="description"
                value={form.description || ''}
                textarea
                onChange={(e) => updateField('description', e.target.value)}
            />

            <div>
                <label className="block mb-2 text-sm text-gray-600">Роль</label>
                <select
                    className="w-full px-4 py-3 rounded-md bg-gray-50"
                    value={form.role_id ?? ''}
                    onChange={(e) => updateField('role_id', Number(e.target.value))}
                    required
                >
                    <option value="" disabled>Выберите роль</option>
                    {roles?.map((r) => (
                        <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                </select>
            </div>

            <div>
                <label className="block mb-2 text-sm text-gray-600">Филиал</label>
                <select
                    className="w-full px-4 py-3 rounded-md bg-gray-50"
                    value={form.branch_id ?? ''}
                    onChange={(e) => updateField('branch_id', Number(e.target.value))}
                    required
                >
                    <option value="" disabled>Выберите филиал</option>
                    {branches?.map((branch) => (
                        <option key={branch.id} value={branch.id}>
                            {branch.name}
                        </option>
                    ))}
                </select>
            </div>

            <Input
                label="Пароль"
                type="password"
                name="password"
                value={form.password || ''}
                onChange={(e) => updateField('password', e.target.value)}
            />

            {mode === 'edit' && (
                <div className="grid gap-2">
                    <label className="block text-sm text-gray-600">Фото пользователя</label>
                    {photoPreview && (
                        <div className="w-24 h-24 rounded-full overflow-hidden border border-gray-200">
                            <Image
                                src={photoPreview}
                                alt="Фото пользователя"
                                width={96}
                                height={96}
                                className="w-full h-full object-cover"
                            />
                        </div>
                    )}
                    <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                            setDeletePhoto(false);
                            setSelectedPhoto(e.target.files?.[0] ?? null);
                        }}
                        className="w-full px-4 py-3 rounded-md bg-gray-50"
                    />
                    {selectedPhoto && (
                        <p className="text-xs text-gray-500">Выбрано: {selectedPhoto.name}</p>
                    )}
                    <button
                        type="button"
                        disabled={!photoPreview || isSubmitting}
                        onClick={() => {
                            setSelectedPhoto(null);
                            setDeletePhoto(true);
                        }}
                        className="w-fit px-3 py-2 rounded-md border border-red-300 text-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Удалить фото
                    </button>
                </div>
            )}

            <div className="flex gap-3 pt-2">
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-2 rounded-md bg-[#0036A5] text-white disabled:opacity-60"
                >
                    {isSubmitting ? 'Сохранение…' : 'Сохранить'}
                </button>
                <button type="button" onClick={onCancel} className="px-4 py-2 rounded-md border">
                    Отмена
                </button>
            </div>
        </form>
    );
}
