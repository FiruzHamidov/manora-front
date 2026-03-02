import { axios, getAuthToken } from "@/utils/axios";

export type TimeSeriesRow = { bucket: string; total: number; closed: number };
export type PriceBucketRow = { bucket: number; from: number; to: number; count: number };
export type PriceBucketsResponse = { range: [number, number]; buckets: PriceBucketRow[] };
export type RoomsRow = { rooms: number; cnt: number };

export type SummaryResponse = {
    total: number;
    by_status: { moderation_status: string; cnt: number }[];
    sold_status: { moderation_status: string; cnt: number }[];
    by_offer_type: { offer_type: string; cnt: number }[];
    avg_price: number;
    avg_total_area: number;
    published_rent: number;
    published_sale: number;
    sum_price: number;        // NEW
    sum_total_area: number;   // NEW
};

export type ManagerEfficiencyRow = {
    id: number | null;
    name: string;
    agent_id: string;
    email?: string | null;
    total: number;
    approved: number;
    sold: number;
    sold_by_owner: number;
    rented: number;
    close_rate: number;
    avg_price?: number; // либо
    sum_price?: number; // одно из них придёт в зависимости от price_metric
    sum_total_area?: number;
};

export type AgentsLeaderboardRow = {
    agent_name: string;
    agent_id: string;
    total: number;
    closed: number; // можно оставить для совместимости
    sold_count: number;
    rented_count: number;
    sold_by_owner_count: number;
    sum_price?: number;
    avg_price?: number;
};

export type ConversionFunnel = {
    draft: number;
    pending: number;
    approved: number;
    rejected: number;
    closed: number; // sold+rented
};

// Универсальные распределения (by-status/type/location)
export type DistRow = Record<string, any> & { cnt: number };

/** Booking agents report row */
export type BookingAgentRow = {
    agent_id: number;
    agent_name: string;
    shows_count: number;
    total_minutes: number;
    unique_clients: number;
    unique_properties: number;
    first_show: string | null;
    last_show: string | null;
};

/** Agent properties report */
export type AgentPropertiesReport = {
    agent_id: number;
    agent_name: string;
    summary: {
        total_properties: number;
        total_shows: number;
        by_status: Record<string, number>;
    };
    properties: {
        id: number;
        title: string;
        price: number | null;
        currency: string | null;
        moderation_status: string | null;
        shows_count: number;
        first_show: string | null;
        last_show: string | null;
    }[];
};

/** ---------- Параметры запросов ---------- */
export type ReportsQuery = {
    // даты
    date_from?: string; // 'YYYY-MM-DD'
    date_to?: string;   // 'YYYY-MM-DD'
    sold_at_to?: string;   // 'YYYY-MM-DD'
    sold_at_from?: string;   // 'YYYY-MM-DD'
    price_metric?: string;   // 'sum' | 'avg'
    date_field?: "created_at" | "updated_at";
    interval?: "day" | "week" | "month";

    // мультиселекты и фильтры
    type_id?: (string | number)[];
    status_id?: (string | number)[];
    location_id?: (string | number)[];
    repair_type_id?: (string | number)[];
    currency?: (string | number)[];
    offer_type?: (string | number)[];
    listing_type?: (string | number)[];
    contract_type_id?: (string | number)[];
    created_by?: (string | number)[];
    agent_id?: (string | number)[] | string | number;
    branch_id?: (string | number)[] | string | number;
    moderation_status?: (string | number)[];
    district?: (string | number)[];

    // диапазоны
    priceFrom?: number | string;
    priceTo?: number | string;
    roomsFrom?: number | string;
    roomsTo?: number | string;
    total_areaFrom?: number | string;
    total_areaTo?: number | string;
    living_areaFrom?: number | string;
    living_areaTo?: number | string;
    floorFrom?: number | string;
    floorTo?: number | string;
    total_floorsFrom?: number | string;
    total_floorsTo?: number | string;
    year_builtFrom?: number | string;
    year_builtTo?: number | string;

    // спец-параметры отдельных эндпоинтов
    buckets?: number; // price-buckets
    limit?: number;   // agents-leaderboard
    group_by?: "agent_id" | "created_by"; // manager-efficiency
    month?: string; // YYYY-MM for monthly-comparison
    from_month?: string; // YYYY-MM for monthly-comparison-range
    to_month?: string; // YYYY-MM for monthly-comparison-range
};

export type MissingPhoneAgentRow = {
    agent_id: number;
    agent_name: string;
    agent_email?: string | null;
    moderation_status: string | null;
    missing_phone: number;       // шт. без телефона в этом статусе
    bucket_total: number;        // всего объектов у агента в этом статусе
    missing_share_pct: number;   // доля, %
};

export type MissingPhoneListItem = {
    id: number;
    title: string | null;
    address: string | null;
    moderation_status: string | null;
    created_by: number;
    created_by_name: string;
    agent_id: number | null;
    created_at: string;
    updated_at: string;
    price: number | null;
    currency: string | null;
    owner_name: string | null;
    owner_phone: string | null;
};

export type MissingPhoneListResponse = {
    data: MissingPhoneListItem[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
};

export type MonthlyComparisonKpi = {
    added_total: number;
    added_sale_total?: number;
    added_rent_total?: number;
    published_sale_total?: number;
    published_rent_total?: number;
    closed_total: number;
    closed_sale_total?: number;
    closed_rent_total?: number;
    sold_total: number;
    sold_by_agent_total?: number;
    rented_total: number;
    sold_by_owner_total: number;
    deposit_total: number;
    shows_total: number;
};

export type MonthlyComparisonLeader = {
    agent_id: number | null;
    agent_name: string;
    value: number;
};

export type MonthlyComparisonDiffItem = {
    previous: number;
    current: number;
    delta: number;
    delta_pct: number | null;
};

export type MonthlyComparisonMonthBlock = {
    period?: {
        from?: string;
        to?: string;
    };
    kpi?: MonthlyComparisonKpi;
    leaders?: {
        by_shows?: MonthlyComparisonLeader[];
        by_added?: MonthlyComparisonLeader[];
        by_closed?: MonthlyComparisonLeader[];
        by_sold_agent?: MonthlyComparisonLeader[];
        by_rented?: MonthlyComparisonLeader[];
    };
};

export type MonthlyComparisonResponse = {
    comparison_for?: string;
    previous_month?: string | MonthlyComparisonMonthBlock;
    current_month?: string | MonthlyComparisonMonthBlock;
    kpi?: {
        previous_month?: MonthlyComparisonKpi;
        current_month?: MonthlyComparisonKpi;
    };
    leaders?: {
        by_shows?: MonthlyComparisonLeader[];
        by_added?: MonthlyComparisonLeader[];
        by_closed?: MonthlyComparisonLeader[];
        by_sold_agent?: MonthlyComparisonLeader[];
        by_rented?: MonthlyComparisonLeader[];
    };
    diff?: Record<string, MonthlyComparisonDiffItem>;
};

export type MonthlyComparisonRangeResponse = {
    from_month: string;
    to_month: string;
    from: MonthlyComparisonMonthBlock;
    to: MonthlyComparisonMonthBlock;
    diff?: Record<string, MonthlyComparisonDiffItem>;
};

/** ---------- Вспомогалки ---------- */
function buildParams(q?: ReportsQuery) {
    const params: Record<string, any> = {};
    if (!q) return params;

    const set = (k: string, v: any) => {
        if (v === undefined || v === null || v === "") return;
        if (Array.isArray(v)) params[k] = v.join(",");
        else params[k] = v;
    };

    Object.entries(q).forEach(([k, v]) => set(k, v));
    return params;
}

function authHeaders() {
    const token = getAuthToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
}

/** ---------- Константы эндпоинтов ---------- */
/* ВНИМАНИЕ: baseURL уже содержит /api в твоём axios, поэтому тут без /api в начале */
const REPORTS = {
    SUMMARY: "/reports/properties/summary",
    MANAGER_EFF: "/reports/properties/manager-efficiency",
    BY_STATUS: "/reports/properties/by-status",
    BY_TYPE: "/reports/properties/by-type",
    BY_LOCATION: "/reports/properties/by-location",
    TIME_SERIES: "/reports/properties/time-series",
    PRICE_BUCKETS: "/reports/properties/price-buckets",
    ROOMS_HIST: "/reports/properties/rooms-hist",
    AGENTS_LEADERBOARD: "/reports/properties/agents-leaderboard",
    CONVERSION: "/reports/properties/conversion",
    // bookings endpoint (external to reports namespace)
    BOOKINGS_AGENTS: "/bookings/agents-report",
    AGENT_PROPERTIES_LIST: "/reports/agents/properties",
    AGENT_PROPERTIES: "/reports/agents/:agent/properties",
    AGENT_CONTRACTS: "/reports/agent/contracts",
    AGENT_CLIENTS: "/reports/agent/clients",
    AGENT_SHOWS: "/reports/agent/shows",
    AGENT_EARNINGS: "/reports/agent/earnings",
    MONTHLY_COMPARISON: "/reports/properties/monthly-comparison",
    MONTHLY_COMPARISON_RANGE: "/reports/properties/monthly-comparison-range",
} as const;

/** ---------- Методы API (с явным токеном в headers) ---------- */
export const reportsApi = {
    summary: async (query?: ReportsQuery): Promise<SummaryResponse> => {
        const { data } = await axios.get<SummaryResponse>(REPORTS.SUMMARY, {
            params: buildParams(query),
            headers: authHeaders(),
        });
        return data;
    },

    managerEfficiency: async (query?: ReportsQuery): Promise<ManagerEfficiencyRow[]> => {
        const { data } = await axios.get<ManagerEfficiencyRow[]>(REPORTS.MANAGER_EFF, {
            params: buildParams(query),
            headers: authHeaders(),
        });
        return data;
    },

    byStatus: async (query?: ReportsQuery): Promise<DistRow[]> => {
        const { data } = await axios.get<DistRow[]>(REPORTS.BY_STATUS, {
            params: buildParams(query),
            headers: authHeaders(),
        });
        return data;
    },

    byType: async (query?: ReportsQuery): Promise<DistRow[]> => {
        const { data } = await axios.get<DistRow[]>(REPORTS.BY_TYPE, {
            params: buildParams(query),
            headers: authHeaders(),
        });
        return data;
    },

    byLocation: async (query?: ReportsQuery): Promise<DistRow[]> => {
        const { data } = await axios.get<DistRow[]>(REPORTS.BY_LOCATION, {
            params: buildParams(query),
            headers: authHeaders(),
        });
        return data;
    },

    timeSeries: async (query?: ReportsQuery): Promise<TimeSeriesRow[]> => {
        const { data } = await axios.get<TimeSeriesRow[]>(REPORTS.TIME_SERIES, {
            params: buildParams(query),
            headers: authHeaders(),
        });
        return data;
    },

    priceBuckets: async (query?: ReportsQuery): Promise<PriceBucketsResponse> => {
        const { data } = await axios.get<PriceBucketsResponse>(REPORTS.PRICE_BUCKETS, {
            params: buildParams(query),
            headers: authHeaders(),
        });
        return data;
    },

    roomsHist: async (query?: ReportsQuery): Promise<RoomsRow[]> => {
        const { data } = await axios.get<RoomsRow[]>(REPORTS.ROOMS_HIST, {
            params: buildParams(query),
            headers: authHeaders(),
        });
        return data;
    },

    agentsLeaderboard: async (query?: ReportsQuery): Promise<AgentsLeaderboardRow[]> => {
        const { data } = await axios.get<AgentsLeaderboardRow[]>(REPORTS.AGENTS_LEADERBOARD, {
            params: buildParams(query),
            headers: authHeaders(),
        });
        return data;
    },

    conversion: async (query?: ReportsQuery): Promise<ConversionFunnel> => {
        const { data } = await axios.get<ConversionFunnel>(REPORTS.CONVERSION, {
            params: buildParams(query),
            headers: authHeaders(),
        });
        return data;
    },

    /** --- Недостающие телефоны: агрегат по агентам и статусам --- */
    missingPhoneAgentsByStatus: async (query?: ReportsQuery): Promise<MissingPhoneAgentRow[]> => {
        const { data } = await axios.get<MissingPhoneAgentRow[]>('/reports/missing-phone/agents-by-status', {
            params: buildParams(query),
            headers: authHeaders(),
        });
        return data;
    },

    /** --- Недостающие телефоны: список объектов --- */
    missingPhoneList: async (
        query?: ReportsQuery & { page?: number; per_page?: number }
    ): Promise<MissingPhoneListResponse> => {
        const { data } = await axios.get<MissingPhoneListResponse>('/reports/missing-phone/list', {
            params: buildParams(query),
            headers: authHeaders(),
        });
        return data;
    },

    /** --- Показы по агентам (из BookingController) --- */
    bookingsAgentsReport: async (query?: ReportsQuery): Promise<BookingAgentRow[]> => {
        // build params manually because backend expects `from`/`to` and single agent_id
        const params: Record<string, any> = {};
        if (query?.date_from) params.from = query.date_from;
        if (query?.date_to) params.to = query.date_to;

        if (query?.agent_id !== undefined && query?.agent_id !== null) {
            if (Array.isArray(query.agent_id)) {
                // take first agent if array provided (server currently expects one id)
                if (query.agent_id.length) params.agent_id = String(query.agent_id[0]);
            } else {
                params.agent_id = String(query.agent_id);
            }
        }
        if (query?.branch_id !== undefined && query?.branch_id !== null) {
            if (Array.isArray(query.branch_id)) {
                if (query.branch_id.length) params.branch_id = String(query.branch_id[0]);
            } else {
                params.branch_id = String(query.branch_id);
            }
        }

        const { data } = await axios.get<BookingAgentRow[]>(REPORTS.BOOKINGS_AGENTS, {
            params,
            headers: authHeaders(),
        });
        return data;
    },

    /** --- Отчёт по агенту: объекты + показы + статусы --- */
    agentPropertiesReport: async (
        query?: ReportsQuery & { agent?: string | number }
    ): Promise<AgentPropertiesReport | AgentPropertiesReport[]> => {
        const params: Record<string, any> = {};
        if (query?.date_from) params.from = query.date_from;
        if (query?.date_to) params.to = query.date_to;

        // support optional extra filters that backend accepts (type_id, location_id)
        if (query?.type_id && Array.isArray(query.type_id) && query.type_id.length) params.type_id = query.type_id.join(',');
        if (query?.location_id && Array.isArray(query.location_id) && query.location_id.length) params.location_id = query.location_id.join(',');
        if (query?.branch_id !== undefined && query?.branch_id !== null) {
            if (Array.isArray(query.branch_id)) {
                if (query.branch_id.length) params.branch_id = String(query.branch_id[0]);
            } else {
                params.branch_id = String(query.branch_id);
            }
        }

        // If agent is provided -> fetch single-agent report
        if (query?.agent !== undefined && query?.agent !== null) {
            const url = REPORTS.AGENT_PROPERTIES.replace(":agent", String(query.agent));
            const { data } = await axios.get<AgentPropertiesReport>(url, {
                params,
                headers: authHeaders(),
            });
            return data;
        }

        // Otherwise fetch aggregated report for all agents (backend returns array)
        const { data } = await axios.get<AgentPropertiesReport[]>(REPORTS.AGENT_PROPERTIES_LIST, {
            params,
            headers: authHeaders(),
        });
        return data;
    },

    /** --- Агент: договоры --- */
    agentContractsStats: async (
        query?: ReportsQuery
    ): Promise<{ contract_type: string; count: number }[]> => {
        const { data } = await axios.get<{ contract_type: string; count: number }[]>(
            REPORTS.AGENT_CONTRACTS,
            {
                params: buildParams(query),
                headers: authHeaders(),
            }
        );
        return data;
    },

    /** --- Агент: клиенты --- */
    agentClientsStats: async (
        query?: ReportsQuery
    ): Promise<{ unique_clients: number; business_clients: number }> => {
        const { data } = await axios.get<{ unique_clients: number; business_clients: number }>(
            REPORTS.AGENT_CLIENTS,
            {
                params: buildParams(query),
                headers: authHeaders(),
            }
        );
        return data;
    },

    /** --- Агент: показы --- */
    agentShowsStats: async (
        query?: ReportsQuery
    ): Promise<{ shows_count: number }> => {
        const { data } = await axios.get<{ shows_count: number }>(
            REPORTS.AGENT_SHOWS,
            {
                params: buildParams(query),
                headers: authHeaders(),
            }
        );
        return data;
    },

    /** --- Агент: заработок --- */
    agentEarningsReport: async (
        query?: ReportsQuery & { commission_pct?: number }
    ): Promise<{ sum_price: number; earnings: number; closed_count: number }> => {
        const { data } = await axios.get<{ sum_price: number; earnings: number; closed_count: number }>(
            REPORTS.AGENT_EARNINGS,
            {
                params: buildParams(query),
                headers: authHeaders(),
            }
        );
        return data;
    },

    monthlyComparison: async (
        query?: ReportsQuery
    ): Promise<MonthlyComparisonResponse> => {
        const { data } = await axios.get<MonthlyComparisonResponse>(
            REPORTS.MONTHLY_COMPARISON,
            {
                params: buildParams(query),
                headers: authHeaders(),
            }
        );
        return data;
    },

    monthlyComparisonRange: async (
        query?: ReportsQuery
    ): Promise<MonthlyComparisonRangeResponse> => {
        const { data } = await axios.get<MonthlyComparisonRangeResponse>(
            REPORTS.MONTHLY_COMPARISON_RANGE,
            {
                params: buildParams(query),
                headers: authHeaders(),
            }
        );
        return data;
    },
};
