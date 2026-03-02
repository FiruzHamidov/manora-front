export type DealAgentPayload = {
    agent_id: number;
    role: 'main' | 'assistant' | 'partner';
    commission_amount?: number | null;
};

export interface UpdateModerationAndDealPayload {
    moderation_status: string;
    listing_type?: string;
    status_comment?: string;

    /**
     * =========================
     * 🟡 ЭТАП: ЗАЛОГ (deposit)
     * =========================
     */
    buyer_full_name?: string;
    buyer_phone?: string;

    deposit_amount?: number;
    deposit_currency?: 'TJS' | 'USD';
    deposit_received_at?: string | null;
    deposit_taken_at?: string | null;

    planned_contract_signed_at?: string | null;

    company_expected_income?: number;
    company_expected_income_currency?: 'TJS' | 'USD';

    money_holder?: 'company' | 'agent' | 'owner' | 'developer' | 'client';

    /**
     * =========================
     * 🟢 ЭТАП: ФИНАЛ СДЕЛКИ
     * =========================
     */
    actual_sale_price?: number;
    actual_sale_currency?: 'TJS' | 'USD';

    company_commission_amount?: number;
    company_commission_currency?: 'TJS' | 'USD';

    money_received_at?: string | null;
    contract_signed_at?: string | null;

    /**
     * =========================
     * 👥 АГЕНТЫ
     * =========================
     */
    agents?: DealAgentPayload[];
}