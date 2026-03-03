import { RoleSlug, canManageNewBuildings, isOwnerRole, isPlatformAdminRole } from '@/constants/roles';

export type ProfileMenuKey =
    | 'reports'
    | 'profile'
    | 'favorites'
    | 'myList'
    | 'allList'
    | 'moderation'
    | 'booking'
    | 'addPost'
    | 'users'
    | 'buildings'
    | 'branches'
    | 'crm';

export type ProfileMenuItem = {
    key: ProfileMenuKey;
    href: string;
    label: string;
    description: string;
};

export const PROFILE_MENU_ITEMS: Record<ProfileMenuKey, ProfileMenuItem> = {
    reports: {
        key: 'reports',
        href: '/profile/reports',
        label: 'Отчёты',
        description: 'Полная аналитика',
    },
    profile: {
        key: 'profile',
        href: '/profile',
        label: 'Профиль',
        description: 'Личный кабинет',
    },
    favorites: {
        key: 'favorites',
        href: '/profile/favorites',
        label: 'Избранное',
        description: 'Сохранённые объявления',
    },
    myList: {
        key: 'myList',
        href: '/profile/my-listings',
        label: 'Мои объявления',
        description: 'Добавление и управление',
    },
    allList: {
        key: 'allList',
        href: '/profile/all-listings',
        label: 'Все объявления',
        description: 'Общий список объявлений',
    },
    moderation: {
        key: 'moderation',
        href: '/profile/all-listings',
        label: 'Модерация',
        description: 'Проверка объявлений',
    },
    booking: {
        key: 'booking',
        href: '/profile/my-booking',
        label: 'Мои показы',
        description: 'Контроль записей на показ',
    },
    addPost: {
        key: 'addPost',
        href: '/profile/add-post',
        label: 'Добавить объявление',
        description: 'Разместить объект',
    },
    users: {
        key: 'users',
        href: '/admin/users',
        label: 'Пользователи',
        description: 'Управление пользователями',
    },
    buildings: {
        key: 'buildings',
        href: '/admin/new-buildings',
        label: 'Новостройки',
        description: 'Управление новостройками',
    },
    branches: {
        key: 'branches',
        href: '/admin/branches',
        label: 'Филиалы',
        description: 'Управление филиалами',
    },
    crm: {
        key: 'crm',
        href: '/admin/crm',
        label: 'CRM',
        description: 'Заявки и стадии',
    },
};

const ROLE_MENUS: Record<RoleSlug, ProfileMenuKey[]> = {
    admin: [
        'reports',
        'profile',
        'moderation',
        'allList',
        'myList',
        'buildings',
        'branches',
        'crm',
        'booking',
        'users',
        'favorites',
        'addPost',
    ],
    superadmin: [
        'reports',
        'profile',
        'moderation',
        'allList',
        'myList',
        'buildings',
        'branches',
        'crm',
        'booking',
        'users',
        'favorites',
        'addPost',
    ],
    moderator: ['profile', 'moderation', 'crm'],
    developer: ['buildings'],
    branch_admin: ['profile', 'myList', 'booking', 'addPost'],
    manager: ['profile', 'myList', 'booking', 'addPost'],
    operator: ['profile', 'myList'],
    rop: ['profile', 'myList', 'booking', 'addPost'],
    agent: ['profile', 'myList', 'booking', 'addPost'],
    user: ['profile', 'myList', 'addPost'],
    client: ['profile', 'myList', 'addPost'],
    guest: [],
};

export function getAuthorizedMenuItems(role: RoleSlug): ProfileMenuItem[] {
    return ROLE_MENUS[role]
        .filter((key) => {
            if (key === 'users' || key === 'branches') return isPlatformAdminRole(role);
            if (key === 'buildings') return canManageNewBuildings(role);
            if (key === 'reports') return isPlatformAdminRole(role);
            if (key === 'crm') return role === 'moderator' || isPlatformAdminRole(role);
            if (key === 'moderation') return role === 'moderator' || isPlatformAdminRole(role);
            if (key === 'addPost' || key === 'myList' || key === 'booking') {
                return (
                    isOwnerRole(role) ||
                    isPlatformAdminRole(role) ||
                    role === 'branch_admin' ||
                    role === 'manager' ||
                    role === 'rop'
                );
            }
            return true;
        })
        .map((key) => PROFILE_MENU_ITEMS[key]);
}
