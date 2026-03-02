'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/ui-components/Button';
import { Input } from '@/ui-components/Input';
import {
    reportsApi,
    type MissingPhoneListResponse,
} from '@/services/reports/api';
import {axios} from "@/utils/axios";
import {useProfile} from "@/services/login/hooks";
import {useBranches} from "@/services/branches/hooks";
import {ReportsNavigation} from "../_components/ReportsNavigation";

type AgentOption = { id: number; name: string };
interface Agent {
    id: number;
    name: string;
}
const STATUS_OPTIONS = [
    { label: 'Все', value: '' },
    { label: 'Черновик', value: 'draft' },
    { label: 'Ожидание', value: 'pending' },
    { label: 'Одобрено/Опубликовано', value: 'approved' },
    { label: 'Отклонено', value: 'rejected' },
    { label: 'Продано', value: 'sold' },
    { label: 'Продано владельцем', value: 'sold_by_owner' },
    { label: 'Арендовано', value: 'rented' },
    { label: 'Удалено', value: 'deleted' },
    { label: 'denied', value: 'Отказано клиентом' },
];

// мапа для перевода статусов в таблице
const STATUS_LABELS = Object.fromEntries(
    STATUS_OPTIONS.filter(s => s.value !== '').map(s => [s.value, s.label])
) as Record<string, string>;

const statusLabel = (v?: string | null) =>
    v ? (STATUS_LABELS[v] ?? v) : '—';

function buildHref(
    basePath: string,
    input: Record<string, string | number | (string | number)[] | undefined>
) {
    const qs = new URLSearchParams();
    Object.entries(input).forEach(([k, v]) => {
        if (v == null || v === '') return;
        if (Array.isArray(v)) v.forEach((x) => qs.append(k, String(x)));
        else qs.set(k, String(v));
    });
    const q = qs.toString();
    return q ? `${basePath}?${q}` : basePath;
}

export default function MissingPhoneListPage() {
    const sp = useSearchParams();
    const router = useRouter();
    const {data: profile} = useProfile();
    const {data: branches} = useBranches();
    const isBranchFilterAvailable = profile?.role?.slug === 'admin' || profile?.role?.slug === 'superadmin';

    const page = Number(sp.get('page') || '1');
    const per_page = Number(sp.get('per_page') || '50');

    const [loading, setLoading] = useState(false);
    const [resp, setResp] = useState<MissingPhoneListResponse | null>(null);

    // список агентов для селекта
    const [agents, setAgents] = useState<AgentOption[]>([]);
    const [agentsLoading, setAgentsLoading] = useState(false);

    const query = useMemo(() => {
        const q: Record<string, string | number | (string | number)[]> = {};
        sp.forEach((v, k) => {
            if (k === 'page' || k === 'per_page') return;
            if (q[k] === undefined) q[k] = v;
            else if (Array.isArray(q[k])) (q[k] as (string | number)[]).push(v);
            else q[k] = [q[k] as string, v];
        });
        q.page = page;
        q.per_page = per_page;
        return q;
    }, [sp, page, per_page]);

    const setParam = (k: string, v?: string) => {
        const u = new URLSearchParams(sp.toString());
        if (!v) u.delete(k);
        else u.set(k, v);
        router.push(`/profile/reports/missing-phone?${u.toString()}`);
    };

    const load = async () => {
        setLoading(true);
        try {
            const data = await reportsApi.missingPhoneList(query);
            setResp(data);
        } catch (e) {
            console.error(e);
            setResp({
                data: [],
                current_page: 1,
                last_page: 1,
                per_page: per_page,
                total: 0,
            });
        } finally {
            setLoading(false);
        }
    };

    // подгрузка агентов для селекта
    const loadAgents = async () => {
        setAgentsLoading(true);
        try {
            const response = await axios.get<Agent[]>('/user/agents');
            setAgents(Array.isArray(response.data) ? response.data : []);
        } catch (e) {
            console.error('agents load failed', e);
            setAgents([]);
        } finally {
            setAgentsLoading(false);
        }
    };

    useEffect(() => {
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sp]);

    useEffect(() => {
        loadAgents();
    }, []);

    return (
        <div className="space-y-6 mx-auto w-full max-w-[1200px] p-4">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-semibold">Объекты без телефона</h1>
                <Link href="/profile/reports" className="text-[#0036A5] hover:underline">
                    ← Назад к отчётам
                </Link>
            </div>
            <ReportsNavigation/>

            {/* Быстрые фильтры */}
            <div className="bg-white rounded-2xl shadow p-4">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    <Input
                        type="date"
                        label="Дата с"
                        name="date_from"
                        value={sp.get('date_from') ?? ''}
                        onChange={(e) => setParam('date_from', e.target.value || undefined)}
                    />
                    <Input
                        type="date"
                        label="Дата по"
                        name="date_to"
                        value={sp.get('date_to') ?? ''}
                        onChange={(e) => setParam('date_to', e.target.value || undefined)}
                    />

                    <div className="md:col-span-2">
                        <label className="block mb-2 text-sm text-[#666F8D]">Статус</label>
                        <select
                            className="w-full px-4 py-3 rounded-lg border border-[#BAC0CC] bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#0036A5]"
                            value={sp.get('moderation_status') ?? ''}
                            onChange={(e) =>
                                setParam('moderation_status', e.target.value || undefined)
                            }
                        >
                            {STATUS_OPTIONS.map((s) => (
                                <option key={s.value} value={s.value}>
                                    {s.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Селект агента */}
                    <div>
                        <label className="block mb-2 text-sm text-[#666F8D]">Агент</label>
                        <select
                            className="w-full px-4 py-3 rounded-lg border border-[#BAC0CC] bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#0036A5]"
                            value={sp.get('created_by') ?? ''}
                            onChange={(e) => setParam('created_by', e.target.value || undefined)}
                            disabled={agentsLoading}
                        >
                            <option value="">Все агенты</option>
                            {agents.map((a) => (
                                <option key={a.id} value={String(a.id)}>
                                    {a.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    {isBranchFilterAvailable && (
                        <div>
                            <label className="block mb-2 text-sm text-[#666F8D]">Филиал</label>
                            <select
                                className="w-full px-4 py-3 rounded-lg border border-[#BAC0CC] bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#0036A5]"
                                value={sp.get('branch_id') ?? ''}
                                onChange={(e) => setParam('branch_id', e.target.value || undefined)}
                            >
                                <option value="">Все филиалы</option>
                                {(branches ?? []).map((branch) => (
                                    <option key={branch.id} value={String(branch.id)}>
                                        {branch.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-3 mt-4">
                    <Button onClick={() => load()} loading={loading}>
                        Применить
                    </Button>
                    <Button
                        variant="secondary"
                        onClick={() => router.push('/profile/reports/missing-phone')}
                    >
                        Сбросить
                    </Button>
                </div>
            </div>

            {/* Таблица */}
            <div className="p-4 bg-white rounded-2xl shadow overflow-x-auto">
                <div className="flex items-center justify-between mb-3">
                    <div className="text-sm text-gray-600">
                        {resp
                            ? `Найдено ${resp.total} • стр. ${resp.current_page} из ${resp.last_page}`
                            : '—'}
                    </div>
                    {/* линк в общий отчёт, сохраняя активные фильтры */}
                    <Link
                        className="text-[#0036A5] hover:underline"
                        href={buildHref('/profile/reports', {
                            date_from: sp.get('date_from') || undefined,
                            date_to: sp.get('date_to') || undefined,
                            moderation_status: sp.get('moderation_status') || undefined,
                            created_by: sp.get('created_by') || undefined,
                            branch_id: sp.get('branch_id') || undefined,
                        })}
                    >
                        К сводным отчётам →
                    </Link>
                </div>

                <table className="min-w-full text-sm">
                    <thead>
                    <tr className="text-left text-gray-500">
                        <th className="py-2 pr-4">ID</th>
                        <th className="py-2 pr-4">Название</th>
                        <th className="py-2 pr-4">Адрес</th>
                        <th className="py-2 pr-4">Статус</th>
                        <th className="py-2 pr-4">Агент</th>
                        <th className="py-2 pr-4">Создано</th>
                        <th className="py-2 pr-4">Цена</th>
                        <th className="py-2 pr-4">Владелец</th>
                        <th className="py-2 pr-4">Телефон</th>
                    </tr>
                    </thead>
                    <tbody>
                    {loading ? (
                        <tr>
                            <td className="py-6 text-center" colSpan={9}>
                                Загрузка…
                            </td>
                        </tr>
                    ) : !resp || resp.data.length === 0 ? (
                        <tr>
                            <td className="py-6 text-gray-500" colSpan={9}>
                                Нет данных по текущим фильтрам
                            </td>
                        </tr>
                    ) : (
                        resp.data.map((row) => (
                            <tr key={row.id} className="border-t">
                                <td className="py-2 pr-4">{row.id}</td>
                                <td className="py-2 pr-4">{row.title ?? '—'}</td>
                                <td className="py-2 pr-4">{row.address ?? '—'}</td>
                                <td className="py-2 pr-4">
                                    {statusLabel(row.moderation_status)}
                                </td>
                                <td className="py-2 pr-4">{row.created_by_name}</td>
                                <td className="py-2 pr-4">
                                    {row.created_at
                                        ? new Date(row.created_at).toLocaleDateString()
                                        : '—'}
                                </td>
                                <td className="py-2 pr-4">
                                    {row.price != null
                                        ? `${Number(row.price).toLocaleString()} ${row.currency ?? ''}`
                                        : '—'}
                                </td>
                                <td className="py-2 pr-4">{row.owner_name ?? '—'}</td>
                                <td className="py-2 pr-4">{row.owner_phone ?? '—'}</td>
                            </tr>
                        ))
                    )}
                    </tbody>
                </table>

                {/* Пагинация */}
                {resp && resp.last_page > 1 && (
                    <div className="flex items-center justify-center gap-2 mt-4">
                        <Button
                            disabled={page <= 1}
                            onClick={() => setParam('page', String(Math.max(1, page - 1)))}
                        >
                            Назад
                        </Button>
                        <span className="text-sm text-gray-600">
              Стр. {page} из {resp.last_page}
            </span>
                        <Button
                            disabled={page >= resp.last_page}
                            onClick={() => setParam('page', String(Math.min(resp.last_page, page + 1)))}
                        >
                            Вперёд
                        </Button>
                        <select
                            className="ml-4 border rounded px-2 py-1"
                            value={String(per_page)}
                            onChange={(e) => setParam('per_page', e.target.value)}
                        >
                            {[25, 50, 100].map((n) => (
                                <option key={n} value={n}>
                                    {n} / стр.
                                </option>
                            ))}
                        </select>
                    </div>
                )}
            </div>
        </div>
    );
}
