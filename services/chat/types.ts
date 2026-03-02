export type ChatMessage = {
    id?: number;
    role: "system" | "user" | "assistant" | "tool";
    content: string | null;
    items?: PropertyCard[] | null;
    created_at?: string;
};

export type PropertyImage = {
    path: string;
    is_main?: boolean;
};

export type PropertyCard = {
    id: number;
    title: string | null;
    price: number;
    currency: string;
    city?: string | null;
    district?: string | null;
    rooms?: number | null;
    area?: number | null;
    url: string;

    // 👇 новый основной контракт
    photos: PropertyImage[];

    // 👇 fallback для старого кода (можно удалить позже)
    image?: string | null;

    badge?: string | null;
    type?: { id: number; name?: string | null; slug?: string | null } | number;
    created_at?: string;
    listing?: string | null;
    address?: string | null;
};

export type ChatHistoryResponse = {
    session_id: string;
    messages: ChatMessage[];
};

export type ChatPostResponse = {
    session_id: string;
    answer: string;
    items: PropertyCard[];
    locale?: string;
};