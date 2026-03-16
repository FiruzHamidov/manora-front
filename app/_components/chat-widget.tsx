'use client';

import {useEffect, useMemo, useRef, useState} from 'react';
import Image from 'next/image';
import {Home, Loader2, MapPin, MessageSquarePlus, MessageSquareText, Send, Sparkles, X} from 'lucide-react';
import {createNewSessionId, fmtPrice, getOrCreateSessionId, persistSessionId} from '@/services/chat/helpers';
import {ChatHistoryResponse, ChatMessage, ChatPostResponse, PropertyCard} from '@/services/chat/types';
import {usePathname, useSearchParams} from 'next/navigation';

type Props = {
    apiBase: string;
    title?: string;
    subtitle?: string;
};

const SCROLL_DELTA = 8;
const SHOW_TOP_OFFSET = 48;
const TEASER_CLOSE_COUNT_KEY = 'chat_teaser_close_count_v1';
const MINI_FAB_THRESHOLD = 3;

type TeaserStage = 'suggest' | 'compose';

export default function ChatWidget({
    apiBase,
    title = 'Чат с поддержкой',
    subtitle = 'На связи 24/7',
}: Props) {
    const [open, setOpen] = useState(false);
    const [teaserStage, setTeaserStage] = useState<TeaserStage>('suggest');
    const [showTeaser, setShowTeaser] = useState(true);
    const [teaserCloseCount, setTeaserCloseCount] = useState(0);

    const pathname = usePathname();
    const searchParams = useSearchParams();
    const queryString = searchParams?.toString() ?? '';

    const [hidden, setHidden] = useState(false);
    const lastYRef = useRef(0);

    useEffect(() => {
        const onScroll = () => {
            const y = window.scrollY || 0;
            const diff = y - lastYRef.current;
            if (y <= SHOW_TOP_OFFSET) setHidden(false);
            else if (diff > SCROLL_DELTA) setHidden(true);
            else if (diff < -SCROLL_DELTA) setHidden(false);
            lastYRef.current = y;
        };

        lastYRef.current = window.scrollY || 0;
        window.addEventListener('scroll', onScroll, {passive: true});
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    useEffect(() => {
        setHidden(false);
    }, [pathname]);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        const raw = localStorage.getItem(TEASER_CLOSE_COUNT_KEY);
        const parsed = Number(raw ?? 0);
        const count = Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
        setTeaserCloseCount(count);
        if (count >= MINI_FAB_THRESHOLD) {
            setShowTeaser(false);
            setTeaserStage('suggest');
        }
    }, []);

    const bodyScrollStateRef = useRef<{
        bodyOverflow: string;
        bodyTouchAction: string;
        htmlOverflow: string;
        htmlTouchAction: string;
    } | null>(null);

    useEffect(() => {
        if (typeof document === 'undefined') return;
        const body = document.body;
        const html = document.documentElement;

        const restore = () => {
            if (!bodyScrollStateRef.current) return;
            body.style.overflow = bodyScrollStateRef.current.bodyOverflow;
            body.style.touchAction = bodyScrollStateRef.current.bodyTouchAction;
            html.style.overflow = bodyScrollStateRef.current.htmlOverflow;
            html.style.touchAction = bodyScrollStateRef.current.htmlTouchAction;
            bodyScrollStateRef.current = null;
        };

        if (open) {
            bodyScrollStateRef.current = {
                bodyOverflow: body.style.overflow,
                bodyTouchAction: body.style.touchAction,
                htmlOverflow: html.style.overflow,
                htmlTouchAction: html.style.touchAction,
            };
            body.style.overflow = 'hidden';
            body.style.touchAction = 'none';
            html.style.overflow = 'hidden';
            html.style.touchAction = 'none';
            return restore;
        }

        restore();
        return restore;
    }, [open]);

    const [teaserValue, setTeaserValue] = useState('');
    const [hintIndex, setHintIndex] = useState(0);
    const [typedHint, setTypedHint] = useState('');
    const [isDeletingHint, setIsDeletingHint] = useState(false);

    const [loading, setLoading] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [sessionId, setSessionId] = useState<string>('');
    const listRef = useRef<HTMLDivElement>(null);

    const loadingPhrases = [
        'Думаю над ответом…',
        'Подбираю лучшие варианты…',
        'Сверяю детали, секунду…',
        'Формулирую рекомендацию…',
        'Проверяю информацию…',
    ];
    const [loadingPhrase, setLoadingPhrase] = useState<string>(loadingPhrases[0]);

    useEffect(() => {
        setSessionId(getOrCreateSessionId());
    }, []);

    const quickPrompts = useMemo(() => {
        if (pathname.startsWith('/apartment/')) {
            return [
                'Сделай краткий разбор этого объекта',
                'Покажи похожие дешевле',
                'Хочу написать владельцу этого объявления',
            ];
        }

        if (pathname.startsWith('/listings')) {
            return [
                'Подбери 5 лучших вариантов по моим фильтрам',
                'Покажи только VIP и срочные варианты',
                'Помоги выбрать самый выгодный вариант',
            ];
        }

        if (pathname.startsWith('/mortgage')) {
            return [
                'Рассчитай ипотеку для бюджета 500000',
                'Какие документы нужны для ипотеки?',
                'Хочу консультацию по ипотеке',
            ];
        }

        return [
            'Подбери недвижимость под мой бюджет',
            'Какие районы сейчас самые выгодные?',
            'Хочу консультацию от менеджера',
        ];
    }, [pathname]);

    useEffect(() => {
        setHintIndex(0);
        setTypedHint('');
        setIsDeletingHint(false);
    }, [quickPrompts, pathname]);

    useEffect(() => {
        if (open || teaserStage !== 'suggest' || quickPrompts.length === 0) return;

        const fullText = quickPrompts[hintIndex % quickPrompts.length];
        const atFull = !isDeletingHint && typedHint.length === fullText.length;
        const atEmpty = isDeletingHint && typedHint.length === 0;

        const timeout = window.setTimeout(
            () => {
                if (atFull) {
                    setIsDeletingHint(true);
                    return;
                }
                if (atEmpty) {
                    setIsDeletingHint(false);
                    setHintIndex((prev) => (prev + 1) % quickPrompts.length);
                    return;
                }

                if (isDeletingHint) {
                    setTypedHint(fullText.slice(0, typedHint.length - 1));
                } else {
                    setTypedHint(fullText.slice(0, typedHint.length + 1));
                }
            },
            atFull ? 1200 : atEmpty ? 260 : isDeletingHint ? 24 : 42
        );

        return () => window.clearTimeout(timeout);
    }, [open, teaserStage, quickPrompts, hintIndex, typedHint, isDeletingHint]);

    useEffect(() => {
        const load = async () => {
            if (!open || !sessionId) return;
            if (messages.length > 0) return;

            try {
                const res = await fetch(`${apiBase}/chat/history?session_id=${encodeURIComponent(sessionId)}`, {
                    method: 'GET',
                    headers: {Accept: 'application/json'},
                });
                if (!res.ok) throw new Error(await res.text());

                const json: ChatHistoryResponse = await res.json();
                if (json.session_id && json.session_id !== sessionId) {
                    setSessionId(json.session_id);
                    persistSessionId(json.session_id);
                }

                const mapped: ChatMessage[] = (json.messages ?? []).map((m) => {
                    const srcItems = (m as { items?: unknown }).items;
                    const items: PropertyCard[] | null = Array.isArray(srcItems) ? (srcItems as PropertyCard[]) : null;
                    return {
                        id: m.id,
                        role: m.role,
                        content: m.content ?? '',
                        items,
                        created_at: m.created_at,
                    };
                });

                setMessages(mapped);
                setTimeout(() => listRef.current?.scrollTo({top: listRef.current.scrollHeight, behavior: 'auto'}), 50);
            } catch (e) {
                console.error('load history failed', e);
            }
        };

        load();
    }, [open, sessionId, apiBase, messages.length]);

    useEffect(() => {
        listRef.current?.scrollTo({top: listRef.current.scrollHeight, behavior: 'smooth'});
    }, [messages]);

    useEffect(() => {
        if (loading) {
            setLoadingPhrase(loadingPhrases[Math.floor(Math.random() * loadingPhrases.length)]);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [loading]);

    const buildChatContext = () => {
        const query: Record<string, string> = {};
        if (queryString) {
            const qs = new URLSearchParams(queryString);
            qs.forEach((value, key) => {
                if (value !== '') query[key] = value;
            });
        }

        return {
            page_type: pathname.startsWith('/apartment/')
                ? 'property'
                : pathname.startsWith('/listings')
                    ? 'catalog'
                    : pathname.replace(/\//g, '') || 'home',
            page_url: typeof window !== 'undefined' ? window.location.href : pathname,
            page_path: pathname,
            property_slug: pathname.startsWith('/apartment/') ? pathname.split('/')[2] : undefined,
            selected_location_id: typeof window !== 'undefined' ? (localStorage.getItem('selectedLocationId') ?? '') : '',
            filters: query,
        };
    };

    const send = async (rawText?: string) => {
        const text = (rawText ?? input).trim();
        if (!text || !sessionId) return;
        if (!rawText) setInput('');

        const localUserMsg: ChatMessage = {role: 'user', content: text, created_at: new Date().toISOString()};
        setMessages((prev) => [...prev, localUserMsg]);
        setLoading(true);

        try {
            const res = await fetch(`${apiBase}/chat`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json', Accept: 'application/json'},
                body: JSON.stringify({
                    message: text,
                    session_id: sessionId,
                    context: buildChatContext(),
                }),
            });

            const json: ChatPostResponse = await res.json();
            if (json.session_id && json.session_id !== sessionId) {
                setSessionId(json.session_id);
                persistSessionId(json.session_id);
            }

            const assistantMsg: ChatMessage = {
                role: 'assistant',
                content: json.answer ?? '',
                items: Array.isArray(json.items) ? (json.items as PropertyCard[]) : [],
                created_at: new Date().toISOString(),
            };
            setMessages((prev) => [...prev, assistantMsg]);
        } catch (e) {
            console.error(e);
            const err: ChatMessage = {
                role: 'assistant',
                content: 'Что-то пошло не так. Давайте попробуем ещё раз.',
                created_at: new Date().toISOString(),
            };
            setMessages((prev) => [...prev, err]);
        } finally {
            setLoading(false);
        }
    };

    const startNewChat = () => {
        const sid = createNewSessionId();
        setSessionId(sid);
        setMessages([]);
        setInput('');
        setTeaserValue('');
        setTeaserStage('suggest');
    };

    const sendFromTeaser = () => {
        const text = teaserValue.trim();
        if (!text) return;
        setOpen(true);
        setShowTeaser(true);
        setTeaserStage('suggest');
        setTeaserValue('');
        send(text);
    };

    const sendPickedPromptFromTeaser = (prompt: string) => {
        const text = prompt.trim();
        if (!text) return;
        setOpen(true);
        setShowTeaser(true);
        setTeaserStage('suggest');
        setTeaserValue('');
        send(text);
    };

    const dismissTeaser = () => {
        setShowTeaser(false);
        setTeaserStage('suggest');
        setTeaserValue('');
        if (typeof window === 'undefined') return;
        const nextCount = teaserCloseCount + 1;
        setTeaserCloseCount(nextCount);
        localStorage.setItem(TEASER_CLOSE_COUNT_KEY, String(nextCount));
    };

    const isMiniFab = teaserCloseCount >= MINI_FAB_THRESHOLD;

    const PropertyCardView = ({it}: { it: PropertyCard }) => (
        <a href={it.url} target="_blank" rel="noreferrer" className="block rounded-xl p-3 hover:shadow-md transition bg-white">
            <div className="flex gap-3 items-start">
                <div className="relative w-16 h-16 bg-gray-100 rounded-md flex items-center justify-center overflow-hidden">
                    {it.photos?.length > 0 ? (
                        <Image
                            alt={it.title ?? 'Фото объекта'}
                            src={'https://backend.aura.tj/storage/' + (it.photos.find(i => i.is_main)?.path ?? it.photos[0]?.path)}
                            fill
                            className="object-cover"
                            sizes="64px"
                        />
                    ) : (
                        <Home className="w-5 h-5 text-gray-400"/>
                    )}
                </div>
                <div className="min-w-0 flex-1">
                    <div className="font-medium truncate">{it.title}</div>
                    <div className="text-sm text-gray-600 mt-0.5">{fmtPrice(it.price, it.currency)}</div>
                    <div className="text-xs text-gray-500 mt-1 flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5"/>
                        <span className="truncate">{it.city || it.district || it.address || 'Город не указан'}</span>
                    </div>
                    {typeof it.type === 'object' && it.type?.name && (
                        <div className="text-xs text-gray-500 mt-1">Тип: {it.type.name}</div>
                    )}
                </div>
            </div>
        </a>
    );

    const Bubble = ({m}: { m: ChatMessage }) => {
        const isUser = m.role === 'user';
        const isAssistant = m.role === 'assistant';
        return (
            <div className={`w-full flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-2xl px-4 py-3 shadow ${isUser ? 'bg-blue-600 text-white' : 'bg-white text-gray-900'}`}>
                    {m.content && <div className="whitespace-pre-wrap leading-relaxed text-sm">{m.content}</div>}
                    {isAssistant && Array.isArray(m.items) && m.items.length > 0 && (
                        <div className="mt-3 grid gap-3">
                            {m.items.map((it) => (
                                <PropertyCardView key={it.id} it={it}/>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        );
    };

    return (
        <>
            {!open && showTeaser && (
                <div
                    className={`
                        fixed z-[70] left-0 right-0
                        bottom-[calc(100px+max(env(safe-area-inset-bottom),0px))] sm:bottom-6
                        transition-transform duration-200
                        ${hidden ? 'translate-y-8 opacity-0 pointer-events-none' : 'translate-y-0 opacity-100'}
                    `}
                >
                    {teaserStage === 'suggest' && (
                        <>
                            <span className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 h-16 bg-gradient-to-r from-transparent via-[#0A62FF]/50 to-transparent blur-2xl animate-[pulse_2.2s_ease-in-out_infinite]"/>
                            <span className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 h-11 bg-gradient-to-r from-transparent via-[#38BDF8]/50 to-transparent blur-xl animate-[pulse_1.9s_ease-in-out_infinite]"/>
                            <span className="pointer-events-none absolute left-0 top-1/2 -translate-y-1/2 w-[34vw] max-w-[360px] h-8 bg-[radial-gradient(ellipse_at_center,rgba(10,98,255,0.58),transparent_74%)] blur-xl animate-[pulse_2.1s_ease-in-out_infinite]"/>
                            <span className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 w-[34vw] max-w-[360px] h-8 bg-[radial-gradient(ellipse_at_center,rgba(10,98,255,0.58),transparent_74%)] blur-xl animate-[pulse_2.1s_ease-in-out_infinite]"/>
                            <span className="pointer-events-none absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 w-[52vw] max-w-[720px] h-24 bg-[radial-gradient(ellipse_at_center,rgba(56,189,248,0.64),rgba(56,189,248,0.24)_56%,transparent_82%)] blur-2xl animate-[pulse_1.7s_ease-in-out_infinite]"/>
                        </>
                    )}

                    <div className={`relative mx-auto ${teaserStage === 'suggest' ? 'w-[min(88vw,500px)]' : 'w-[min(96vw,860px)]'} rounded-2xl bg-gradient-to-b from-white/45 to-white/20 supports-[backdrop-filter]:backdrop-blur-2xl backdrop-saturate-[1.8] border border-white/45 shadow-[0_12px_40px_rgba(15,23,42,0.20),inset_0_1px_0_rgba(255,255,255,0.65)]`}>
                        <div className="relative px-3 pt-2 text-[11px] text-[#0036A5] font-semibold uppercase tracking-wide flex items-center justify-between">
                            <span className="inline-flex items-center gap-1.5">
                                <Sparkles className="w-3.5 h-3.5 animate-pulse"/>
                                AI помощник
                            </span>
                            <button
                                type="button"
                                onClick={dismissTeaser}
                                className="p-1 rounded-lg text-gray-500 hover:bg-gray-100"
                                aria-label="Свернуть AI блок"
                            >
                                <X className="w-4 h-4"/>
                            </button>
                        </div>

                        {teaserStage === 'suggest' ? (
                            <div className="relative p-2 sm:p-3 pt-1.5">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setTeaserValue(quickPrompts[hintIndex % quickPrompts.length] || quickPrompts[0] || '');
                                        setTeaserStage('compose');
                                    }}
                                    className="w-full text-left rounded-xl border border-blue-200/80 bg-white/80 px-3 py-2 text-sm text-[#0F172A] min-h-10 flex items-center hover:bg-blue-50/70"
                                >
                                    <span className="truncate">
                                        <span className="text-[#0036A5] font-medium">Напишите: </span>
                                        {typedHint || quickPrompts[0]}
                                    </span>
                                    <span className="ml-1 inline-block h-4 w-[2px] bg-[#0A62FF] animate-pulse rounded-full"/>
                                </button>
                            </div>
                        ) : (
                            <div className="p-2 sm:p-3 space-y-2">
                                <div className="overflow-x-auto hide-scrollbar">
                                    <div className="flex flex-nowrap gap-2 min-w-max">
                                        {quickPrompts.map((prompt) => (
                                            <button
                                                key={`compose-${prompt}`}
                                                type="button"
                                                onClick={() => sendPickedPromptFromTeaser(prompt)}
                                                className="text-xs rounded-full border border-blue-200 bg-white/90 text-[#0036A5] px-3 py-1.5 hover:bg-blue-50"
                                            >
                                                {prompt}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <input
                                        value={teaserValue}
                                        onChange={(e) => setTeaserValue(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && !e.shiftKey) {
                                                e.preventDefault();
                                                sendFromTeaser();
                                            }
                                        }}
                                        placeholder={quickPrompts[hintIndex % quickPrompts.length] ?? 'Напишите запрос...'}
                                        className="flex-1 h-11 sm:h-12 rounded-xl border border-blue-200 bg-white px-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#0A62FF]"
                                    />
                                    <button
                                        type="button"
                                        onClick={sendFromTeaser}
                                        className="h-11 sm:h-12 px-3 sm:px-4 rounded-xl bg-[#0036A5] text-white hover:bg-blue-900 inline-flex items-center gap-1.5"
                                    >
                                        <Send className="w-4 h-4"/>
                                        <span className="hidden sm:inline">Отправить</span>
                                    </button>
                                </div>

                            </div>
                        )}
                    </div>
                </div>
            )}

            {!open && !showTeaser && (
                <button
                    type="button"
                    onClick={() => {
                        setShowTeaser(true);
                        setTeaserStage('suggest');
                    }}
                    style={{
                        willChange: 'transform, opacity',
                        WebkitTapHighlightColor: 'transparent',
                        touchAction: 'manipulation',
                    }}
                    className={`
                        fixed z-[70] group rounded-full right-6
                        ${isMiniFab ? 'w-11 h-11 sm:w-12 sm:h-12' : 'w-14 h-14'}
                        bottom-[calc(100px+max(env(safe-area-inset-bottom),0px))] sm:bottom-4
                        transition-transform duration-200 cursor-pointer
                        ${hidden ? 'translate-y-8 opacity-0 pointer-events-none' : 'translate-y-0 opacity-100'}
                    `}
                    aria-label="Открыть AI блок"
                >
                    <span className="absolute inset-0 -z-10 rounded-full bg-blue-500/70 blur-md animate-ping"/>
                    <span className="absolute inset-0 -z-10 rounded-full bg-blue-500/60 blur-md animate-pulse"/>
                    <span className="absolute inset-0 -z-10 rounded-full bg-blue-500/30"/>
                    <span className="flex items-center justify-center rounded-full shadow-lg text-white hover:bg-blue-900 transition bg-[#0036A5] w-full h-full">
                        <MessageSquareText className={isMiniFab ? 'w-4 h-4' : 'w-5 h-5'}/>
                    </span>
                </button>
            )}

            {open && <div className="fixed inset-0 z-40 bg-black/35 backdrop-blur-sm transition-opacity duration-300" onClick={() => setOpen(false)}/>}

            <div className={`fixed z-50 inset-0 sm:p-5 ${open ? 'opacity-100' : 'opacity-0 pointer-events-none'} transition`}>
                <div className="mx-auto w-full max-w-5xl h-full sm:h-[calc(100vh-40px)] rounded-none sm:rounded-3xl overflow-hidden flex flex-col bg-gradient-to-b from-white/45 to-white/20 supports-[backdrop-filter]:backdrop-blur-2xl backdrop-saturate-[1.8] border border-white/45 shadow-[0_18px_60px_rgba(15,23,42,0.25),inset_0_1px_0_rgba(255,255,255,0.65)]">
                    <div className="relative bg-gradient-to-b from-white/45 to-white/20 supports-[backdrop-filter]:backdrop-blur-2xl backdrop-saturate-[1.8] px-4 py-3 flex items-center justify-between border-b border-white/50">
                        <span className="pointer-events-none absolute inset-x-4 -top-0.5 h-px bg-gradient-to-r from-transparent via-white/90 to-transparent"/>
                        <div className="flex items-center gap-3 min-w-0">
                            <div className="relative w-5 h-5">
                                <Image src="/manora.svg" alt="Manora" fill sizes="20px" className="object-contain"/>
                            </div>
                            <div className="min-w-0">
                                <div className="font-semibold leading-tight truncate">{title}</div>
                                <div className="text-[11px] mt-1 text-gray-500 leading-tight truncate">{subtitle}</div>
                            </div>
                        </div>
                        <div className="flex items-center gap-1 ml-2">
                            <button
                                onClick={startNewChat}
                                className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border border-blue-100 text-[#0036A5] bg-blue-50 hover:bg-blue-100"
                                title="Начать новый чат"
                            >
                                <MessageSquarePlus className="w-3.5 h-3.5"/>
                                <span>Новый чат</span>
                            </button>
                            <button onClick={() => setOpen(false)} className="p-1 rounded hover:bg-gray-100">
                                <X className="w-5 h-5 text-gray-500"/>
                            </button>
                        </div>
                    </div>

                    <div ref={listRef} className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3">
                        {messages.length === 0 && (
                            <div className="flex flex-col items-center text-center text-sm text-gray-500 mt-6 gap-3">
                                <div className="flex justify-center">
                                    <iframe
                                        title="Manora operator"
                                        className="w-28 h-28"
                                        src="https://lottie.host/embed/de0a7611-411e-4a9c-9838-5eb958c014dd/3qYVkw53db.lottie"
                                    />
                                </div>
                                <div>
                                    <div className="font-medium text-gray-700">Поддержка Manora на связи!</div>
                                    <div className="mt-1 w-80">Привет! Помогу с выбором квартиры, дома или офиса на manora.tj.</div>
                                </div>
                            </div>
                        )}

                        {messages.map((m, idx) => {
                            const key = (m.id != null ? `msg-${m.id}` : null) ?? `${m.role}-${m.created_at ?? 'no-time'}-${idx}`;
                            return <Bubble key={key} m={m}/>;
                        })}

                        {loading && (
                            <div className="w-full flex justify-start">
                                <div className="bg-white rounded-2xl px-4 py-3 shadow text-gray-700 text-sm inline-flex items-center gap-2">
                                    <Loader2 className="w-4 h-4 animate-spin"/> {loadingPhrase}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="relative bg-gradient-to-b from-white/45 to-white/20 supports-[backdrop-filter]:backdrop-blur-2xl backdrop-saturate-[1.8] p-2 sm:p-3 border-t border-white/50">
                        <span className="pointer-events-none absolute inset-x-4 top-0 h-px bg-gradient-to-r from-transparent via-white/90 to-transparent"/>

                        {input.trim().length > 0 && (
                            <div className="pb-2 overflow-x-auto hide-scrollbar">
                                <div className="flex flex-nowrap gap-2 px-1 min-w-max">
                                    {quickPrompts.map((prompt) => (
                                        <button
                                            key={`inline-${prompt}`}
                                            type="button"
                                            onClick={() => send(prompt)}
                                            disabled={loading}
                                            className="shrink-0 text-xs rounded-full border border-blue-200 bg-blue-50 text-[#0036A5] px-3 py-1.5 hover:bg-blue-100 disabled:opacity-50"
                                        >
                                            {prompt}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="flex items-center gap-2">
                            <input
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        send();
                                    }
                                }}
                                placeholder="Напишите, что ищете..."
                                className="flex-1 rounded-xl px-3 py-2 border border-white/60 bg-white/70 backdrop-blur-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <button
                                onClick={() => send()}
                                disabled={loading || !input.trim()}
                                className="rounded-xl bg-[#0036A5] text-white px-3 py-2 disabled:opacity-50 hover:bg-blue-900"
                            >
                                <Send className="w-4 h-4"/>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
