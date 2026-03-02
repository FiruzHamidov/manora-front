export interface Image {
    url: string;
    alt?: string;
}

export interface Agent {
    name: string;
    role: string;
    avatarUrl?: string;
}

export interface Listing {
    id: number;
    __source?: 'local' | 'aura';
    imageUrl?: string;
    imageAlt?: string;
    moderation_status: string;
    offer_type: string;
    images?: Image[];
    isTop?: boolean;
    price: number;
    currency: string;
    title: string;
    listing_type: string;
    locationName: string;
    description: string;
    roomCountLabel: string;
    area: number;
    floorInfo: string;
    agent?: Agent;
    creator?: {
        id: number;
        name?: string;
        photo?: string;
        phone?: string;
    };
    date?: string;
    type?: string;
    typeName?: string;
    rejection_comment?: string;

    // Покупатель
    buyer_full_name?: string;
    buyer_phone?: string;

    // Планируемый договор
    planned_contract_signed_at?: string;

    // Доход / комиссия компании
    company_expected_income?: number | string;
    company_expected_income_currency?: 'TJS' | 'USD';

    company_commission_amount?: string | number;
    company_commission_currency?: 'TJS' | 'USD';

// === Deal / Sale fields ===
    actual_sale_price?: string | number;
    actual_sale_currency?: 'TJS' | 'USD';


    money_holder?: 'company' | 'agent' | 'owner' | 'developer' | 'client';

    money_received_at?: string;
    contract_signed_at?: string;

    // Deposit
    deposit_amount?: number;
    deposit_currency?: 'TJS' | 'USD';
    deposit_received_at?: string;
    deposit_taken_at?: string;

    // Agents involved in deal
    sale_agents?: Array<{
        id: number;
        name?: string;
        phone?: string;
        role: 'main' | 'assistant' | 'partner';
        agent_commission_amount?: string | number;
        agent_commission_currency?: 'TJS' | 'USD';
        agent_paid_at?: string;
    }>;
}
