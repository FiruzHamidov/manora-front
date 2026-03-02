'use client';

import {ChangeEvent, useEffect, useState} from 'react';
import Image from 'next/image';
import {useProfile, useUpdateProfileMutation} from '@/services/login/hooks';
import {useUploadUserPhoto} from '@/services/users/hooks';
import {toast} from 'react-toastify';
import {STORAGE_URL} from '@/constants/base-url';
import {Input} from "@/ui-components/Input";
import PasswordChangeModal from "@/app/profile/_components/PasswordChangeModal";
import {Camera, KeyRound, Trash2, Upload} from 'lucide-react';
import {axios} from "@/utils/axios";
import {AxiosError} from "axios";


export default function Profile() {
    const {data: user, isLoading, error} = useProfile();
    const updateProfileMutation = useUpdateProfileMutation();

    const [profileData, setProfileData] = useState({
        name: '',
        birthday: '',
        phone: '',
        description: '',
        email: '',
    });

    const getInitials = (fullName?: string) => {
        if (!fullName) return 'U';
        const parts = fullName.trim().split(/\s+/).filter(Boolean);
        const first = parts[0]?.[0] ?? '';
        const last = parts[1]?.[0] ?? '';
        return (first + last).toUpperCase() || first.toUpperCase() || 'U';
    };
    const [showPwdModal, setShowPwdModal] = useState(false);

    const [deletingPhoto, setDeletingPhoto] = useState(false);
    const [photoDeleted, setPhotoDeleted] = useState(false);
    const [photoVersion, setPhotoVersion] = useState(0);

    const profilePhoto = user?.photo ? `${STORAGE_URL}/${user.photo}?v=${photoVersion}` : '';

    const [uploading, setUploading] = useState(false);

    const addProfilePhotoMutation = useUploadUserPhoto();

    useEffect(() => {
        if (user) {
            setProfileData({
                name: user.name,
                description: user.description,
                birthday: user.birthday,
                phone: user.phone,
                email: user.email,
            });
            setPhotoDeleted(!user.photo);
        }
    }, [user]);

    const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const {name, value} = e.target;
        setProfileData({
            ...profileData,
            [name]: value,
        });
    };

    const handleSave = async () => {
        if (!user?.id) return;

        try {
            await updateProfileMutation.mutateAsync({
                userId: user.id,
                profileData: profileData,
            });
        } catch (error) {
            toast.error('Error updating profile: ' + error);
        }
    };

    const handleUpdatePhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!user?.id || !e.target.files || e.target.files.length === 0) return;
        const file = e.target.files[0];
        setUploading(true);
        try {
            await addProfilePhotoMutation.mutateAsync({
                userId: user.id,
                photo: file,
            });
            toast.success('Фото профиля обновлено!');
            setPhotoDeleted(false);
            setPhotoVersion(v => v + 1); // сброс кэша
        } catch (err) {
            const error = err as AxiosError<{ message?: string; errors?: Record<string, string[]> }>;
            toast.error('Ошибка при обновлении фото: ' + (error?.message ?? error));
        } finally {
            setUploading(false);
            e.currentTarget.value = '';
        }
    };

    const handleDeletePhoto = async () => {
        if (deletingPhoto) return;
        const ok = window.confirm('Удалить фото профиля?');
        if (!ok) return;

        setDeletingPhoto(true);
        try {
            await axios.delete('/user/photo');
            // оптимистично обновим UI
            setPhotoDeleted(true);
            setPhotoVersion(v => v + 1);
            toast.success('Фото удалено');
        } catch (err) {
            const error = err as AxiosError<{ message?: string; errors?: Record<string, string[]> }>;
            const msg =
                error?.response?.data?.message ||
                error?.message ||
                'Не удалось удалить фото';
            toast.error(msg);
        } finally {
            setDeletingPhoto(false);
        }
    };

    if (isLoading) {
        return (
            <div className="bg-white rounded-lg p-8 w-full">
                <div className="flex justify-center items-center h-64">
                    <div className="text-gray-500">Загрузка...</div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-white rounded-lg p-8 w-full">
                <div className="flex justify-center items-center h-64">
                    <div className="text-red-500">Ошибка загрузки профиля</div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg p-8 w-full">
            <h1 className="text-2xl font-bold mb-8">Профиль</h1>

            <div className="mb-8 max-w-[720px]">
                <div className="flex items-center gap-4 md:gap-6 flex-wrap">
                    {/* Avatar */}
                    <div className="relative shrink-0">
                        <div
                            className="w-[72px] h-[72px] md:w-[84px] md:h-[84px] rounded-full overflow-hidden ring-2 ring-white shadow-sm">
                            {/* если фото удалено/нет — показываем инициалы */}
                            {photoDeleted || !user?.photo ? (
                                <div className="w-full h-full bg-[#0036A5] flex items-center justify-center">
        <span className="text-white text-xl md:text-2xl font-bold">
          {getInitials(user?.name)}
        </span>
                                </div>
                            ) : (
                                <Image
                                    src={profilePhoto}
                                    alt="Фото профиля"
                                    width={84}
                                    height={84}
                                    className="w-full h-full object-cover"
                                    onError={() => setPhotoDeleted(true)} // если картинка не грузится — уйдём на инициалы
                                    priority
                                />
                            )}
                        </div>

                        {/* Клик по аватару = загрузка фото */}
                        <label
                            htmlFor="profile-photo-input"
                            className="group absolute inset-0 rounded-full cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0036A5]"
                            title="Обновить фото"
                        >
                            <input
                                id="profile-photo-input"
                                type="file"
                                accept="image/*"
                                onChange={handleUpdatePhoto}
                                className="hidden"
                                disabled={uploading}
                            />
                            <span className="sr-only">Загрузить новое фото</span>

                            {/* Полупрозрачный оверлей с камерой (и для фото, и для инициалов) */}
                            <div
                                className={`absolute inset-0 rounded-full bg-black/0 group-hover:bg-black/30 transition
        ${uploading ? 'bg-black/20' : ''} flex items-center justify-center`}
                            >
                                <Camera
                                    className={`transition transform opacity-0 scale-75 group-hover:opacity-100 group-hover:scale-100 text-white
          ${uploading ? 'opacity-100' : ''}`}
                                    size={22}
                                    aria-hidden
                                />
                            </div>
                        </label>
                    </div>
                    <h2 className="text-xl font-semibold text-gray-900 md:hidden">
                        {user?.name}
                    </h2>

                    <div className='flex flex-col gap-1'>
                        <h2 className="text-xl font-semibold text-gray-900 hidden md:block">
                            {user?.name}
                        </h2>
                        {/* Actions */}
                        <div className="flex-1 min-w-[240px] flex flex-wrap items-center gap-2">
                            {/* Upload */}
                            <label
                                htmlFor="profile-photo-input"
                                className={`inline-flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium
                                  border transition select-none
                                  ${uploading
                                    ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                                    : 'bg-[#E8F6FF] text-[#0036A5] border-[#CFEBFF] hover:bg-[#d9f0ff]'}`}
                            >
                                <Upload className="w-4 h-4"/>
                                {uploading ? 'Загрузка…' : 'Обновить фото'}
                            </label>

                            {/* Delete */}
                            <button
                                type="button"
                                onClick={handleDeletePhoto}
                                disabled={deletingPhoto || photoDeleted}
                                className={`inline-flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium border transition
                        ${deletingPhoto || photoDeleted
                                    ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                                    : 'bg-[#FFE9EA] text-[#C21E1E] border-[#FFD2D5] hover:bg-[#ffdfe1]'}`}
                                title={photoDeleted ? 'Фото уже удалено' : 'Удалить фото'}
                            >
                                <Trash2 className="w-4 h-4"/>
                                {deletingPhoto ? 'Удаление…' : 'Удалить фото'}
                            </button>

                            {/* Change password */}
                            <button
                                type="button"
                                onClick={() => setShowPwdModal(true)}
                                className="inline-flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium
                           border bg-[#E8F6FF] text-[#0036A5] border-[#CFEBFF] hover:bg-[#d9f0ff]
                           transition"
                            >
                                <KeyRound className="w-4 h-4"/>
                                Сменить пароль
                            </button>
                        </div>
                    </div>


                </div>
            </div>

            {/* Form Fields */}
            <div className="grid gap-6 max-w-[390px]">
                <div>
                <label className="block mb-2 text-sm text-gray-600">Имя</label>
                    <input
                        type="text"
                        name="name"
                        value={profileData.name}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 rounded-md bg-gray-50"
                    />
                </div>

                <div>
                    <label className="block mb-2 text-sm text-gray-600">
                        Дата рождения
                    </label>
                    <input
                        type="date"
                        name="birthday"
                        value={profileData.birthday}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 rounded-md bg-gray-50"
                    />
                </div>

                <div>
                    <label className="block mb-2 text-sm text-gray-600">
                        Номер телефона
                    </label>
                    <input
                        type="text"
                        name="phone"
                        value={profileData.phone}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 rounded-md bg-gray-50"
                    />
                </div>

                <div>
                    <label className="block mb-2 text-sm text-gray-600">Email</label>
                    <input
                        type="email"
                        name="email"
                        value={profileData.email}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 rounded-md bg-gray-50"
                    />
                </div>

                <div>
                    <Input
                        label="Описание"
                        name="description"
                        value={profileData.description}
                        textarea
                        onChange={handleInputChange}
                        placeholder="Подробное описание ..."
                        className="mt-4"
                    />
                </div>

                <div className="mt-2 flex gap-3">
                    <button
                        onClick={handleSave}
                        disabled={updateProfileMutation.isPending}
                        className="w-full py-3 px-4 bg-[#0036A5] text-white rounded-md hover:bg-blue-800 transition disabled:opacity-50"
                    >
                        {updateProfileMutation.isPending ? 'Сохранение...' : 'Сохранить'}
                    </button>
                </div>
                {/* Модалка смены пароля */}
                <PasswordChangeModal open={showPwdModal} onClose={() => setShowPwdModal(false)}/>
            </div>
        </div>
    );
}
