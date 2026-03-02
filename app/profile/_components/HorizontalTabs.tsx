'use client';

import {useEffect, useMemo, useRef, useState} from 'react';

type Tab = { key: string; label: string };
type Props = {
    tabs: readonly Tab[];
    selectedKey: string;
    totals?: Record<string, number | undefined>;
    onChange: (k: string) => void;
    loading?: boolean;
};

export default function HorizontalTabs({ tabs, selectedKey, totals, onChange, loading }: Props) {
    const scrollerRef = useRef<HTMLDivElement | null>(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(false);

    const refreshArrows = () => {
        const el = scrollerRef.current;
        if (!el) return;
        setCanScrollLeft(el.scrollLeft > 0);
        setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
    };

    useEffect(() => {
        const el = scrollerRef.current;
        if (!el) return;
        refreshArrows();
        const handler = () => refreshArrows();
        el.addEventListener('scroll', handler, { passive: true });
        const ro = new ResizeObserver(refreshArrows);
        ro.observe(el);
        return () => {
            el.removeEventListener('scroll', handler);
            ro.disconnect();
        };
    }, []);

    // автопрокрутка к активному табу
    useEffect(() => {
        const el = scrollerRef.current;
        if (!el) return;
        const active = el.querySelector<HTMLButtonElement>('[data-active="true"]');
        if (!active) return;
        const aLeft = active.offsetLeft;
        const aRight = aLeft + active.offsetWidth;
        const vLeft = el.scrollLeft;
        const vRight = vLeft + el.clientWidth;
        if (aLeft < vLeft) el.scrollTo({ left: aLeft - 16, behavior: 'smooth' });
        else if (aRight > vRight) el.scrollTo({ left: aRight - el.clientWidth + 16, behavior: 'smooth' });
    }, [selectedKey]);

    const scrollBy = (dx: number) => scrollerRef.current?.scrollBy({ left: dx, behavior: 'smooth' });

    // клавиатура
    const flatKeys = useMemo(() => tabs.map(t => t.key), [tabs]);
    const onKeyDown = (e: React.KeyboardEvent) => {
        const idx = flatKeys.indexOf(selectedKey);
        if (e.key === 'ArrowRight') { e.preventDefault(); onChange(flatKeys[Math.min(idx + 1, flatKeys.length - 1)]); }
        else if (e.key === 'ArrowLeft') { e.preventDefault(); onChange(flatKeys[Math.max(idx - 1, 0)]); }
        else if (e.key === 'Home') { e.preventDefault(); onChange(flatKeys[0]); }
        else if (e.key === 'End') { e.preventDefault(); onChange(flatKeys[flatKeys.length - 1]); }
    };

    return (
        <div
            className="relative w-full overflow-hidden"
            // мягкий fade краёв контейнера через CSS mask (и webkit)
            style={{
                maskImage: 'linear-gradient(to right, transparent, black 24px, black calc(100% - 24px), transparent)',
                WebkitMaskImage: 'linear-gradient(to right, transparent, black 24px, black calc(100% - 24px), transparent)',
            }}
        >
            {/* стрелки: видны только на sm+; внутри контейнера */}
            <button
                type="button"
                aria-label="Прокрутить влево"
                onClick={() => scrollBy(-280)}
                disabled={!canScrollLeft}
                className=" items-center justify-center absolute md:left-4 left-1 top-1/2 -translate-y-1/2 z-90 h-7 w-7 rounded-full border bg-white/90 text-sm shadow disabled:opacity-40"
            >
                ‹
            </button>
            <button
                type="button"
                aria-label="Прокрутить вправо"
                onClick={() => scrollBy(280)}
                disabled={!canScrollRight}
                className=" items-center justify-center absolute md:right-4 right-1 top-1/2 -translate-y-1/2 z-90 h-7 w-7 rounded-full border bg-white/90 text-sm shadow disabled:opacity-40"
            >
                ›
            </button>

            {/* лента табов; паддинги под стрелки, скролл только тут */}
            <div
                ref={scrollerRef}
                onKeyDown={onKeyDown}
                className="
          flex gap-2 overflow-x-auto scroll-smooth
          px-8 sm:px-10 md:px-12 pb-0.5
          scrollbar-none [&::-webkit-scrollbar]:hidden -ms-overflow-style:none scrollbar-width:none
        "
                role="tablist"
                aria-label="Фильтры объявлений"
                tabIndex={0}
                style={{ scrollPaddingLeft: 16, scrollPaddingRight: 16 }}
            >
                {tabs.map((t) => {
                    const isActive = t.key === selectedKey;
                    const count = totals?.[t.key];
                    return (
                        <button
                            key={t.key}
                            role="tab"
                            aria-selected={isActive}
                            data-active={isActive ? 'true' : undefined}
                            onClick={() => onChange(t.key)}
                            className={[
                                "whitespace-nowrap rounded-t-md border-b-2 px-4  text-sm font-medium",
                                isActive ? "border-[#0036A5] text-[#0036A5] pb-2" : "border-transparent text-gray-500 hover:text-gray-700"
                            ].join(' ')}
                        >
                            {t.label}{" "}
                            {typeof count === 'number' ? `(${count})` : (loading ? '(…)' : '')}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}