'use client';

import {useParams} from 'next/navigation';
import {useAgents, useDeleteUser, useDeleteUserPhoto, useUpdateUser, useUploadUserPhoto, useUser} from '@/services/users/hooks';
import UserForm, {type UserFormValues} from '../_components/UserForm';
import {toast} from 'react-toastify';
import type {DeleteUserPayload, UpdateUserPayload, UserDto} from '@/services/users/types';
import {useState} from "react";
import showAxiosErrorToast from "@/utils/showAxiosErrorToast";
import DeleteUserDialog from "@/app/admin/users/_components/DeleteUserDialog";

export default function UserDetails() {
    const {id} = useParams<{ id: string }>();
    const {data: user, isLoading, error} = useUser(Number(id));
    const upd = useUpdateUser();
    const uploadUserPhoto = useUploadUserPhoto();
    const deleteUserPhoto = useDeleteUserPhoto();
    const {data: agents, isLoading: loadingAgents} = useAgents();
    const deleteUser = useDeleteUser();
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<UserDto | null>(null);

    if (isLoading) return <div className="p-6">Загрузка…</div>;
    if (error || !user) return <div className="p-6 text-red-500">Ошибка или не найден</div>;

    const onSubmit = async (values: UserFormValues, photo?: File | null, shouldDeletePhoto?: boolean) => {
        try {
            const payload: UpdateUserPayload = {
                id: user.id,
                name: values.name,
                phone: values.phone,
                email: values.email,
                description: values.description,
                birthday: values.birthday,
                role_id: values.role_id === '' || values.role_id == null ? user.role_id : values.role_id,
                branch_id: values.branch_id === '' ? null : values.branch_id ?? null,
                password: values.password,
            };
            await upd.mutateAsync(payload);
            if (shouldDeletePhoto) {
                await deleteUserPhoto.mutateAsync({userId: user.id});
            } else if (photo) {
                await uploadUserPhoto.mutateAsync({userId: user.id, photo});
            }
            toast.success('Сохранено');
        } catch (err) {
            if (err instanceof Error) {
                toast.error(err.message);
            } else {
                toast.error('Ошибка');
            }
        }
    };

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

    const openDeleteDialog = (u: UserDto) => {
        setDeleteTarget(u);
        setDeleteOpen(true);
    };

    const closeDeleteDialog = () => {
        setDeleteTarget(null);
        setDeleteOpen(false);
    };

    return (
        <div className="p-6 w-full rounded-md bg-white">
            <div className="flex items-center justify-between mb-4">
                <h1 className="text-2xl font-bold">Пользователь #{user.id}</h1>
                <button
                    className="px-3 py-1 rounded-md border border-red-300 text-red-600"
                    onClick={() => openDeleteDialog(user)}
                >
                    Удалить
                </button>
            </div>
            <UserForm
                mode="edit"
                initial={user}
                onSubmit={onSubmit}
                onCancel={() => history.back()}
                isSubmitting={upd.isPending || uploadUserPhoto.isPending || deleteUserPhoto.isPending}
            />

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
