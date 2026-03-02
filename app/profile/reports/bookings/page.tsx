'use client';

import {ChangeEvent, useCallback, useEffect, useRef, useState} from 'react';
import {useRouter, useSearchParams} from 'next/navigation';
import {Input} from '@/ui-components/Input';
import {Button} from '@/ui-components/Button';
import {axios} from '@/utils/axios';
import {Edit2, EditIcon, EyeIcon, HistoryIcon} from "lucide-react";
import {useProfile} from "@/services/login/hooks";
import {buildTitle} from "@/utils/helpers";
import {Property} from "@/services/properties/types";
import Link from "next/link";
import {useBranches} from "@/services/branches/hooks";
import {ReportsNavigation} from "../_components/ReportsNavigation";

type Agent = { id: number; name: string };

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

function BookingsReport() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [agents, setAgents] = useState<Agent[]>([]);
    const [, setLoadingAgents] = useState(false);

    const {data: currentUser} = useProfile();
    type UserRole = 'admin' | 'agent' | 'superadmin' | 'client';
    const userRole = currentUser?.role?.slug as UserRole | undefined;
    const ADMIN_ROLES: readonly UserRole[] = ['admin', 'superadmin'];
    const isAdminUser = ADMIN_ROLES.includes(userRole ?? 'client');
    const [agentSelectDisabled, setAgentSelectDisabled] = useState(false);

    const [dateFrom, setDateFrom] = useState<string>(() => String(searchParams?.get('date_from') ?? ''));
    const [dateTo, setDateTo] = useState<string>(() => String(searchParams?.get('date_to') ?? ''));
    const [agentId, setAgentId] = useState<string>(() => String(searchParams?.get('agent_id') ?? ''));
    const [branchId, setBranchId] = useState<string>(() => String(searchParams?.get('branch_id') ?? ''));
    const {data: branches} = useBranches();

    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);


    useEffect(() => {
        if (!currentUser) return;

        if (!isAdminUser) {
            setAgentSelectDisabled(true);
            setAgentId(String(currentUser.id));
        }
    }, [currentUser, isAdminUser]);

    useEffect(() => {
        const loadAgents = async () => {
            setLoadingAgents(true);
            try {
                const res = await axios.get<Agent[]>('/user/agents');
                setAgents(Array.isArray(res.data) ? res.data : []);
            } catch (e) {
                console.error('failed loading agents', e);
                setAgents([]);
            } finally {
                setLoadingAgents(false);
            }
        };
        loadAgents();
    }, []);

    // used to avoid auto-applying filters on initial mount twice
    const isFirstAutoApply = useRef(true);

    // auto-apply filters whenever inputs change (debounced)
    useEffect(() => {
        // skip first run (initial mount) — initial load handled by the other effect above
        if (isFirstAutoApply.current) {
            isFirstAutoApply.current = false;
            return;
        }

        const timer = setTimeout(() => {
            apply();
        }, 500); // 500ms debounce

        return () => clearTimeout(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [dateFrom, dateTo, agentId, branchId]);

    const buildQuery = () => {
        const params = new URLSearchParams();
        if (dateFrom) params.set('date_from', dateFrom);
        if (dateTo) params.set('date_to', dateTo);
        // if currentUser exists and is not admin, enforce their id (ignore agentId param)
        const effectiveAgentId = currentUser && !isAdminUser
            ? String(currentUser.id)
            : agentId;
        if (effectiveAgentId) params.set('agent_id', effectiveAgentId);
        if (branchId) params.set('branch_id', branchId);
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

    useEffect(() => {
        // If the URL contains query params, apply them when they change or when currentUser is loaded.
        // This ensures navigating to this page with ?date_from=...&agent_id=... triggers the report load.
        const sp = searchParams?.toString() ?? '';
        const hasParams = sp.length > 0;
        if (!hasParams) return;

        // call apply() once for the incoming query params
        apply().catch(() => {
        });

        // mark that initial auto-apply has happened so the debounce effect doesn't run immediately
        isFirstAutoApply.current = false;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchParams?.toString(), currentUser]);

    // --- Edit modal state & handlers ---
    const [editing, setEditing] = useState<Booking | null>(null);
    const openEdit = useCallback((b: Booking) => setEditing(b), []);
    const closeEdit = useCallback(() => setEditing(null), []);

    // track which property's ActionMenu is open (property id) — null means none
    const [openMenuId, setOpenMenuId] = useState<number | null>(null);

    const saveEdit = async (payload: Partial<Booking> & { id: number }) => {
        try {
            const updatePayload: Partial<Booking> = {};
            if (payload.start_time !== undefined) updatePayload.start_time = payload.start_time;
            if (payload.end_time !== undefined) updatePayload.end_time = payload.end_time;
            if (payload.note !== undefined) updatePayload.note = payload.note;
            if (payload.agent_id !== undefined) updatePayload.agent_id = payload.agent_id;

            const res = await axios.put<Booking>(`/bookings/${payload.id}`, updatePayload);
            // refresh list
            await apply();
            closeEdit();
            return res.data;
        } catch (e: unknown) {
            console.error('failed saving booking', e);
            // безопасно извлекаем сообщение из неизвестной ошибки (без any)
            let errMsg = 'Ошибка сохранения';
            if (e instanceof Error) errMsg = e.message;
            else if (typeof e === 'object' && e !== null && 'message' in e) {
                const em = (e as Record<string, unknown>)['message'];
                errMsg = String(em ?? errMsg);
            } else {
                errMsg = String(e ?? errMsg);
            }
            throw new Error(errMsg);
        }
    };

    function BookingEditModal() {
        const [local, setLocal] = useState<Partial<Booking>>(() => (editing ? {...editing} : {}));
        useEffect(() => {
            setLocal(editing ? {...editing} : {});
        }, [editing]);

        if (!editing) return null;

        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center">
                <div className="absolute inset-0 bg-black opacity-30" onClick={closeEdit}/>
                <div className="bg-white rounded-lg shadow-lg p-6 z-60 w-full max-w-md">
                    <h3 className="text-lg font-semibold mb-4">Редактировать показ #{editing.id}</h3>

                    <label className="block text-sm mb-1">Начало</label>
                    <input
                        type="datetime-local"
                        className="w-full mb-3 px-3 py-2 border rounded"
                        value={local.start_time ?? ''}
                        onChange={(e) => setLocal((s) => ({...s, start_time: e.target.value}))}
                    />

                    <label className="block text-sm mb-1">Окончание</label>
                    <input
                        type="datetime-local"
                        className="w-full mb-3 px-3 py-2 border rounded"
                        value={local.end_time ?? ''}
                        onChange={(e) => setLocal((s) => ({...s, end_time: e.target.value}))}
                    />

                    <label className="block text-sm mb-1">Заметка</label>
                    <textarea
                        className="w-full mb-3 px-3 py-2 border rounded"
                        value={local.note ?? ''}
                        onChange={(e) => setLocal((s) => ({...s, note: e.target.value}))}
                    />

                    {/* allow changing agent only for admins */}
                    {isAdminUser && (
                        <>
                            <label className="block text-sm mb-1">Агент</label>
                            <select
                                className="w-full mb-3 px-3 py-2 border rounded"
                                value={String(local.agent_id ?? '')}
                                onChange={(e) => setLocal((s) => ({
                                    ...s,
                                    agent_id: e.target.value ? Number(e.target.value) : null
                                }))}
                            >
                                <option value="">— Выбрать —</option>
                                {agents.map((a) => (
                                    <option key={a.id} value={String(a.id)}>
                                        {a.name}
                                    </option>
                                ))}
                            </select>
                        </>
                    )}

                    <div className="flex justify-end gap-2 mt-4">
                        <Button variant="secondary" onClick={closeEdit}>Отмена</Button>
                        <Button
                            onClick={async () => await saveEdit({id: editing.id, ...(local as Partial<Booking>)})}>Сохранить</Button>
                    </div>
                </div>
            </div>
        );
    }

    // --- ActionMenu component (controlled by parent via open/onToggle) ---
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
        <div className="space-y-6 p-4">
            <h1 className="text-2xl font-semibold">Отчёт по показам</h1>
            <ReportsNavigation/>

            <div className="bg-white rounded-2xl shadow p-4 grid grid-cols-1 md:grid-cols-4 gap-4">
                <Input
                    type="date"
                    label="Дата с"
                    name="date_from"
                    value={dateFrom}
                    onChange={(e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setDateFrom(e.target.value)}
                />
                <Input
                    type="date"
                    label="Дата по"
                    name="date_to"
                    value={dateTo}
                    onChange={(e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setDateTo(e.target.value)}
                />

                <div className="flex flex-col gap-2">
                    <label className="block text-sm text-[#666F8D]">Агент</label>
                    <select
                        className="w-full px-4 py-3 rounded-lg border border-[#BAC0CC] bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#0036A5]"
                        value={agentId}
                        onChange={(e) => setAgentId(e.target.value)}
                        disabled={agentSelectDisabled}
                    >
                        <option value="">— Все —</option>
                        {agents.map((a) => (
                            <option key={a.id} value={String(a.id)}>
                                {a.name}
                            </option>
                        ))}
                    </select>
                </div>
                {isAdminUser && (
                    <div className="flex flex-col gap-2">
                        <label className="block text-sm text-[#666F8D]">Филиал</label>
                        <select
                            className="w-full px-4 py-3 rounded-lg border border-[#BAC0CC] bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#0036A5]"
                            value={branchId}
                            onChange={(e) => setBranchId(e.target.value)}
                        >
                            <option value="">— Все —</option>
                            {(branches ?? []).map((branch) => (
                                <option key={branch.id} value={String(branch.id)}>
                                    {branch.name}
                                </option>
                            ))}
                        </select>
                    </div>
                )}

                <div className="flex items-end mb-1">
                    <Button onClick={apply} loading={loading}>
                        Загрузить
                    </Button>
                </div>
            </div>

            {error && <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-2xl">{error}</div>}

            <div className="bg-white rounded-2xl shadow p-4">
                <h2 className="text-lg font-semibold mb-4">Результаты ({bookings.length})</h2>
                <div className="overflow-x-auto">
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
            <BookingEditModal/>
        </div>
    );
}

export default function BookingsReportPage() {
    return <BookingsReport/>;
}
