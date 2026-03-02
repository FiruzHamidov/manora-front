'use client';

import {useEffect, useMemo, useState} from 'react';
import {useAgents, useCreateUser, useDeleteUser, useDeleteUserPhoto, useUpdateUser, useUploadUserPhoto, useUsers} from '@/services/users/hooks';
import type {CreateUserPayload, DeleteUserPayload, UpdateUserPayload, UserDto} from '@/services/users/types';
import UserForm from './_components/UserForm';
import {toast} from 'react-toastify';
import {Eye, Pencil, Plus, SquareChartGantt, Trash2} from 'lucide-react';
import {AnimatePresence, motion} from 'framer-motion';
import DeleteUserDialog from "@/app/admin/users/_components/DeleteUserDialog";
import showAxiosErrorToast from "@/utils/showAxiosErrorToast";
import Link from "next/link";

export default function UsersPage() {
    const {data: users, isLoading, error} = useUsers();
    const createUser = useCreateUser();
    const updateUser = useUpdateUser();
    const uploadUserPhoto = useUploadUserPhoto();
    const deleteUserPhoto = useDeleteUserPhoto();
    const deleteUser = useDeleteUser();
    const {data: agents, isLoading: loadingAgents} = useAgents();
    const [mode, setMode] = useState<'none' | 'create' | 'edit'>('none');
    const [selected, setSelected] = useState<UserDto | null>(null);

    const [deleteOpen, setDeleteOpen] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<UserDto | null>(null);

    const isOpen = mode !== 'none';

    useEffect(() => {
        // Блокируем скролл фона, когда открыт сайд-панель
        if (isOpen) {
            const prev = document.body.style.overflow;
            document.body.style.overflow = 'hidden';
            return () => {
                document.body.style.overflow = prev;
            };
        }
    }, [isOpen]);

    const sorted = useMemo(() => (users ?? []).slice().sort((a, b) => b.id - a.id), [users]);

    const openCreate = () => {
        setSelected(null);
        setMode('create');
    };
    const openEdit = (u: UserDto) => {
        setSelected(u);
        setMode('edit');
    };
    const closeForm = () => {
        setSelected(null);
        setMode('none');
    };

    useEffect(() => {
        // Закрытие по Escape
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) closeForm();
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [isOpen]);

    const handleCreate = async (values: Partial<UserDto>) => {
        try {
            const payload: CreateUserPayload = {
                name: String(values.name),
                phone: String(values.phone),
                email: values.email ?? '',
                description: values.description,
                birthday: values.birthday,
                role_id: Number(values.role_id),
                branch_id: Number(values.branch_id),
                auth_method: (values.auth_method as 'password' | 'sms') ?? 'password',
                password: values.password ?? undefined,
            };
            await createUser.mutateAsync(payload);
            toast.success('Пользователь создан');
            closeForm();
        } catch (e) {
            showAxiosErrorToast(e, 'Не удалось создать пользователя');
        }
    };

    const handleUpdate = async (values: Partial<UserDto>, photo?: File | null, shouldDeletePhoto?: boolean) => {
        if (!selected) return;
        try {
            const payload: UpdateUserPayload = {
                id: selected.id,
                name: values.name,
                phone: values.phone,
                email: values.email,
                description: values.description,
                birthday: values.birthday,
                role_id: values.role_id ?? selected.role_id,
                branch_id: values.branch_id ?? selected.branch_id ?? undefined,
                password: values.password,
            };
            await updateUser.mutateAsync(payload);
            if (shouldDeletePhoto) {
                await deleteUserPhoto.mutateAsync({userId: selected.id});
            } else if (photo) {
                await uploadUserPhoto.mutateAsync({userId: selected.id, photo});
            }
            toast.success('Пользователь обновлён');
            closeForm();
        } catch (e) {
            showAxiosErrorToast(e, 'Не удалось обновить пользователя');
        }
    };

    const openDeleteDialog = (u: UserDto) => {
        setDeleteTarget(u);
        setDeleteOpen(true);
    };

    const closeDeleteDialog = () => {
        setDeleteTarget(null);
        setDeleteOpen(false);
    };

    /** Сабмит из диалога — отправляем тело в DELETE */
    const handleDeleteSubmit = async (p: Omit<DeleteUserPayload, 'id'>) => {
        if (!deleteTarget) return;
        try {
            await deleteUser.mutateAsync({
                id: deleteTarget.id,
                distribute_to_agents: p.distribute_to_agents,
                agent_id: p.distribute_to_agents ? undefined : p.agent_id ?? undefined,
            });
            toast.success('Удалено');
            closeDeleteDialog();
        } catch (e) {
            showAxiosErrorToast(e, 'Не удалось удалить пользователя');
        }
    };

    return (
        <div className="p-6">
            <div className="mb-4 flex items-center justify-between">
                <h1 className="text-2xl font-bold">Пользователи</h1>
                <button
                    onClick={openCreate}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-[#0036A5] text-white hover:bg-blue-800 transition cursor-pointer"
                >
                    <Plus className="w-7 h-7"/>
                    <span className='hidden md:block'>Новый пользователь</span>
                </button>
            </div>

            {isLoading && <div className="text-gray-500">Загрузка…</div>}
            {error && <div className="text-red-500">Ошибка загрузки списка</div>}

            {!isLoading && !error && (
                <div className="bg-white rounded-xl shadow-sm">
                    {/* Заголовки (только на md+) */}
                    <div
                        className="hidden md:grid grid-cols-[72px_1.2fr_1fr_1fr_1fr_1fr_72px] px-5 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                        <div>ID</div>
                        <div>Имя</div>
                        <div>Телефон</div>
                        <div>Email</div>
                        <div>Роль</div>
                        <div>Филиал</div>
                        <div className="text-right pr-2">Действия</div>
                    </div>

                    {/* Список-«карточка» без линий */}
                    <ul>
                        {sorted.map((u) => (
                            <li
                                key={u.id}
                                className="px-5 py-4 md:grid md:grid-cols-[72px_1.2fr_1fr_1fr_1fr_1fr_72px] flex flex-col gap-2 md:gap-0 items-start md:items-center
                           transition hover:bg-gray-50 rounded-xl md:rounded-none border-b"
                            >
                                <div className="text-gray-900">{u.id}</div>
                                <div className="text-gray-900">{u.name}</div>
                                <div className="text-gray-700">{u.phone}</div>
                                <div className="text-gray-700">{u.email || '—'}</div>
                                <div className="text-gray-700">{u.role?.name || u.role_id}</div>
                                <div className="text-gray-700">{u.branch?.name || u.branch_id || '—'}</div>

                                <div className="ml-auto md:ml-0 flex items-center justify-end gap-2 w-full md:w-auto">
                                    <Link
                                        href={`/admin/users/${u.id}`}
                                        title="Показать"
                                        aria-label="Показать"
                                        className="p-2 rounded-md hover:bg-gray-100 text-gray-600 hover:text-gray-900 transition cursor-pointer"
                                    >
                                        <Eye className="w-4 h-4"/>
                                    </Link>
                                    <Link
                                        href={`/profile/reports/objects?interval=week&price_metric=sum&agent_id=${u.id}`}
                                        title="Показать отчет"
                                        aria-label="Показать отчет"
                                        className="p-2 rounded-md hover:bg-gray-100 text-gray-600 hover:text-gray-900 transition cursor-pointer"
                                    >
                                        <SquareChartGantt className="w-4 h-4"/>

                                    </Link>
                                    <button
                                        onClick={() => openEdit(u)}
                                        title="Редактировать"
                                        aria-label="Редактировать"
                                        className="p-2 rounded-md hover:bg-gray-100 text-gray-600 hover:text-gray-900 transition cursor-pointer"
                                    >
                                        <Pencil className="w-4 h-4"/>
                                    </button>
                                    <button
                                        onClick={() => openDeleteDialog(u)}
                                        title="Удалить"
                                        aria-label="Удалить"
                                        className="p-2 rounded-md hover:bg-red-50 text-red-600 hover:text-red-700 transition cursor-pointer"
                                    >
                                        <Trash2 className="w-4 h-4"/>
                                    </button>


                                </div>
                            </li>
                        ))}
                        {sorted.length === 0 && (
                            <li className="px-5 py-10 text-center text-gray-500">Нет пользователей</li>
                        )}
                    </ul>
                </div>
            )}

            {/* Drawer / Panel с анимацией */}
            <AnimatePresence>
                {isOpen && (
                    <>
                        {/* затемнение */}
                        <motion.button
                            type="button"
                            aria-label="Закрыть модальное окно"
                            onClick={closeForm}
                            className="fixed inset-0 bg-black/30 z-50"
                            initial={{opacity: 0}}
                            animate={{opacity: 1}}
                            exit={{opacity: 0}}
                        />
                        {/* панель */}
                        <motion.div
                            role="dialog"
                            aria-modal="true"
                            className="fixed right-0 top-0 h-full w-full max-w-[560px] bg-white/60 backdrop-blur supports-[backdrop-filter]:bg-white/60 z-50 shadow-xl md:rounded-l-3xl"
                            initial={{x: '100%'}}
                            animate={{x: 0}}
                            exit={{x: '100%'}}
                            transition={{type: 'spring', stiffness: 260, damping: 28}}
                        >
                            <div className="h-full flex flex-col p-6 overflow-y-auto pb-30 md:pb-0 ">
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-xl font-semibold">
                                        {mode === 'create' ? 'Создать пользователя' : `Редактировать: ${selected?.name ?? ''}`}
                                    </h2>
                                    <button onClick={closeForm} className="px-3 py-1 rounded-md border">
                                        Закрыть
                                    </button>
                                </div>

                                <UserForm
                                    mode={mode}
                                    initial={selected ?? undefined}
                                    onSubmit={mode === 'create' ? handleCreate : handleUpdate}
                                    onCancel={closeForm}
                                    isSubmitting={
                                        createUser.isPending ||
                                        updateUser.isPending ||
                                        uploadUserPhoto.isPending ||
                                        deleteUserPhoto.isPending
                                    }
                                />
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
            <DeleteUserDialog
                open={deleteOpen}
                onClose={closeDeleteDialog}
                user={deleteTarget}
                agents={agents}
                loadingAgents={loadingAgents}
                onConfirm={handleDeleteSubmit}
            />
        </div>
    );
}
