'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

// Fixed absolute timestamp: 2026-02-16 17:30 at UTC+5 == 2026-02-16 12:30 UTC
const OPENING_AT_MS = Date.UTC(2026, 1, 16, 12, 30, 0);
const HIDE_AFTER_DAYS = 7;

type Countdown = {
  hours: number;
  minutes: number;
  seconds: number;
  isOver: boolean;
};

function getCountdown(targetMs: number): Countdown {
  const now = Date.now();
  const diff = targetMs - now;

  if (diff <= 0) {
    return { hours: 0, minutes: 0, seconds: 0, isOver: true };
  }

  const totalSeconds = Math.floor(diff / 1000);
  const hours = Math.floor(totalSeconds / (60 * 60));
  const minutes = Math.floor((totalSeconds % (60 * 60)) / 60);
  const seconds = totalSeconds % 60;

  return { hours, minutes, seconds, isOver: false };
}

function pad2(value: number): string {
  return String(value).padStart(2, '0');
}

export default function BranchOpeningTopBanner() {
  const [mounted, setMounted] = useState(false);
  const [countdown, setCountdown] = useState<Countdown>(() => getCountdown(OPENING_AT_MS));

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const timer = window.setInterval(() => {
      setCountdown(getCountdown(OPENING_AT_MS));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [mounted]);

  const timerParts = useMemo(() => {
    if (countdown.isOver) return null;
    return {
      hours: pad2(countdown.hours),
      minutes: pad2(countdown.minutes),
      seconds: pad2(countdown.seconds),
    };
  }, [countdown]);

  const shouldHideBanner = useMemo(() => {
    const hideAtTs = OPENING_AT_MS + HIDE_AFTER_DAYS * 24 * 60 * 60 * 1000;
    return Date.now() >= hideAtTs;
  }, [countdown]);

  if (!mounted || shouldHideBanner) return null;

  return (
    <div className="h-[72px] w-full bg-gradient-to-r from-[#0036A5] via-[#0A62FF] to-[#1D4ED8] text-white">
      <div className="relative mx-auto h-full max-w-[1520px] px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-3 overflow-visible">
        <div className="pointer-events-none absolute left-1/2 top-1/2 z-0 -translate-x-1/2 -translate-y-1/2 opacity-100">
          <div className="flex items-center justify-center gap-2 sm:gap-4">
            <iframe
              title="Opening celebration left"
              className="h-[90px] w-[90px] sm:h-[120px] sm:w-[120px]"
              src="https://lottie.host/embed/948dec6b-78ef-4b7b-b7a3-fe337713fa58/FdNOvR8ic9.lottie"
            />
            <iframe
              title="Opening celebration center"
              className="h-[140px] w-[140px] sm:h-[180px] sm:w-[180px]"
              src="https://lottie.host/embed/948dec6b-78ef-4b7b-b7a3-fe337713fa58/FdNOvR8ic9.lottie"
            />
            <iframe
              title="Opening celebration right"
              className="h-[90px] w-[90px] sm:h-[120px] sm:w-[120px]"
              src="https://lottie.host/embed/948dec6b-78ef-4b7b-b7a3-fe337713fa58/FdNOvR8ic9.lottie"
            />
          </div>
        </div>
        <div className="relative z-[1] min-w-0">
          <p className="text-sm sm:text-base font-semibold truncate">
            {countdown.isOver
              ? 'У нас открылся новый филиал Manora'
              : 'Сегодня открытие нового филиала Manora'}
          </p>
          <p className="text-[11px] sm:text-xs text-blue-100 truncate">
            {countdown.isOver ? 'Ждём вас в новом офисе' : '16 февраля, 17:30'}
          </p>
        </div>
        <div className="relative z-[1] shrink-0 flex items-center gap-3">
          {!countdown.isOver && (
            <div className="hidden sm:flex items-end gap-3 sm:gap-4 text-white">
              <div className="flex flex-col items-center leading-none">
                <span className="text-2xl sm:text-4xl font-extrabold tabular-nums tracking-wide">{timerParts?.hours}</span>
                <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wide mt-1">час</span>
              </div>
              <div className="flex flex-col items-center leading-none">
                <span className="text-2xl sm:text-4xl font-extrabold tabular-nums tracking-wide">{timerParts?.minutes}</span>
                <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wide mt-1">минута</span>
              </div>
              <div className="flex flex-col items-center leading-none">
                <span className="text-2xl sm:text-4xl font-extrabold tabular-nums tracking-wide">{timerParts?.seconds}</span>
                <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wide mt-1 opacity-0 select-none">сек</span>
              </div>
            </div>
          )}
          <Link
            href="/branches"
            className="inline-flex items-center justify-center rounded-full bg-white text-[#0036A5] px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-semibold shadow-sm hover:bg-blue-50 transition-colors"
          >
            Посмотреть
          </Link>
        </div>
      </div>
    </div>
  );
}
