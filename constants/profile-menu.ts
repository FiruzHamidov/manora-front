import { type RoleSlug, canViewNewBuildings, isOwnerRole, isPlatformAdminRole } from './roles.ts';

export type ProfileMenuKey =
    | 'reports'
    | 'profile'
    | 'messages'
    | 'notifications'
    | 'content'
    | 'contentModeration'
    | 'favorites'
    | 'myList'
    | 'allList'
    | 'moderation'
    | 'booking'
    | 'addPost'
    | 'users'
    | 'buildings'
    | 'branches'
    | 'dictionaries'
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
    messages: {
        key: 'messages',
        href: '/profile/messages',
        label: 'Сообщения',
        description: 'Чаты и поддержка',
    },
    notifications: {
        key: 'notifications',
        href: '/profile/notifications',
        label: 'Уведомления',
        description: 'Статусы и важные события',
    },
    content: {
        key: 'content',
        href: '/profile/content',
        label: 'Мой контент',
        description: 'Рилсы и истории',
    },
    contentModeration: {
        key: 'contentModeration',
        href: '/admin/reels',
        label: 'Контент пользователей',
        description: 'Контроль рилсов и историй',
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
    dictionaries: {
        key: 'dictionaries',
        href: '/admin/dictionaries',
        label: 'Справочники',
        description: 'Настройка справочных данных',
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
        'messages',
        'notifications',
        'content',
        'moderation',
        'contentModeration',
        'allList',
        'myList',
        'buildings',
        'branches',
        'dictionaries',
        'crm',
        'booking',
        'users',
        'favorites',
        'addPost',
    ],
    superadmin: [
        'reports',
        'profile',
        'messages',
        'notifications',
        'content',
        'moderation',
        'contentModeration',
        'allList',
        'myList',
        'buildings',
        'branches',
        'dictionaries',
        'crm',
        'booking',
        'users',
        'favorites',
        'addPost',
    ],
    moderator: ['profile', 'messages', 'notifications', 'content', 'moderation', 'contentModeration', 'buildings', 'crm'],
    developer: ['buildings'],
    branch_admin: ['profile', 'messages', 'notifications', 'content', 'myList', 'booking', 'addPost'],
    manager: ['profile', 'messages', 'notifications', 'content', 'myList', 'booking', 'addPost'],
    operator: ['profile', 'messages', 'notifications', 'content', 'myList'],
    rop: ['profile', 'messages', 'notifications', 'content', 'myList', 'booking', 'addPost'],
    agent: ['profile', 'messages', 'notifications', 'content', 'myList', 'booking', 'addPost'],
    user: ['profile', 'messages', 'notifications', 'content', 'myList', 'addPost'],
    client: ['profile', 'messages', 'notifications', 'content', 'myList', 'addPost'],
    guest: [],
};

export function getAuthorizedMenuItems(role: RoleSlug): ProfileMenuItem[] {
    return ROLE_MENUS[role]
        .filter((key) => {
            if (key === 'users' || key === 'branches') return isPlatformAdminRole(role);
            if (key === 'dictionaries') return isPlatformAdminRole(role);
            if (key === 'buildings') return canViewNewBuildings(role);
            if (key === 'reports') return isPlatformAdminRole(role);
            if (key === 'crm') return role === 'moderator' || isPlatformAdminRole(role);
            if (key === 'moderation') return role === 'moderator' || isPlatformAdminRole(role);
            if (key === 'contentModeration') return role === 'moderator' || isPlatformAdminRole(role);
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
