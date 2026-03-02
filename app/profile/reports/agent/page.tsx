'use client'

import {useCallback, useEffect, useMemo, useState} from 'react';
import dayjs from 'dayjs';
import {usePathname, useRouter, useSearchParams} from 'next/navigation';
import {
    AgentsLeaderboardRow,
    ManagerEfficiencyRow,
    reportsApi,
    ReportsQuery,
    RoomsRow,
    SummaryResponse,
    TimeSeriesRow,
} from '@/services/reports/api';
import {PieStatus} from '../_charts';
import {MultiSelect} from '@/ui-components/MultiSelect';
import {Button} from '@/ui-components/Button';
import {Input} from '@/ui-components/Input';
import Link from "next/link";
import {useGetAgentsQuery} from "@/services/users/hooks";
import {Select} from "@/ui-components/Select";
import {Property, PropertyFilters} from "@/services/properties/types";
import {buildTitle} from "@/utils/helpers";
import {Edit2, EditIcon, Ellipsis, EyeIcon, HistoryIcon} from "lucide-react";
import {useProfile} from "@/services/login/hooks";
import {useGetAllPropertiesQuery} from "@/services/properties/hooks";
import {axios} from "@/utils/axios";
import {useBranches} from "@/services/branches/hooks";
import {ReportsNavigation} from "../_components/ReportsNavigation";

type Agent = { id: number; name: string };


const detectPeriodPreset = (from?: string, to?: string): PeriodPreset => {
    if (!from && !to) return 'all';

    const f = dayjs(from);
    const t = dayjs(to);
    const today = dayjs();

    if (!f.isValid() || !t.isValid()) return 'all';

    if (f.isSame(today, 'day') && t.isSame(today, 'day')) {
        return 'today';
    }

    if (
        f.isSame(today.startOf('week'), 'day') &&
        t.isSame(today.endOf('week'), 'day')
    ) {
        return 'week';
    }

    if (
        f.isSame(today.startOf('month'), 'day') &&
        t.isSame(today.endOf('month'), 'day')
    ) {
        return 'month';
    }

    return 'range';
};

// Маппинг UI-пресетов периода к API-интервалу
const presetToInterval = (preset: PeriodPreset): FilterState['interval'] => {
    switch (preset) {
        case 'today':
            return 'day';
        case 'week':
            return 'week';
        case 'month':
        case 'prev_month':
            return 'month';
        default:
            return 'week'; // all / range
    }
};

type FilterState = {
    date_from: string;
    date_to: string;
    interval: 'day' | 'week' | 'month';
    offer_type: (string | number)[];
    moderation_status: (string | number)[];
    type_id: (string | number)[];
    location_id: (string | number)[];
    agent_id: string;
    branch_id: string;
    created_by: string;
    sold_at_from: string;
    sold_at_to: string;
};

type PriceMetric = 'sum' | 'avg';

type WithMetrics = { sum_price?: number; avg_price?: number };
// type SummaryUnion = SummaryResponse & { sum_price?: number; sum_total_area?: number };

type PeriodPreset =
    | 'all'
    | 'today'
    | 'week'
    | 'month'
    | 'prev_month'
    | 'range';

const STATUS_OPTIONS = [
    {label: 'Черновик', value: 'draft'},
    {label: 'Ожидание', value: 'pending'},
    {label: 'Одобрено/Опубликовано', value: 'approved'},
    {label: 'Отклонено', value: 'rejected'},
    {label: 'Продано агентом', value: 'sold'},
    {label: 'Продано владельцем', value: 'sold_by_owner'},
    {label: 'Арендовано', value: 'rented'},
    {label: 'Удалено', value: 'deleted'},
    {label: 'Отказано владельцем', value: 'denied'},
    {label: 'Залог', value: 'deposit'},
];

// const OFFER_OPTIONS = [
//     {label: 'На продажу', value: 'sale'},
//     {label: 'На Аренду', value: 'rent'},
// ];


const OFFER_LABELS: Record<string, string> = {
    sale: 'На продажу',
    rent: 'На Аренду',
};

const STATUS_LABELS: Record<string, string> = Object.fromEntries(
    STATUS_OPTIONS.map(o => [String(o.value), o.label])
);

const statusLabel = (v?: string | null) =>
    v ? (STATUS_LABELS[v] ?? v) : '—';

const offerLabel = (v?: string | null) => (v ? (OFFER_LABELS[v] ?? v) : '—');

// Booking agent row (already present in api types)
type BookingAgentRow = {
    agent_id: number;
    agent_name: string;
    shows_count: number;
    total_minutes: number;
    unique_clients: number;
    unique_properties: number;
    first_show: string | null;
    last_show: string | null;
};

// Agent properties report types (matches backend)
type AgentPropertiesReport = {
    agent_id: number;
    agent_name: string;
    summary: {
        total_properties: number;
        total_shows: number;
        by_status: Record<string, number>;
        contracts: Record<string, number>;
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

type Booking = {
    id: number;
    property_id: number;
    agent_id: number | null;
    client_name?: string | null;
    client_phone?: string | null;
    start_time?: string | null; // backend returns times already converted to Asia/Dushanbe
    end_time?: string | null;
    note?: string | null;
    property: Property;
    agent?: Agent | null;
};

export default function ReportsPage() {
    const {data: user} = useProfile();
    const isSuperAdmin = user?.role?.slug === 'superadmin';

    const [openMenuId, setOpenMenuId] = useState<number | null>(null);
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [editing, setEditing] = useState<Booking | null>(null);
    const openEdit = useCallback((b: Booking) => setEditing(b), []);
    const [filters, setFilters] = useState<FilterState>({
        date_from: '',
        date_to: '',
        interval: 'week',
        offer_type: [],
        moderation_status: [],
        type_id: [],
        location_id: [],
        agent_id: '',
        branch_id: '',
        created_by: '',
        sold_at_from: '',
        sold_at_to: '',
    });

    const {data: currentUser} = useProfile();
    type UserRole = 'admin' | 'agent' | 'superadmin' | 'client';
    const userRole = currentUser?.role?.slug as UserRole | undefined;
    const ADMIN_ROLES: readonly UserRole[] = ['admin', 'superadmin'];
    const isAdminUser = ADMIN_ROLES.includes(userRole ?? 'client');

    const {data: agents} = useGetAgentsQuery();
    const {data: branches} = useBranches();

    const AGENT_OPTIONS = useMemo(
        () =>
            (agents ?? []).map((a) => ({
                id: a.id,
                name: a.name || `ID ${a.id}`,
            })),
        [agents]
    );

    // --- URL sync for filters (serialize <-> query params) ---
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const serializeFilters = (f: FilterState) => {
        const p = new URLSearchParams();
        if (f.date_from) p.set('date_from', f.date_from);
        if (f.date_to) p.set('date_to', f.date_to);
        if (f.interval) p.set('interval', f.interval);
        if (f.offer_type && f.offer_type.length) p.set('offer_type', f.offer_type.join(','));
        if (f.moderation_status && f.moderation_status.length) p.set('moderation_status', f.moderation_status.join(','));
        if (f.type_id && f.type_id.length) p.set('type_id', f.type_id.join(','));
        if (f.location_id && f.location_id.length) p.set('location_id', f.location_id.join(','));
        if (f.agent_id) p.set('agent_id', f.agent_id);
        if (f.branch_id) p.set('branch_id', f.branch_id);
        if (f.sold_at_from) p.set('sold_at_from', f.sold_at_from);
        if (f.sold_at_to) p.set('sold_at_to', f.sold_at_to);
        return p;
    };

    const [openRow, setOpenRow] = useState<number | null>(null);


    const parseArray = (v: string | null | undefined) => (v ? v.split(',').map((x) => x) : []);
    // when query params change we want to auto-run the `load()` after filters are restored
    const [pendingLoadFromUrl, setPendingLoadFromUrl] = useState(false);

    const buildQuery = () => {
        const params = new URLSearchParams();

        if (filters.date_from) params.set('date_from', filters.date_from);
        if (filters.date_to) params.set('date_to', filters.date_to);

        // агент: если не админ — всегда текущий пользователь
        const effectiveAgentId =
            currentUser && !isAdminUser
                ? String(currentUser.id)
                : filters.agent_id;

        if (effectiveAgentId) params.set('agent_id', effectiveAgentId);

        if (filters.offer_type.length)
            params.set('offer_type', filters.offer_type.join(','));

        if (filters.moderation_status.length)
            params.set('moderation_status', filters.moderation_status.join(','));

        if (filters.type_id.length)
            params.set('type_id', filters.type_id.join(','));

        if (filters.location_id.length)
            params.set('location_id', filters.location_id.join(','));
        if (filters.branch_id)
            params.set('branch_id', filters.branch_id);

        if (filters.sold_at_from)
            params.set('sold_at_from', filters.sold_at_from);

        if (filters.sold_at_to)
            params.set('sold_at_to', filters.sold_at_to);

        return params.toString();
    };

    const apply = async () => {
        setLoading(true);
        setError(null);
        try {
            const qs = buildQuery();
            // backend accepts date_from/date_to (or from/to)
            const url = `/bookings?${qs}`;
            const res = await axios.get(url);
            // controller returns a collection (array) — if you use pagination adjust accordingly
            setBookings(Array.isArray(res.data) ? res.data : (res.data?.data ?? []));
            // update only the URL search params without navigating the app
            // if we're running in a browser, use history.replaceState to avoid triggering a route change
            if (typeof window !== 'undefined') {
                const newUrl = qs ? `${window.location.pathname}?${qs}` : window.location.pathname;
                window.history.replaceState({}, '', newUrl);
            } else {
                // fallback for environments without window (safe no-op)
                try {
                    router.replace(`/profile/reports/bookings?${qs}`);
                } catch (e) { /* noop */
                }
            }
        } catch (e: unknown) {
            console.error('bookings load failed', e);
            // safe extraction of message from unknown error
            let errMsg = 'Ошибка загрузки показов';
            if (e instanceof Error) errMsg = e.message;
            if (typeof e === 'object' && e !== null && 'message' in e) {
                const em = (e as Record<string, unknown>)['message'];
                errMsg = String(em ?? errMsg);
            } else errMsg = String(e ?? errMsg);

            setError(errMsg || 'Ошибка загрузки показов');
            setBookings([]);
        } finally {
            setLoading(false);
        }
    };

    // initialize filters from query params on mount
    useEffect(() => {
        if (!searchParams) return;
        const df = searchParams.get('date_from') ?? '';
        const dt = searchParams.get('date_to') ?? '';
        // interval is no longer read from URL
        const offer_type = parseArray(searchParams.get('offer_type'));
        const moderation_status = parseArray(searchParams.get('moderation_status'));
        const type_id = parseArray(searchParams.get('type_id'));
        const location_id = parseArray(searchParams.get('location_id'));
        const agent_id = searchParams.get('agent_id') ?? '';
        const branch_id = searchParams.get('branch_id') ?? '';
        const saf = searchParams.get('sold_at_from') ?? '';
        const sat = searchParams.get('sold_at_to') ?? '';

        const preset = detectPeriodPreset(df, dt);
        setPeriodPreset(preset);

        setFilters((s) => ({
            ...s,
            date_from: df,
            date_to: dt,
            interval: presetToInterval(preset),
            offer_type,
            moderation_status,
            type_id,
            location_id,
            agent_id,
            branch_id,
            created_by: agent_id,
            sold_at_from: saf,
            sold_at_to: sat,
        }));
        setPendingLoadFromUrl(true);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // when filters were restored from URL we want to run the load() once
    useEffect(() => {
        if (!pendingLoadFromUrl) return;
        // call load() after filters state has been updated
        load();
        apply()
        setPendingLoadFromUrl(false);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filters, pendingLoadFromUrl]);

    // push filters into the URL whenever they change (replace to avoid history spam)
    useEffect(() => {
        const p = serializeFilters(filters);
        const qs = p.toString();
        const url = qs ? `${pathname}?${qs}` : pathname;
        // replace so user can go back cleanly
        router.replace(url);
    }, [filters, pathname, router]);

    const [priceMetric, setPriceMetric] = useState<PriceMetric>('sum');

    const [loading, setLoading] = useState(false);
    const [summary, setSummary] = useState<SummaryResponse | null>(null);
    const [, setSeries] = useState<TimeSeriesRow[]>([]);
    const [rooms, setRooms] = useState<RoomsRow[]>([]);
    const [managers, setManagers] = useState<ManagerEfficiencyRow[]>([]);
    const [, setLeaders] = useState<AgentsLeaderboardRow[]>([]);
    const [, setError] = useState<string | null>(null);

    const [bookingsReport, setBookingsReport] = useState<BookingAgentRow[]>([]);
    const [agentContracts, setAgentContracts] = useState<{ contract_type: string; count: number }[]>([]);
    const [agentClients, setAgentClients] = useState<{ unique_clients: number; business_clients: number } | null>(null);
    const [agentShows, setAgentShows] = useState<number | null>(null);
    const [agentEarnings, setAgentEarnings] = useState<{
        sum_price: number;
        earnings: number;
        closed_count: number;
    } | null>(null);

    // single-agent detailed report
    const [agentPropertiesReport, setAgentPropertiesReport] = useState<AgentPropertiesReport | null>(null);
    // aggregated list for all agents (backend returns array when no agent param)
    const [agentsPropertiesList, setAgentsPropertiesList] = useState<AgentPropertiesReport[] | null>(null);

    // build typed query
    const query = useMemo<Partial<ReportsQuery>>(() => {
        const q: Partial<ReportsQuery> = {
            date_from: filters.date_from || undefined,
            date_to: filters.date_to || undefined,
            interval: filters.interval,
            price_metric: priceMetric,
        };
        if (filters.offer_type.length) q.offer_type = filters.offer_type;
        if (filters.moderation_status.length) q.moderation_status = filters.moderation_status;
        if (filters.type_id.length) q.type_id = filters.type_id;
        if (filters.location_id.length) q.location_id = filters.location_id;
        if (filters.agent_id) q.agent_id = filters.agent_id;
        if (filters.branch_id) q.branch_id = filters.branch_id;
        if (filters.sold_at_from) q.sold_at_from = filters.sold_at_from;
        if (filters.sold_at_to) q.sold_at_to = filters.sold_at_to;
        return q;
    }, [filters, priceMetric]);

    const load = async () => {
        setLoading(true);
        setError(null);
        try {
            // main reports
            const [
                s,
                ts,
                rh,
                me,
                lb,
                missingPhones,
                contracts,
                clients,
                shows,
                earnings,
            ] = await Promise.all([
                reportsApi.summary(query),
                reportsApi.timeSeries(query),
                reportsApi.roomsHist(query),
                reportsApi.managerEfficiency({...query, group_by: 'created_by'}),
                reportsApi.agentsLeaderboard({...query, limit: 10}),
                reportsApi.missingPhoneAgentsByStatus(query),
                reportsApi.agentContractsStats(query),
                reportsApi.agentClientsStats(query),
                reportsApi.agentShowsStats(query),
                reportsApi.agentEarningsReport(query),
            ]);

            setSummary(s);
            setSeries(ts);
            setRooms(rh);
            setManagers(me);
            setLeaders(lb);
            setAgentContracts(contracts);
            setAgentClients(clients);
            setAgentShows(shows.shows_count);
            setAgentEarnings(earnings);

            // bookings agents
            try {
                const bookings = await reportsApi.bookingsAgentsReport(query);
                setBookingsReport(bookings);
            } catch (e) {
                console.warn('bookingsAgentsReport failed', e);
                setBookingsReport([]);
            }

            // agent properties: if agent selected -> single report, otherwise fetch list for all agents
            if (filters.agent_id) {
                try {
                    const agentId = filters.agent_id;
                    const apr = await reportsApi.agentPropertiesReport({
                        agent: String(agentId),
                        date_from: filters.date_from || undefined,
                        date_to: filters.date_to || undefined,
                    });
                    setAgentPropertiesReport(apr as AgentPropertiesReport);
                    setAgentsPropertiesList(null);
                } catch (e) {
                    console.warn('agentPropertiesReport(single) failed', e);
                    setAgentPropertiesReport(null);
                    setAgentsPropertiesList(null);
                }
            } else {
                // fetch aggregated list for all agents
                try {
                    const list = await reportsApi.agentPropertiesReport({
                        date_from: filters.date_from || undefined,
                        date_to: filters.date_to || undefined,
                    }) as AgentPropertiesReport[];
                    setAgentsPropertiesList(list);
                    setAgentPropertiesReport(null);
                } catch (e) {
                    console.warn('agentPropertiesReport(list) failed', e);
                    setAgentsPropertiesList(null);
                    setAgentPropertiesReport(null);
                }
            }
        } catch (e) {
            const message =
                e instanceof Error
                    ? e.message
                    : typeof e === 'object' && e !== null && 'message' in e
                        ? String((e as { message: unknown }).message)
                        : 'Ошибка загрузки';
            setError(message);
        } finally {
            setLoading(false);
        }
        apply()
    };

    useEffect(() => {
        load();
        apply()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // transforms for charts (same as before)
    const statusData = useMemo(
        () =>
            (summary?.by_status ?? []).map((r) => ({
                label: statusLabel(r.moderation_status ?? ''),
                origLabel: r.moderation_status ?? '',
                value: Number(r.cnt || 0),
            })),
        [summary]
    );

    const soldStatusData = useMemo(
        () =>
            (summary?.sold_status ?? []).map((r) => ({
                label: statusLabel(r.moderation_status ?? ''),
                origLabel: r.moderation_status ?? '',
                value: Number(r.cnt || 0),
            })),
        [summary]
    );

    const combinedStatusData = useMemo(() => {
        const base = summary?.by_status ?? [];
        const sold = summary?.sold_status ?? [];

        return [...base, ...sold].map((r) => ({
            label: statusLabel(r.moderation_status ?? ''),
            origLabel: r.moderation_status ?? '',
            value: Number(r.cnt || 0),
            status: r.moderation_status, // полезно для кликов / фильтров
        }));
    }, [summary]);

    const offerData = useMemo(
        () =>
            (summary?.by_offer_type ?? []).map((r) => ({
                label: offerLabel(r.offer_type),
                value: Number(r.cnt || 0),
            })),
        [summary]
    );

    // const seriesData = useMemo(
    //     () => series.map((r) => ({x: r.bucket, total: r.total, closed: r.closed})),
    //     [series]
    // );

    const roomsData = useMemo(
        () => rooms.map((r) => ({label: String(r.rooms), value: r.cnt})),
        [rooms]
    );
    const branchQuery = filters.branch_id ? `&branch_id=${filters.branch_id}` : '';

    // PIE data for agent contracts
    const agentContractsPie = useMemo(
        () =>
            agentContracts.map((c) => ({
                label: c.contract_type,
                value: c.count,
            })),
        [agentContracts]
    );

    const resetFilters = () => {
        setFilters({
            date_from: '',
            date_to: '',
            interval: 'week',
            offer_type: [],
            moderation_status: [],
            type_id: [],
            location_id: [],
            agent_id: '',
            branch_id: '',
            created_by: '',
            sold_at_from: '',
            sold_at_to: '',
        });
        setPriceMetric('sum');
        // clear query string
        router.replace(pathname);
    };

    const [filtersOpen, setFiltersOpen] = useState(true);

    const [periodOpen, setPeriodOpen] = useState(true);
    const [periodPreset, setPeriodPreset] = useState<PeriodPreset>('all');
    const [soldPeriodOpen, setSoldPeriodOpen] = useState(true);
    const [soldPeriodPreset, setSoldPeriodPreset] = useState<PeriodPreset>('all');

    const applyPeriodPreset = (preset: PeriodPreset) => {
        const today = dayjs();

        setPeriodPreset(preset);

        switch (preset) {
            case 'today':
                setFilters(s => ({
                    ...s,
                    date_from: today.format('YYYY-MM-DD'),
                    date_to: today.format('YYYY-MM-DD'),
                }));
                break;

            case 'week':
                setFilters(s => ({
                    ...s,
                    date_from: today.startOf('week').format('YYYY-MM-DD'),
                    date_to: today.endOf('week').format('YYYY-MM-DD'),
                }));
                break;

            case 'month':
                setFilters(s => ({
                    ...s,
                    date_from: today.startOf('month').format('YYYY-MM-DD'),
                    date_to: today.endOf('month').format('YYYY-MM-DD'),
                }));
                break;

            case 'prev_month':
                setFilters(s => ({
                    ...s,
                    date_from: today.subtract(1, 'month').startOf('month').format('YYYY-MM-DD'),
                    date_to: today.subtract(1, 'month').endOf('month').format('YYYY-MM-DD'),
                }));
                break;

            case 'range':
                // пользователь вводит вручную
                break;
            case 'all':
                setFilters(s => ({
                    ...s,
                    date_from: '',
                    date_to: '',
                }));
                break;
        }
    };

    const applySoldPeriodPreset = (preset: PeriodPreset) => {
        const today = dayjs();

        setSoldPeriodPreset(preset);

        switch (preset) {
            case 'today':
                setFilters(s => ({
                    ...s,
                    sold_at_from: today.format('YYYY-MM-DD'),
                    sold_at_to: today.format('YYYY-MM-DD'),
                }));
                break;

            case 'week':
                setFilters(s => ({
                    ...s,
                    sold_at_from: today.startOf('week').format('YYYY-MM-DD'),
                    sold_at_to: today.endOf('week').format('YYYY-MM-DD'),
                }));
                break;

            case 'month':
                setFilters(s => ({
                    ...s,
                    sold_at_from: today.startOf('month').format('YYYY-MM-DD'),
                    sold_at_to: today.endOf('month').format('YYYY-MM-DD'),
                }));
                break;

            case 'prev_month':
                setFilters(s => ({
                    ...s,
                    sold_at_from: today.subtract(1, 'month').startOf('month').format('YYYY-MM-DD'),
                    sold_at_to: today.subtract(1, 'month').endOf('month').format('YYYY-MM-DD'),
                }));
                break;

            case 'range':
                break;
            case 'all':
                setFilters(s => ({
                    ...s,
                    sold_at_from: '',
                    sold_at_to: '',
                }));
                break;
        }
    };

    const [page, setPage] = useState<number>(() => Number(searchParams?.get('page') ?? 1));
    const [perPage, setPerPage] = useState<number>(() => Number(searchParams?.get('per_page') ?? 20));
    const [sort, setSort] = useState<string>(() => (searchParams?.get('sort') as string) ?? '');

    const propertyFilters = useMemo(() => {
        // map our UI filters to PropertyFilters used by the hook
        return {
            listing_type: '',
            page,
            per_page: perPage,
            moderation_status: (filters.moderation_status as []).join(','),
            offer_type: (filters.offer_type as []).join(','),
            created_by: (filters.agent_id),
            branch_id: filters.branch_id || undefined,
            date_from: filters.date_from || undefined,
            date_to: filters.date_to || undefined,
            // pass `sort` only when set — avoid sending a sentinel value like 'none'
            sort: sort || undefined,
            sold_at_from: filters.sold_at_from || undefined,
            sold_at_to: filters.sold_at_to || undefined,
        } as PropertyFilters;
    }, [filters, page, perPage, sort]);

    const {
        data: propertiesResponse,
    } = useGetAllPropertiesQuery(propertyFilters, true);

    const propertiesItems: Property[] = Array.isArray(propertiesResponse)
        ? propertiesResponse
        : propertiesResponse?.data ?? [];

    function ActionMenu({propertyId, open, onToggle}: { propertyId: number; open: boolean; onToggle: () => void; }) {
        return (
            <div className="relative inline-block text-left">
                {/*<Button*/}
                {/*    type="button"*/}
                {/*    variant="circle"*/}
                {/*    onClick={onToggle}*/}
                {/*    className="rounded"*/}
                {/*    size="sm"*/}
                {/*    aria-expanded={open}*/}
                {/*>*/}
                {/*   <EllipsisVerticalIcon/>*/}
                {/*</Button>*/}

                {open && (
                    <div
                        className="absolute z-10 right-0 mt-2 w-40 bg-white border rounded shadow-md"
                        onMouseLeave={onToggle}
                    >
                        <div className="flex flex-col">
                            <Link href={`/apartment/${propertyId}`} className="block px-3 py-2 text-sm hover:bg-gray-50"
                                  onClick={onToggle}>
                                <div className="flex items-center gap-2"><EyeIcon className="w-4 h-4"/>Просмотр</div>
                            </Link>
                            <Link href={`/apartment/${propertyId}/logs`}
                                  className="block px-3 py-2 text-sm hover:bg-gray-50" onClick={onToggle}>
                                <div className="flex items-center gap-2"><HistoryIcon className="w-4 h-4"/>Логи</div>
                            </Link>
                            <Link href={`/profile/edit-post/${propertyId}`}
                                  className="block px-3 py-2 text-sm hover:bg-gray-50" onClick={onToggle}>
                                <div className="flex items-center gap-2"><EditIcon className="w-4 h-4"/>Редактировать
                                </div>
                            </Link>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className=" space-y-6">
            <h1 className="text-2xl font-semibold">Отчёты по объектам</h1>
            <ReportsNavigation/>

            {/* Фильтры */}
            <div className="bg-white rounded-2xl shadow">
                <div className="flex items-center justify-between p-4 cursor-pointer"
                     onClick={() => setFiltersOpen(v => !v)}>
                    <h2 className="text-lg font-semibold">Фильтры</h2>
                    <button
                        type="button"
                        className="text-sm text-[#0036A5] cursor-pointer"
                    >
                    <span
                        className={`inline-block transition-transform duration-300 ${
                            filtersOpen ? 'rotate-180' : 'rotate-0'
                        }`}
                    >
                      ⌃
                    </span>
                    </button>
                </div>
                <div
                    className={`overflow-hidden transition-all duration-300 ease-in-out ${
                        filtersOpen ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
                    }`}
                >
                    <div className="p-4">
                        <div className="flex gap-5">
                            {/* Период */}
                            <div className="mb-4 border border-black/30 rounded-2xl p-3">
                                <div
                                    className="flex items-center justify-between cursor-pointer"
                                    onClick={() => setPeriodOpen(v => !v)}
                                >
                                    <span className="font-medium">Период</span>
                                    <span
                                        className={`transition-transform duration-300 ${
                                            periodOpen ? 'rotate-180' : 'rotate-0'
                                        }`}
                                    >
                                          ⌃
                                        </span>
                                </div>

                                <div
                                    className={`overflow-hidden transition-all duration-300 ease-in-out ${
                                        periodOpen ? 'max-h-[300px] opacity-100' : 'max-h-0 opacity-0'
                                    }`}
                                >
                                    <div className="flex flex-wrap gap-2 mt-3">
                                        {[
                                            ['all', 'За весь период'],
                                            ['today', 'Сегодня'],
                                            ['week', 'Неделя'],
                                            ['month', 'Месяц'],
                                            ['prev_month', 'Прошлый месяц'],
                                            ['range', 'Диапазон'],
                                        ].map(([key, label]) => (
                                            <button
                                                key={key}
                                                type="button"
                                                onClick={() => applyPeriodPreset(key as PeriodPreset)}
                                                className={`px-3 py-1.5 rounded-full border text-sm transition
                                ${
                                                    periodPreset === key
                                                        ? 'bg-[#0036A5] text-white border-[#0036A5]'
                                                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
                                                }
                              `}
                                            >
                                                {label}
                                            </button>
                                        ))}
                                    </div>

                                    {periodPreset === 'range' && (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                            <Input
                                                name="date_from"
                                                type="date"
                                                label="Дата с"
                                                value={filters.date_from}
                                                onChange={(e) =>
                                                    setFilters(s => ({...s, date_from: e.target.value}))
                                                }
                                            />

                                            <Input
                                                name="date_to"
                                                type="date"
                                                label="Дата по"
                                                value={filters.date_to}
                                                onChange={(e) =>
                                                    setFilters(s => ({...s, date_to: e.target.value}))
                                                }
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                            {/* Период продажи */}
                            <div className="mb-4 border border-black/30 rounded-2xl p-3">
                                <div
                                    className="flex items-center justify-between cursor-pointer"
                                    onClick={() => setSoldPeriodOpen(v => !v)}
                                >
                                    <span className="font-medium">Период продажи</span>
                                    <span
                                        className={`transition-transform duration-300 ${
                                            soldPeriodOpen ? 'rotate-180' : 'rotate-0'
                                        }`}
                                    >
                                    ⌃
                                </span>
                                </div>

                                <div
                                    className={`overflow-hidden transition-all duration-300 ease-in-out ${
                                        soldPeriodOpen ? 'max-h-[300px] opacity-100' : 'max-h-0 opacity-0'
                                    }`}
                                >
                                    <div className="flex flex-wrap gap-2 mt-3">
                                        {[
                                            ['all', 'За весь период'],
                                            ['today', 'Сегодня'],
                                            ['week', 'Неделя'],
                                            ['month', 'Месяц'],
                                            ['prev_month', 'Прошлый месяц'],
                                            ['range', 'Диапазон'],
                                        ].map(([key, label]) => (
                                            <button
                                                key={key}
                                                type="button"
                                                onClick={() => applySoldPeriodPreset(key as PeriodPreset)}
                                                className={`px-3 py-1.5 rounded-full border text-sm transition
                                ${
                                                    soldPeriodPreset === key
                                                        ? 'bg-[#0036A5] text-white border-[#0036A5]'
                                                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
                                                }
                              `}
                                            >
                                                {label}
                                            </button>
                                        ))}
                                    </div>

                                    {soldPeriodPreset === 'range' && (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                            <Input
                                                name="sold_at_from"
                                                type="date"
                                                label="Продано с"
                                                value={filters.sold_at_from}
                                                onChange={(e) =>
                                                    setFilters(s => ({...s, sold_at_from: e.target.value}))
                                                }
                                            />

                                            <Input
                                                name="sold_at_to"
                                                type="date"
                                                label="Продано по"
                                                value={filters.sold_at_to}
                                                onChange={(e) =>
                                                    setFilters(s => ({...s, sold_at_to: e.target.value}))
                                                }
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>


                        <div className="mt-4 border border-black/30 rounded-2xl p-3">
                            <MultiSelect
                                label="Статусы"
                                value={filters.moderation_status}
                                options={STATUS_OPTIONS}
                                onChange={(arr) => setFilters((s) => ({...s, moderation_status: arr}))}
                            />
                        </div>

                        <div className="mt-4">

                        </div>

                        <div
                            className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-4 border border-black/30 rounded-2xl p-3">
                            <div className="flex flex-col gap-2">
                                <span className="block mb-2 text-sm text-[#666F8D]">Метрика цены</span>
                                <div className="flex items-center gap-4">
                                    <label className="inline-flex items-center gap-2">
                                        <input
                                            type="radio"
                                            name="price_metric"
                                            value="sum"
                                            checked={priceMetric === 'sum'}
                                            onChange={() => setPriceMetric('sum')}
                                        />
                                        <span>Сумма</span>
                                    </label>
                                    <label className="inline-flex items-center gap-2">
                                        <input
                                            type="radio"
                                            name="price_metric"
                                            value="avg"
                                            checked={priceMetric === 'avg'}
                                            onChange={() => setPriceMetric('avg')}
                                        />
                                        <span>Средняя</span>
                                    </label>
                                </div>
                            </div>
                            <Select
                                label="Агент"
                                name="agent_id"
                                value={filters.agent_id}
                                options={AGENT_OPTIONS}
                                onChange={(e) =>
                                    setFilters((s) => ({
                                        ...s,
                                        agent_id: e.target.value,
                                    }))
                                }
                            />
                            {isAdminUser && (
                                <Select
                                    label="Филиал"
                                    name="branch_id"
                                    value={filters.branch_id}
                                    options={(branches ?? []).map((b) => ({ id: b.id, name: b.name }))}
                                    onChange={(e) =>
                                        setFilters((s) => ({
                                            ...s,
                                            branch_id: e.target.value,
                                        }))
                                    }
                                />
                            )}
                        </div>

                        <div className="flex gap-3 mt-4">
                            <Button onClick={load} loading={loading}>
                                Применить
                            </Button>
                            <Button variant="secondary" onClick={resetFilters}>
                                Сбросить
                            </Button>
                        </div>
                    </div>
                </div>
            </div>


            {/* Сводные карточки */}
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 xl:grid-cols-8 gap-4">

                {/* Общая карточка */}
                <div className="p-4 bg-white rounded-2xl shadow">
                    <div className="flex flex-col items-center text-center gap-1">
                        <div className="text-4xl font-extrabold">{summary?.total ?? '—'}</div>
                        <div className="text-sm text-gray-500">Всего объектов</div>
                    </div>
                </div>


                {/* Карточки по статусам */}
                {statusData.map((s, i) => (
                    <Link
                        key={`status-${i}`}
                        href={`/profile/reports/objects/?agent_id=${filters.agent_id}&date_from=${filters.date_from}&date_to=${filters.date_to}&moderation_status=${s.origLabel}${branchQuery}`}
                        className="block p-4 bg-white rounded-2xl shadow hover:shadow-md transition"
                    >
                        <div className="flex flex-col items-center text-center gap-1">
                            <div className="text-3xl font-bold">{s.value}</div>
                            <div className="text-sm text-gray-500">{s.label}</div>
                        </div>
                    </Link>
                ))}
                <Link
                    href={`/profile/reports/objects/?agent_id=${filters.agent_id}&date_from=${filters.date_from}&date_to=${filters.date_to}&moderation_status=approved${branchQuery}`}
                    className="block p-4 bg-white rounded-2xl shadow hover:shadow-md transition"
                >
                    <div className="flex flex-col items-center text-center gap-1">
                        <div className="text-3xl font-bold">{summary?.published_sale}</div>
                        <div className="text-sm text-gray-500">Опубликовано/В продаже</div>
                    </div>
                </Link>
                <Link
                    href={`/profile/reports/objects/?agent_id=${filters.agent_id}&date_from=${filters.date_from}&date_to=${filters.date_to}&moderation_status=approved${branchQuery}`}
                    className="block p-4 bg-white rounded-2xl shadow hover:shadow-md transition"
                >
                    <div className="flex flex-col items-center text-center gap-1">
                        <div className="text-3xl font-bold">{summary?.published_rent}</div>
                        <div className="text-sm text-gray-500">Опубликовано/В аренде</div>
                    </div>
                </Link>

                {/* Карточки проданных */}
                {soldStatusData.map((s, i) => (
                    <Link
                        key={`sold-${i}`}
                        href={`/profile/reports/objects/?agent_id=${filters.agent_id}&sold_at_from=${filters.date_from}&sold_at_to=${filters.date_to}&moderation_status=${s.origLabel}${branchQuery}`}
                        className="block p-4 bg-white rounded-2xl shadow hover:shadow-md transition"
                    >
                        <div className="flex flex-col items-center text-center gap-1">
                            <div className="text-3xl font-bold">{s.value}</div>
                            <div className="text-sm text-gray-500">{s.label}</div>
                        </div>
                    </Link>
                ))}

                {/* Агент — показы */}
                {agentShows !== null && (
                    <div className="p-4 bg-white rounded-2xl shadow">
                        <div className="text-center">
                            <div className="text-3xl font-bold">{agentShows}</div>
                            <div className="text-sm text-gray-500">Показов</div>
                        </div>
                    </div>
                )}

                {/*/!* Агент — заработок *!/*/}
                {/*{agentEarnings && (*/}
                {/*    <div className="p-4 bg-white rounded-2xl shadow">*/}
                {/*        <div className="text-center">*/}
                {/*            <div className="text-2xl font-bold">*/}
                {/*                {agentEarnings.earnings.toLocaleString()}*/}
                {/*            </div>*/}
                {/*            <div className="text-sm text-gray-500">Заработок агента</div>*/}
                {/*            <div className="mt-1 text-xs text-gray-400">*/}
                {/*                Сделок: {agentEarnings.closed_count}*/}
                {/*            </div>*/}
                {/*        </div>*/}
                {/*    </div>*/}
                {/*)}*/}

            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* ЛЕВАЯ КОЛОНКА — Объекты агента */}
                <div className="bg-white rounded-2xl shadow p-4">
                    <h3 className="font-semibold mb-4">Объекты агента</h3>

                    <div className="overflow-x-auto max-w-full h-[520px] overflow-y-auto">
                        <table className="min-w-[2000px] w-full table-auto text-left">
                            <thead>
                            <tr>
                                <th className="px-3 py-2">ID</th>
                                <th className="px-3 py-2">Агент</th>
                                <th className="px-3 py-2">Название</th>
                                <th className="px-3 py-2">Район</th>
                                <th className="px-3 py-2">Ориентир</th>
                                <th className="px-3 py-2">Тип застройки</th>
                                <th className="px-3 py-2">Цена</th>
                                <th className="px-3 py-2">Статус</th>

                                {isSuperAdmin && (
                                    <>
                                        <th className="px-3 py-2">Фактическая цена продажи</th>
                                        <th className="px-3 py-2">Залог</th>
                                        <th className="px-3 py-2">Дата залога</th>
                                        <th className="px-3 py-2">Деньги где</th>
                                        <th className="px-3 py-2">Дата оформления</th>
                                        <th className="px-3 py-2">Клиент</th>
                                        <th className="px-3 py-2">Доход компании</th>
                                        <th className="px-3 py-2">Агенты / выплаты</th>
                                    </>
                                )}

                                <th className="px-3 py-2">Действия</th>
                            </tr>
                            </thead>
                            <tbody>
                            {propertiesItems.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-3 py-6 text-center text-gray-500">Нет данных</td>
                                </tr>
                            )}

                            {propertiesItems.map((p: Property) => (
                                <tr key={p.id} className="border-t">
                                    <td className="px-3 py-3 text-sm whitespace-nowrap">{p.id}</td>

                                    <td className="px-3 py-3 text-sm whitespace-nowrap">
                                        {p.creator?.name || '—'}
                                    </td>

                                    <td className="px-3 py-3 text-sm whitespace-nowrap">
                                        {buildTitle(p)}
                                    </td>

                                    <td className="px-3 py-3 text-sm whitespace-nowrap">
                                        {p.district || '—'}
                                    </td>

                                    <td className="px-3 py-3 text-sm whitespace-nowrap">
                                        {p.landmark || '—'}
                                    </td>

                                    <td className="px-3 py-3 text-sm whitespace-nowrap">
                                        {p.type?.name || '—'}
                                    </td>

                                    <td className="px-3 py-3 text-sm whitespace-nowrap">
                                        {p.price ? `${p.price} ${p.currency}` : '—'}
                                    </td>

                                    <td className="px-3 py-3 text-sm whitespace-nowrap">
                                        {statusLabel(p.moderation_status)}
                                    </td>

                                    {isSuperAdmin && p.moderation_status === 'sold' && (
                                        <>
                                            <td className="px-3 py-3 text-sm whitespace-nowrap font-medium text-emerald-700">
                                                {p.actual_sale_price
                                                    ? `${p.actual_sale_price} ${p.actual_sale_currency}`
                                                    : '—'}
                                            </td>

                                            <td className="px-3 py-3 text-sm whitespace-nowrap">
                                                {p.deposit_amount
                                                    ? `${p.deposit_amount} ${p.deposit_currency}`
                                                    : '—'}
                                            </td>

                                            <td className="px-3 py-3 text-sm whitespace-nowrap">
                                                {p.deposit_received_at
                                                    ? new Date(p.deposit_received_at).toLocaleDateString()
                                                    : '—'}
                                            </td>

                                            <td className="px-3 py-3 text-sm whitespace-nowrap">
                                                {p.money_holder === 'company'
                                                    ? 'В офисе'
                                                    : p.money_holder === 'owner'
                                                        ? 'У владельца'
                                                        : '—'}
                                            </td>

                                            <td className="px-3 py-3 text-sm whitespace-nowrap">
                                                {p.planned_contract_signed_at
                                                    ? new Date(p.planned_contract_signed_at).toLocaleDateString()
                                                    : '—'}
                                            </td>

                                            <td className="px-3 py-3 text-sm whitespace-nowrap">
                                                {p.buyer_full_name
                                                    ? `${p.buyer_full_name} (${p.buyer_phone || '—'})`
                                                    : '—'}
                                            </td>

                                            <td className="px-3 py-3 text-sm whitespace-nowrap font-semibold">
                                                {p.company_expected_income
                                                    ? `${p.company_expected_income} ${p.company_expected_income_currency}`
                                                    : '—'}
                                            </td>

                                            <td className="px-3 py-3 text-sm whitespace-nowrap">
                                                {Array.isArray(p.sale_agents) && p.sale_agents.length > 0
                                                    ? p.sale_agents.map((a: any) => {
                                                        const amount = a.pivot?.agent_commission_amount;
                                                        const currency = a.pivot?.agent_commission_currency || 'TJS';
                                                        const role = a.pivot?.role === 'main' ? 'Основной' : 'Помощник';

                                                        return `${a.name} (${role}): ${amount ? amount : 0} ${currency}`;
                                                    }).join(', ')
                                                    : '—'}
                                            </td>
                                        </>
                                    )}

                                    <td className="px-3 py-3 text-sm whitespace-nowrap">
                                        <div className="relative inline-block text-left">
                                            <Button variant="circle" size="sm"
                                                    onClick={() => {
                                                        setOpenRow(openRow === p.id ? null : p.id);
                                                    }}
                                                    className='rounded-full'
                                            >
                                                <Ellipsis className=' w-5'/>
                                            </Button>

                                            {openRow === p.id && (
                                                <div
                                                    className="absolute right-0 left-0 m-auto mt-2 w-44 bg-white border rounded shadow z-20">
                                                    <Link href={`/apartment/${p.id}`}
                                                          className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50">
                                                        <EyeIcon className="w-4 h-4"/>
                                                        <span>Посмотреть</span>
                                                    </Link>

                                                    <Link href={`/apartment/${p.id}/logs`}
                                                          className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50">
                                                        <HistoryIcon className="w-4 h-4"/>
                                                        <span>Посмотреть историю</span>
                                                    </Link>
                                                    <Link href={`/profile/edit-post/${p.id}`}
                                                          className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50">
                                                        <EditIcon className="w-4 h-4"/>
                                                        <span>Редактировать</span>
                                                    </Link>
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                        {/* Pagination */}
                        <div className="flex items-center justify-between mt-4">
                            <div className="text-sm text-gray-600">
                                Страница {propertiesResponse?.current_page ?? 1} из{' '}
                                {Math.max(
                                    1,
                                    Math.ceil(
                                        (propertiesResponse?.total ?? 0) /
                                        (propertiesResponse?.per_page ?? perPage)
                                    )
                                )}
                            </div>

                            <div className="flex items-center gap-2">
                                <Button
                                    variant="primary"
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    disabled={(propertiesResponse?.current_page ?? 1) <= 1}
                                >
                                    Пред.
                                </Button>

                                <span className="px-2">{page}</span>

                                <Button
                                    variant="primary"
                                    onClick={() => setPage(p => p + 1)}
                                    disabled={
                                        (propertiesResponse?.current_page ?? 1) >=
                                        Math.ceil(
                                            (propertiesResponse?.total ?? 0) /
                                            (propertiesResponse?.per_page ?? perPage)
                                        )
                                    }
                                >
                                    След.
                                </Button>

                                <select
                                    value={perPage}
                                    onChange={(e) => {
                                        setPerPage(Number(e.target.value));
                                        setPage(1);
                                    }}
                                    className="ml-2 px-3 py-2 border rounded"
                                >
                                    <option value={10}>10</option>
                                    <option value={20}>20</option>
                                    <option value={50}>50</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ПРАВАЯ КОЛОНКА — Договоры агента */}
                <div className="bg-white rounded-2xl shadow p-4">
                    {/*<h3 className="font-semibold mb-4">Договоры агента</h3>*/}

                    {agentContracts.length > 0 ? (
                        <div className="grid grid-cols-2 gap-6">
                            {/* PIE */}
                            <div className="">
                                <PieStatus
                                    title="Распределение по договору"
                                    data={agentContractsPie}
                                    dateFrom={filters.date_from}
                                    dateTo={filters.date_to}
                                    soldDateFrom={filters.sold_at_from}
                                    soldDateTo={filters.sold_at_to}
                                    agentId={filters.agent_id}
                                    branchId={filters.branch_id}
                                />
                            </div>

                            {/* LIST */}
                            <div className="space-y-3 mt-10">
                                {agentContracts.map((c, i) => (
                                    <div
                                        key={i}
                                        className="flex items-center justify-between rounded-xl border px-4 py-3"
                                    >
                                        <span className="text-sm text-gray-600">
                                            {c.contract_type}
                                        </span>
                                        <span className="text-lg font-semibold">
                                            {c.count}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="text-sm text-gray-400">
                            Нет данных по договорам
                        </div>
                    )}
                </div>


                {/* Графики */
                }
                {/*<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">*/}
                {/*    <PieStatus data={combinedStatusData} dateFrom={filters.date_from} dateTo={filters.date_to}*/}
                {/*               soldDateFrom={filters.sold_at_from} soldDateTo={filters.sold_at_to}*/}
                {/*               agentId={filters.agent_id}/>*/}
                {/*    <BarRooms data={roomsData} dateFrom={filters.date_from} dateTo={filters.date_to}/>*/}
                {/*    /!* Bookings agents report *!/*/}

                {/*</div>*/}

                <div className="bg-white rounded-2xl shadow p-4">
                    <h2 className="text-lg font-semibold mb-4">Показы ({bookings.length})</h2>
                    <div className="overflow-x-auto max-w-full h-[520px] overflow-y-auto">
                        <table className="w-full table-auto text-left">
                            <thead>
                            <tr>
                                <th className="px-3 py-2">ID</th>
                                <th className="px-3 py-2">Объект</th>
                                <th className="px-3 py-2">Агент</th>
                                <th className="px-3 py-2">Клиент</th>
                                <th className="px-3 py-2">Начало</th>
                                <th className="px-3 py-2">Окончание</th>
                                <th className="px-3 py-2">Примечание</th>
                            </tr>
                            </thead>
                            <tbody>
                            {bookings.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="px-3 py-6 text-center text-gray-500">Нет данных</td>
                                </tr>
                            )}

                            {bookings.map((b) => (
                                <tr key={b.id} className="border-t">
                                    <td className="px-3 py-3">{b.id}</td>
                                    <td className="px-3 py-3">
                                        <div className="flex items-center gap-3">
                                            <p
                                                className="truncate max-w-[220px] hover:underline cursor-pointer"
                                                onClick={() => {
                                                    setOpenMenuId(b.property.id);
                                                }}
                                            >
                                                {buildTitle(b.property).slice(0, 25)}{buildTitle(b.property).length > 25 ? '…' : ''}
                                            </p>

                                            <ActionMenu
                                                propertyId={b.property.id}
                                                open={openMenuId === b.property.id}
                                                onToggle={() => setOpenMenuId(openMenuId === b.property.id ? null : b.property.id)}
                                            />
                                        </div>
                                    </td>
                                    <td className="px-3 py-3">{b.agent?.name ?? (b.agent_id ? String(b.agent_id) : '—')}</td>
                                    <td className="px-3 py-3">{b.client_name ?? b.client_phone ?? '—'}</td>
                                    <td className="px-3 py-3">{b.start_time ?? '—'}</td>
                                    <td className="px-3 py-3">{b.end_time ?? '—'}</td>
                                    <td
                                        className="px-3 py-3 max-w-[200px] truncate cursor-pointer"
                                        title={b.note ?? '—'}
                                    >
                                        {b.note ? (b.note.length > 25 ? b.note.slice(0, 25) + '…' : b.note) : '—'}
                                    </td>
                                    <td className="px-3 py-3">
                                        {isAdminUser && (
                                            <Button
                                                variant="circle"
                                                className=" cursor-pointer rounded text-sm"
                                                onClick={() => openEdit(b)}
                                            >
                                                <Edit2 className='w-4'/>
                                            </Button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Агент — клиенты */}
                {agentClients && (
                    <div className="p-4 bg-white rounded-2xl shadow">
                        <div className="flex flex-col items-center text-center gap-1">
                            <div className="text-3xl font-bold">
                                {agentClients.unique_clients}
                            </div>
                            <div className="text-sm text-gray-500">
                                Уникальные клиенты
                            </div>
                            <div className="mt-1 text-xs text-gray-400">
                                Бизнесмены: {agentClients.business_clients}
                            </div>
                        </div>
                    </div>
                )}
            </div>

        </div>
    )
}
