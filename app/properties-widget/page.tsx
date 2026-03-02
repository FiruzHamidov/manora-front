'use client';

import Script from 'next/script';
import {useEffect, useMemo, useRef, useState} from 'react';
import {Property} from "@/services/properties/types";
import Image from "next/image";

// Подключаем SDK Bitrix24, если он ещё не загружен
function ensureBxScript() {
    if (typeof document === 'undefined') return;
    if (document.getElementById('bx24-sdk')) return;
    const s = document.createElement('script');
    s.src = 'https://api.bitrix24.com/api/v1/';
    s.id = 'bx24-sdk';
    s.async = true;
    document.head.appendChild(s);
}

declare global {
    type BX24Api = {
        init(cb: () => void): void;
        placement: { info(): { options?: { ID?: number | string } } };
        getDomain(): string;
        resizeWindow(width: number, height: number): void;
    };

    interface Window {
        BX24?: unknown;
    }
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') || '';
const STORAGE_BASE = process.env.NEXT_PUBLIC_STORAGE_URL?.replace(/\/$/, '') || '';

type TokenResponse = { token: string };

function getBX24(): BX24Api | undefined {
    if (typeof window === 'undefined') return undefined;
    const bx = window.BX24 as unknown;
    if (bx && typeof bx === 'object'
        && 'init' in (bx as Record<string, unknown>)
        && 'placement' in (bx as Record<string, unknown>)
        && 'getDomain' in (bx as Record<string, unknown>)
        && 'resizeWindow' in (bx as Record<string, unknown>)
    ) {
        return bx as BX24Api;
    }
    return undefined;
}

function normalizePropertiesResponse(input: unknown): Property[] {
    if (Array.isArray(input)) {
        return input as Property[];
    }
    if (input && typeof input === 'object') {
        const maybe = input as { data?: unknown };
        if (Array.isArray(maybe.data)) {
            return maybe.data as Property[];
        }
    }
    return [];
}

export default function PropertiesWidget() {
    const [jwt, setJwt] = useState<string>('');
    const [items, setItems] = useState<Property[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const dealIdRef = useRef<number | null>(null);
    const domainRef = useRef<string | null>(null);

    // ждём появления BX24 и инициализируем
    useEffect(() => {
        let mounted = true;

        const waitBx = () =>
            new Promise<void>((resolve) => {
                if (typeof window !== 'undefined') {
                    const bx = getBX24();
                    if (bx) return resolve();
                }
                const t = setInterval(() => {
                    const bx = getBX24();
                    if (bx) {
                        clearInterval(t);
                        resolve();
                    }
                }, 200);
                // safety timeout (увеличили до 15с)
                setTimeout(() => {
                    clearInterval(t);
                    resolve();
                }, 15000);
            });

        const init = async () => {
            setError(null);

            ensureBxScript();

            await waitBx();

            const bx = getBX24();
            if (!bx) {
                setError('BX24 API недоступен в этом контексте');
                return;
            }

            bx.init(async () => {
                try {
                    const info = bx.placement.info(); // {options:{ID: dealId}}
                    const domain = bx.getDomain();
                    const dealId = info?.options?.ID;

                    domainRef.current = domain || null;
                    dealIdRef.current = dealId ? Number(dealId) : null;

                    const tokRes = await fetch(`${API_BASE}/b24/token`, {
                        method: 'POST',
                        headers: {'Content-Type': 'application/json'},
                        body: JSON.stringify({domain, dealId}),
                    });
                    if (!tokRes.ok) {
                        const txt = await tokRes.text().catch(() => '');
                        throw new Error(`Не удалось получить JWT: ${tokRes.status} ${txt}`);
                    }
                    const tok = (await tokRes.json()) as TokenResponse;
                    if (mounted) setJwt(tok.token);

                    // первоначальная подгонка высоты
                    tryResize();
                } catch (e: unknown) {
                    console.error(e);
                    const msg = e instanceof Error ? e.message : 'Ошибка инициализации виджета';
                    if (mounted) setError(msg);
                }
            });
        };

        init();
        return () => {
            mounted = false;
        };
    }, []);

    const tryResize = () => {
        // Подгоняем высоту iFrame под контент
        try {
            const bx = getBX24();
            if (bx) {
                const h = Math.min(1400, Math.max(300, document.body.scrollHeight));
                bx.resizeWindow(document.body.scrollWidth, h);
            }
        } catch {
        }
    };

    // загрузка объектов по вашему API `/properties`
    const load = async () => {
        setLoading(true);
        setError(null);
        try {
            const params = buildQuery();

            const res = await fetch(`${API_BASE}/properties?${params}`, {
                headers: {Authorization: `Bearer ${jwt}`},
            });
            if (!res.ok) {
                const txt = await res.text().catch(() => '');
                throw new Error(`Ошибка загрузки: ${res.status} ${txt}`);
            }
            const data = (await res.json()) as unknown;
            const list = normalizePropertiesResponse(data);
            setItems(list);
            tryResize();
        } catch (e: unknown) {
            console.error(e);
            const msg = e instanceof Error ? e.message : 'Не удалось загрузить объекты';
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    const isReady = useMemo(() => Boolean(jwt), [jwt]);

    const [selected, setSelected] = useState<number[]>([]);

    const toggleSelect = (id: number) =>
        setSelected(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);

    const createSelection = async () => {
        if (!selected.length) return;
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE}/selections`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${jwt}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                body: JSON.stringify({
                    property_ids: selected,
                    deal_id: dealIdRef.current,
                    sync_to_b24: true,
                }),
            });
            if (!res.ok) {
                const txt = await res.text().catch(() => '');
                throw new Error(`Ошибка создания подборки: ${res.status} ${txt}`);
            }
            const data = await res.json();
            const url = data?.selection?.selection_url as string | undefined;

            if (url) {
                setSelectionUrl(url);
                setShowModal(true);
                // поджимаем высоту iFrame, чтобы попап влез
                tryResize();
            } else {
                alert('Подборка создана, но ссылка не получена');
            }
        } catch (e) {
            console.error(e);
            alert('Ошибка при создании подборки');
        } finally {
            setLoading(false);
        }
    };

    type Filters = {
        priceFrom?: string;
        priceTo?: string;
        roomsFrom?: string;
        roomsTo?: string;
        q?: string; // строка для адреса/ориентира
    };

    const [filters, setFilters] = useState<Filters>({
        priceFrom: '',
        priceTo: '',
        roomsFrom: '',
        roomsTo: '',
        q: '',
    });

    const buildQuery = () => {
        const qs = new URLSearchParams({
            offer_type: 'sale',
            per_page: '20',
        });

        if (filters.priceFrom) qs.set('priceFrom', filters.priceFrom);
        if (filters.priceTo) qs.set('priceTo', filters.priceTo);
        if (filters.roomsFrom) qs.set('roomsFrom', filters.roomsFrom);
        if (filters.roomsTo) qs.set('roomsTo', filters.roomsTo);

        // Поиск по адресу и ориентиру — бек поддерживает оба поля (like)
        if (filters.q?.trim()) {
            qs.set('address', filters.q.trim());
            qs.set('landmark', filters.q.trim());
        }
        return qs.toString();


    };
    // рядом с другими useState
    const [selectionUrl, setSelectionUrl] = useState<string | null>(null);
    const [showModal, setShowModal] = useState(false);

// универсальный copy helper
    async function copyToClipboard(text: string) {
        try {
            await navigator.clipboard.writeText(text);
            alert('Ссылка скопирована');
        } catch {
            // фоллбек
            const ta = document.createElement('textarea');
            ta.value = text;
            document.body.appendChild(ta);
            ta.select();
            document.execCommand('copy');
            document.body.removeChild(ta);
            alert('Ссылка скопирована');
        }
    }

    return (
        <>
            <Script id="bx24-sdk" src="https://api.bitrix24.com/api/v1/" strategy="afterInteractive"/>
            <div className="mx-auto w-full max-w-[1520px] px-4 sm:px-6 lg:px-8 py-6">
                {/* ФИЛЬТРЫ */}
                <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    {/* Цена от */}
                    <div className="flex flex-col">
                        <label className="text-xs text-slate-500 mb-1">Цена от</label>
                        <input
                            inputMode="numeric"
                            pattern="[0-9]*"
                            value={filters.priceFrom}
                            onChange={(e) => setFilters((f) => ({...f, priceFrom: e.target.value.replace(/\D+/g, '')}))}
                            className="rounded-xl border border-black/10 bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-[#0036A5]/30"
                            placeholder="300000"
                        />
                    </div>

                    {/* Цена до */}
                    <div className="flex flex-col">
                        <label className="text-xs text-slate-500 mb-1">Цена до</label>
                        <input
                            inputMode="numeric"
                            pattern="[0-9]*"
                            value={filters.priceTo}
                            onChange={(e) => setFilters((f) => ({...f, priceTo: e.target.value.replace(/\D+/g, '')}))}
                            className="rounded-xl border border-black/10 bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-[#0036A5]/30"
                            placeholder="800000"
                        />
                    </div>

                    {/* Комнат от */}
                    <div className="flex flex-col">
                        <label className="text-xs text-slate-500 mb-1">Комнат от</label>
                        <input
                            inputMode="numeric"
                            pattern="[0-9]*"
                            value={filters.roomsFrom}
                            onChange={(e) => setFilters((f) => ({...f, roomsFrom: e.target.value.replace(/\D+/g, '')}))}
                            className="rounded-xl border border-black/10 bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-[#0036A5]/30"
                            placeholder="1"
                        />
                    </div>

                    {/* Комнат до */}
                    <div className="flex flex-col">
                        <label className="text-xs text-slate-500 mb-1">Комнат до</label>
                        <input
                            inputMode="numeric"
                            pattern="[0-9]*"
                            value={filters.roomsTo}
                            onChange={(e) => setFilters((f) => ({...f, roomsTo: e.target.value.replace(/\D+/g, '')}))}
                            className="rounded-xl border border-black/10 bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-[#0036A5]/30"
                            placeholder="5"
                        />
                    </div>

                    {/* Адрес / Ориентир (одно поле — ищем и там, и там) */}
                    <div className="sm:col-span-2 lg:col-span-4">
                        <label className="text-xs text-slate-500 mb-1">Адрес / Ориентир</label>
                        <input
                            value={filters.q}
                            onChange={(e) => setFilters((f) => ({...f, q: e.target.value}))}
                            className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-[#0036A5]/30"
                            placeholder="напр. Рудаки, ИСМОИЛИ СОМOНИ, у парка…"
                        />
                    </div>

                    {/* Кнопки применить/сбросить */}
                    <div className="sm:col-span-2 lg:col-span-4 flex items-center gap-8 pt-1">
                        <button
                            onClick={load}
                            disabled={!isReady || loading}
                            className="px-4 py-2 rounded-xl bg-[#0036A5] text-white disabled:opacity-60"
                        >
                            Применить фильтр
                        </button>
                        <button
                            onClick={() => setFilters({priceFrom: '', priceTo: '', roomsFrom: '', roomsTo: '', q: ''})}
                            className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700"
                        >
                            Сбросить
                        </button>
                    </div>
                </div>
                <div className="">
                    <h1 style={{margin: 0, marginBottom: 12}}>Подбор объектов</h1>

                    <div style={{display: 'flex', gap: 8, marginBottom: 12}}>
                        <button
                            disabled={!isReady || loading}
                            onClick={load}
                            style={{
                                padding: '8px 12px',
                                borderRadius: 8,
                                border: 'none',
                                background: '#0036A5',
                                color: 'white',
                                cursor: isReady && !loading ? 'pointer' : 'not-allowed',
                                opacity: isReady && !loading ? 1 : 0.6,
                            }}
                        >
                            {loading ? 'Загрузка…' : 'Загрузить'}
                        </button>

                        {!isReady && <span style={{fontSize: 12, color: '#666F8D'}}>получаем доступ…</span>}
                    </div>

                    {error && (
                        <div style={{
                            background: '#FFF1F0',
                            color: '#A8071A',
                            padding: 10,
                            borderRadius: 8,
                            marginBottom: 12,
                            border: '1px solid #ffccc7'
                        }}>
                            {error}
                        </div>
                    )}

                    {/* сетка карточек */}
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {items.map((p) => {
                            const cover = p.photos?.[0]?.file_path
                                ? `${STORAGE_BASE}/${p.photos[0].file_path}`
                                : null;
                            const checked = selected.includes(p.id);
                            return (
                                <div
                                    key={p.id}
                                    className="group overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5 hover:shadow-md transition"
                                >
                                    {/* Фото */}
                                    <div className="relative h-40 bg-slate-100 rounded-t-2xl overflow-hidden">
                                        {cover ? (
                                            <Image
                                                src={cover}
                                                alt={p.title ?? `Объект #${p.id}`}
                                                width={400}
                                                height={300}
                                                className="h-full w-full object-cover"
                                                loading="lazy"
                                            />
                                        ) : (
                                            <div
                                                className="h-full w-full flex items-center justify-center text-slate-400 text-sm">
                                                Нет фото
                                            </div>
                                        )}

                                        {/* чекбокс поверх фото */}
                                        <label
                                            className="absolute top-2 left-2 inline-flex items-center gap-2 bg-white/90 backdrop-blur px-2 py-1 rounded-lg text-xs shadow">
                                            <input
                                                type="checkbox"
                                                checked={checked}
                                                onChange={() => toggleSelect(p.id)}
                                                className="h-4 w-4 accent-[#0036A5]"
                                            />
                                            <span className="text-slate-700">Выбрать</span>
                                        </label>
                                    </div>

                                    {/* Описание */}
                                    <div className="p-3">
                                        <div className="flex items-start justify-between gap-2">
                                            <h3 className="font-semibold text-slate-900 line-clamp-1">
                                                {p.title || `Объект #${p.id}`}
                                            </h3>
                                            <span className="text-[#0036A5] font-bold whitespace-nowrap">
              {new Intl.NumberFormat('ru-RU').format(Number(p.price))} {p.currency}
            </span>
                                        </div>

                                        <div className="mt-1 text-sm text-slate-600 line-clamp-2">
                                            {p.address || p.district || 'Адрес не указан'}
                                        </div>

                                        <div className="mt-2 flex items-center gap-3 text-xs text-slate-500">
                                            {p.rooms && <span>{p.rooms} комн.</span>}
                                            {p.total_area && <span>{p.total_area} м²</span>}
                                            <span>ID: {p.id}</span>
                                        </div>

                                        {/* Кнопки действий */}
                                        <div className="mt-3 flex items-center gap-2">
                                            <button
                                                onClick={async () => {
                                                    const start = new Date();
                                                    const end = new Date(start.getTime() + 60 * 60 * 1000);
                                                    try {
                                                        const resp = await fetch(`${API_BASE}/showings`, {
                                                            method: 'POST',
                                                            headers: {
                                                                Authorization: `Bearer ${jwt}`,
                                                                'Content-Type': 'application/json',
                                                            },
                                                            body: JSON.stringify({
                                                                property_id: p.id,
                                                                deal_id: dealIdRef.current,
                                                                start_time: start.toISOString(),
                                                                end_time: end.toISOString(),
                                                                note: 'Показ из виджета B24',
                                                            }),
                                                        });
                                                        if (!resp.ok) {
                                                            const txt = await resp.text().catch(() => '');
                                                            throw new Error(`Ошибка показа: ${resp.status} ${txt}`);
                                                        }
                                                        alert('Показ зарегистрирован');
                                                    } catch (e) {
                                                        console.error(e);
                                                        alert('Не удалось записать показ');
                                                    }
                                                }}
                                                className="px-3 py-2 rounded-xl bg-[#0036A5] text-white text-sm"
                                            >
                                                Показ
                                            </button>

                                            <button
                                                onClick={() => toggleSelect(p.id)}
                                                className={`px-3 py-2 rounded-xl text-sm ${
                                                    checked
                                                        ? 'bg-emerald-600 text-white'
                                                        : 'bg-slate-100 text-slate-700'
                                                }`}
                                            >
                                                {checked ? 'Выбрано' : 'В подборку'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* панель кнопок под карточками */}
                    {selected.length > 0 && (
                        <div className="mt-6 flex flex-wrap items-center gap-3">
                            <button
                                onClick={createSelection}
                                className="px-3 py-2 rounded-xl bg-emerald-600 text-white"
                            >
                                Создать подборку ({selected.length})
                            </button>
                            <button
                                onClick={() => setSelected([])}
                                className="px-3 py-2 rounded-xl bg-slate-100 text-slate-700"
                            >
                                Очистить выбор
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* MODAL: Ссылка на подборку */}
            {showModal && selectionUrl && (
                <div
                    className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40"
                    onClick={() => { setShowModal(false); tryResize(); }}
                >
                    <div
                        className="w-[min(520px,92vw)] rounded-2xl bg-white p-5 shadow-xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3 className="text-lg font-semibold mb-2">Подборка создана</h3>
                        <p className="text-sm text-slate-600 mb-3">
                            Ссылка на подборку:
                        </p>

                        <div className="flex items-stretch gap-2 mb-4">
                            <input
                                className="flex-1 rounded-xl border border-black/10 bg-slate-50 px-3 py-2 text-sm"
                                readOnly
                                value={selectionUrl}
                                onFocus={(e) => e.currentTarget.select()}
                            />
                            <button
                                onClick={() => copyToClipboard(selectionUrl)}
                                className="rounded-xl bg-slate-800 text-white px-3 py-2 text-sm"
                            >
                                Копировать
                            </button>
                        </div>

                        <div className="flex gap-2 justify-end">
                            <a
                                href={selectionUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="px-4 py-2 rounded-xl bg-[#0036A5] text-white text-sm"
                                onClick={() => { setShowModal(false); tryResize(); }}
                            >
                                Открыть ссылку
                            </a>
                            <button
                                onClick={() => { setShowModal(false); tryResize(); }}
                                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-800 text-sm"
                            >
                                Закрыть
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
        ;
}