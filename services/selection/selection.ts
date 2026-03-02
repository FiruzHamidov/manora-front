export type SelectionPublic = {
    id: number;                 // убедитесь, что backend /selections/public/{hash} возвращает id
    title?: string | null;
    note?: string | null;
    status: string;
    property_ids: number[];
};