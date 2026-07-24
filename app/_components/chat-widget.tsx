'use client';

import {useEffect, useMemo, useRef, useState} from 'react';
import Image from 'next/image';
import {
    Bot,
    Home,
    Loader2,
    MapPin,
    MessageCircle,
    MessageSquarePlus,
    MessageSquareText,
    RotateCcw,
    Send,
    X,
} from 'lucide-react';
import {createNewSessionId, fmtPrice, getOrCreateSessionId, persistSessionId} from '@/services/chat/helpers';
import {ChatHistoryResponse, ChatMessage, ChatPostResponse, PropertyCard} from '@/services/chat/types';
import {usePathname, useSearchParams} from 'next/navigation';

type Props = {
    title?: string;
    subtitle?: string;
};

const SCROLL_DELTA = 8;
const SHOW_TOP_OFFSET = 48;
const TEASER_CLOSE_COUNT_KEY = 'chat_teaser_close_count_v1';
const MINI_FAB_THRESHOLD = 3;

export default function ChatWidget({
    title = 'Чат с поддержкой',
    subtitle = 'На связи 24/7',
}: Props) {
    const [open, setOpen] = useState(false);
    const [showTeaser, setShowTeaser] = useState(false);
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
        const openChat = () => {
            setOpen(true);
            setShowTeaser(false);
            window.setTimeout(() => inputRef.current?.focus(), 80);
        };
        window.addEventListener('open-ai-chat', openChat);
        return () => window.removeEventListener('open-ai-chat', openChat);
    }, []);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        const raw = localStorage.getItem(TEASER_CLOSE_COUNT_KEY);
        const parsed = Number(raw ?? 0);
        const count = Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
        setTeaserCloseCount(count);
        const isMobile = window.matchMedia('(max-width: 639px)').matches;
        if (count >= MINI_FAB_THRESHOLD || isMobile) {
            setShowTeaser(false);
        } else {
            setShowTeaser(true);
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

    const [loading, setLoading] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [sessionId, setSessionId] = useState<string>('');
    const [failedMessage, setFailedMessage] = useState<string | null>(null);
    const [failedReason, setFailedReason] = useState<string | null>(null);
    const listRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const teaserInputRef = useRef<HTMLInputElement>(null);

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
        const load = async () => {
            if (!open || !sessionId) return;
            if (messages.length > 0) return;

            try {
                const res = await fetch(`/api/chat/history?session_id=${encodeURIComponent(sessionId)}`, {
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
            } catch {
                // The chat remains usable even when history is unavailable.
            }
        };

        load();
    }, [open, sessionId, messages.length]);

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

    const send = async (rawText?: string, retry = false) => {
        const text = (rawText ?? input).trim();
        if (!text || loading) return;
        if (!rawText) setInput('');

        const activeSessionId = sessionId || getOrCreateSessionId();
        if (!sessionId) setSessionId(activeSessionId);

        setFailedMessage(null);
        setFailedReason(null);
        if (!retry) {
            const localUserMsg: ChatMessage = {role: 'user', content: text, created_at: new Date().toISOString()};
            setMessages((prev) => [...prev, localUserMsg]);
        }
        setLoading(true);

        try {
            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: {'Content-Type': 'application/json', Accept: 'application/json'},
                body: JSON.stringify({
                    message: text,
                    session_id: activeSessionId,
                    context: buildChatContext(),
                }),
            });

            const json = (await res.json().catch(() => ({}))) as ChatPostResponse & {error?: string};
            if (!res.ok) {
                throw new Error(json.error || 'Сервис временно недоступен');
            }

            if (json.session_id && json.session_id !== activeSessionId) {
                setSessionId(json.session_id);
                persistSessionId(json.session_id);
            }

            const answer = json.answer?.trim() ?? '';
            const items = Array.isArray(json.items) ? (json.items as PropertyCard[]) : [];
            if (!answer && items.length === 0) {
                throw new Error('Помощник не вернул ответ. Попробуйте ещё раз.');
            }
            if (/сервис ии сейчас недоступен/i.test(answer)) {
                throw new Error('AI-помощник временно недоступен. Попробуйте ещё раз через минуту.');
            }

            const assistantMsg: ChatMessage = {
                role: 'assistant',
                content: answer,
                items,
                created_at: new Date().toISOString(),
            };
            setMessages((prev) => [...prev, assistantMsg]);
        } catch (error) {
            setFailedMessage(text);
            setFailedReason(error instanceof Error ? error.message : 'Не удалось получить ответ. Попробуйте ещё раз.');
        } finally {
            setLoading(false);
        }
    };

    const startNewChat = () => {
        const sid = createNewSessionId();
        setSessionId(sid);
        setMessages([]);
        setInput('');
        setFailedMessage(null);
        setFailedReason(null);
        setTeaserValue('');
        window.setTimeout(() => inputRef.current?.focus(), 80);
    };

    const sendFromTeaser = () => {
        const text = teaserValue.trim();
        if (!text) return;
        setOpen(true);
        setShowTeaser(false);
        setTeaserValue('');
        send(text);
    };

    const openChat = () => {
        setOpen(true);
        setShowTeaser(false);
        window.setTimeout(() => inputRef.current?.focus(), 80);
    };

    const dismissTeaser = () => {
        setShowTeaser(false);
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
                            src={'https://back.manora.tj/storage/' + (it.photos.find(i => i.is_main)?.path ?? it.photos[0]?.path)}
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
                <div className={`max-w-[82%] rounded-2xl px-4 py-3 ${isUser ? 'rounded-br-md bg-[#006341] text-white' : 'rounded-bl-md border border-[#E4EBE7] bg-white text-[#121826] shadow-sm'}`}>
                    {m.content && <div className="whitespace-pre-wrap text-[15px] leading-6">{m.content}</div>}
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
                        fixed z-[70] left-0 right-0 max-sm:hidden
                        bottom-6
                        transition-transform duration-200
                        ${hidden ? 'translate-y-8 opacity-0 pointer-events-none' : 'translate-y-0 opacity-100'}
                    `}
                >
                    <div className="relative mx-auto w-[min(92vw,620px)] overflow-hidden rounded-[22px] border border-[#DCE7E1] bg-white shadow-[0_18px_55px_rgba(18,48,36,0.16)]">
                        <div className="flex items-center justify-between px-4 pt-3">
                            <span className="inline-flex items-center gap-2 text-xs font-semibold text-[#006341]">
                                <span className="grid h-7 w-7 place-items-center rounded-lg bg-[#E7F6EF]">
                                    <Bot className="h-4 w-4"/>
                                </span>
                                AI-помощник Manora
                            </span>
                            <button
                                type="button"
                                onClick={dismissTeaser}
                                className="grid h-8 w-8 place-items-center rounded-lg text-[#69766F] hover:bg-[#F1F5F3]"
                                aria-label="Скрыть подсказку AI-помощника"
                            >
                                <X className="h-4 w-4"/>
                            </button>
                        </div>

                        <form
                            className="flex items-center gap-2 p-3 pt-2"
                            onSubmit={(event) => {
                                event.preventDefault();
                                if (teaserValue.trim()) {
                                    sendFromTeaser();
                                } else {
                                    openChat();
                                }
                            }}
                        >
                                <input
                                    ref={teaserInputRef}
                                    value={teaserValue}
                                    onChange={(event) => setTeaserValue(event.target.value)}
                                    onKeyDown={(event) => {
                                        if (event.key !== 'Enter' || event.shiftKey) return;
                                        event.preventDefault();
                                        if (teaserValue.trim()) {
                                            sendFromTeaser();
                                        } else {
                                            openChat();
                                        }
                                    }}
                                    placeholder={quickPrompts[0] ?? 'Что вы ищете?'}
                                    className="h-12 min-w-0 flex-1 rounded-2xl border border-[#D7E4DE] bg-[#F7FAF8] px-4 text-sm text-[#14231D] outline-none transition placeholder:text-[#7B8982] focus:border-[#007A50] focus:bg-white focus:ring-2 focus:ring-[#007A50]/10"
                                />
                                <button
                                    type="submit"
                                    className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#006B47] text-white transition hover:bg-[#00583B]"
                                    aria-label={teaserValue.trim() ? 'Отправить сообщение' : 'Открыть AI-чат'}
                                >
                                    <Send className="h-5 w-5"/>
                                </button>
                        </form>
                    </div>
                </div>
            )}

            {!open && !showTeaser && (
                <button
                    type="button"
                    onClick={openChat}
                    style={{
                        willChange: 'transform, opacity',
                        WebkitTapHighlightColor: 'transparent',
                        touchAction: 'manipulation',
                    }}
                    className={`
                        fixed z-[70] group rounded-full right-4 sm:right-6
                        ${isMiniFab ? 'w-11 h-11 sm:w-12 sm:h-12' : 'w-14 h-14'}
                        bottom-[calc(100px+max(env(safe-area-inset-bottom),0px))] md:bottom-4
                        transition-transform duration-200 cursor-pointer
                        ${hidden ? 'translate-y-8 opacity-0 pointer-events-none' : 'translate-y-0 opacity-100'}
                    `}
                    aria-label="Открыть AI-чат"
                >
                    <span className="absolute inset-0 -z-10 rounded-full bg-[#006341]/70 blur-md animate-ping"/>
                    <span className="absolute inset-0 -z-10 rounded-full bg-[#006341]/60 blur-md animate-pulse"/>
                    <span className="absolute inset-0 -z-10 rounded-full bg-[#006341]/30"/>
                    <span className="flex items-center justify-center rounded-full shadow-lg text-white hover:bg-[#004D33] transition bg-[#006341] w-full h-full">
                        <MessageSquareText className={isMiniFab ? 'w-4 h-4' : 'w-5 h-5'}/>
                    </span>
                </button>
            )}

            {open && <div className="fixed inset-0 z-[100] bg-black/35 transition-opacity duration-300" onClick={() => setOpen(false)}/>}

            <div className={`fixed z-[110] inset-0 sm:p-5 ${open ? 'opacity-100' : 'opacity-0 pointer-events-none'} transition`}>
                <div className="mx-auto flex h-[100dvh] w-full max-w-3xl flex-col overflow-hidden bg-[#F4F8F6] sm:h-[calc(100vh-40px)] sm:rounded-3xl sm:border sm:border-[#DDE7E2] sm:shadow-[0_24px_72px_rgba(15,23,42,0.22)]">
                    <div className="flex shrink-0 items-center justify-between border-b border-[#E2E9E5] bg-white px-4 pb-3 pt-[calc(12px+env(safe-area-inset-top))] sm:pt-3">
                        <div className="flex items-center gap-3 min-w-0">
                            <div className="relative h-10 w-10 shrink-0 rounded-xl bg-[#E9F7F1] p-2">
                                <Image src="/manora.svg" alt="Manora" fill sizes="40px" className="object-contain p-2"/>
                            </div>
                            <div className="min-w-0">
                                <div className="truncate text-[17px] font-semibold leading-tight text-[#121826]">{title}</div>
                                <div className="mt-1 flex items-center gap-1.5 truncate text-xs leading-tight text-[#637083]">
                                    <span className="h-2 w-2 rounded-full bg-[#12A171]"/>
                                    {subtitle}
                                </div>
                            </div>
                        </div>
                        <div className="ml-2 flex items-center gap-1.5">
                            <button
                                onClick={startNewChat}
                                className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-[#E9F7F1] px-3 text-sm font-medium text-[#006341] transition hover:bg-[#D8F0E6]"
                                title="Начать новый чат"
                            >
                                <MessageSquarePlus className="h-4 w-4"/>
                                <span className="max-[390px]:hidden">Новый</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setOpen(false)}
                                className="grid h-10 w-10 place-items-center rounded-xl text-[#637083] transition hover:bg-[#F0F3F2]"
                                aria-label="Закрыть чат"
                            >
                                <X className="h-5 w-5"/>
                            </button>
                        </div>
                    </div>

                    <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-5 sm:px-6">
                        {messages.length === 0 && (
                            <div className="mx-auto flex h-full max-w-md flex-col justify-center pb-8 text-center">
                                <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-[#DDF3EA] text-[#006341]">
                                    <MessageCircle className="h-8 w-8"/>
                                </div>
                                <div className="mt-5 text-xl font-semibold text-[#121826]">Чем помочь?</div>
                                <p className="mx-auto mt-2 max-w-[320px] text-sm leading-5 text-[#637083]">
                                    Опишите, какую недвижимость ищете — подберу варианты и отвечу на вопросы.
                                </p>
                                <div className="mt-6 grid gap-2">
                                    {quickPrompts.map((prompt) => (
                                        <button
                                            key={`empty-${prompt}`}
                                            type="button"
                                            onClick={() => send(prompt)}
                                            disabled={loading}
                                            className="rounded-2xl border border-[#DCE7E1] bg-white px-4 py-3 text-left text-sm font-medium leading-5 text-[#24332C] shadow-sm transition hover:border-[#94CDB5] hover:bg-[#F9FCFA] disabled:opacity-50"
                                        >
                                            {prompt}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {messages.map((m, idx) => {
                            const key = (m.id != null ? `msg-${m.id}` : null) ?? `${m.role}-${m.created_at ?? 'no-time'}-${idx}`;
                            return <Bubble key={key} m={m}/>;
                        })}

                        {loading && (
                            <div className="w-full flex justify-start">
                                <div className="inline-flex items-center gap-2 rounded-2xl rounded-bl-md border border-[#E4EBE7] bg-white px-4 py-3 text-sm text-[#4B586B] shadow-sm">
                                    <Loader2 className="w-4 h-4 animate-spin"/> {loadingPhrase}
                                </div>
                            </div>
                        )}

                        {failedMessage && !loading && (
                            <div className="rounded-2xl border border-[#F2C6C6] bg-[#FFF7F7] p-4">
                                <div className="text-sm font-semibold text-[#8B2626]">Не удалось получить ответ</div>
                                <div className="mt-1 text-sm leading-5 text-[#7A4A4A]">
                                    {failedReason ?? 'Попробуйте ещё раз — ваше сообщение сохранено.'}
                                </div>
                                <button
                                    type="button"
                                    onClick={() => send(failedMessage, true)}
                                    className="mt-3 inline-flex h-9 items-center gap-2 rounded-xl bg-white px-3 text-sm font-semibold text-[#8B2626] shadow-sm transition hover:bg-[#FFF0F0]"
                                >
                                    <RotateCcw className="h-4 w-4"/>
                                    Повторить
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="shrink-0 border-t border-[#E2E9E5] bg-white px-3 pb-[calc(12px+env(safe-area-inset-bottom))] pt-3 sm:px-4 sm:pb-4">
                        {messages.length > 0 && input.trim().length === 0 && !loading && (
                            <div className="pb-2 overflow-x-auto hide-scrollbar">
                                <div className="flex flex-nowrap gap-2 px-1 min-w-max">
                                    {quickPrompts.map((prompt) => (
                                        <button
                                            key={`inline-${prompt}`}
                                            type="button"
                                            onClick={() => send(prompt)}
                                            disabled={loading}
                                            className="shrink-0 rounded-full border border-[#CDE4D9] bg-[#F4FAF7] px-3 py-1.5 text-xs text-[#006341] hover:bg-[#E9F7F1] disabled:opacity-50"
                                        >
                                            {prompt}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="flex items-end gap-2">
                            <input
                                ref={inputRef}
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        send();
                                    }
                                }}
                                placeholder="Напишите, что ищете…"
                                className="h-12 min-w-0 flex-1 rounded-2xl border border-[#D8E2DD] bg-[#F7F9F8] px-4 text-[15px] text-[#121826] outline-none transition placeholder:text-[#89948E] focus:border-[#006341] focus:bg-white focus:ring-2 focus:ring-[#006341]/10"
                            />
                            <button
                                type="button"
                                onClick={() => send()}
                                disabled={loading || !input.trim()}
                                className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#006341] text-white transition hover:bg-[#004D33] disabled:bg-[#B8C8C1]"
                                aria-label="Отправить сообщение"
                            >
                                <Send className="h-5 w-5"/>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
