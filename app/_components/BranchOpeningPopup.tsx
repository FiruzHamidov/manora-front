'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { X } from 'lucide-react';

// Fixed absolute timestamp: 2026-02-16 17:30 at UTC+5 == 2026-02-16 12:30 UTC
const OPENING_AT_MS = Date.UTC(2026, 1, 16, 12, 30, 0);
const HIDE_AFTER_DAYS = 3;
const HIDE_AT_MS = OPENING_AT_MS + HIDE_AFTER_DAYS * 24 * 60 * 60 * 1000;
const POPUP_SEEN_SESSION_KEY = 'branch_opening_popup_seen_session_v1';
const LOCATION_ASKED_KEY = 'locationPreferenceAsked';

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

export default function BranchOpeningPopup() {
  const [countdown, setCountdown] = useState<Countdown>(() => getCountdown(OPENING_AT_MS));
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [cityModalOpen, setCityModalOpen] = useState(false);
  const [canShow, setCanShow] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNowMs(Date.now());
      setCountdown(getCountdown(OPENING_AT_MS));
    }, 1000);

    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const asked = localStorage.getItem(LOCATION_ASKED_KEY) === '1';
    const seen = sessionStorage.getItem(POPUP_SEEN_SESSION_KEY) === '1';

    setCanShow(asked);
    setOpen(asked && !seen);

    const onLocationDone = () => {
      const alreadySeen = sessionStorage.getItem(POPUP_SEEN_SESSION_KEY) === '1';
      setCanShow(true);
      setOpen(!alreadySeen);
    };

    const onCityModalVisibility = (event: Event) => {
      const payload = (event as CustomEvent<{ open?: boolean }>).detail;
      setCityModalOpen(Boolean(payload?.open));
    };

    window.addEventListener('location-choice-complete', onLocationDone);
    window.addEventListener('city-modal-visibility', onCityModalVisibility as EventListener);

    return () => {
      window.removeEventListener('location-choice-complete', onLocationDone);
      window.removeEventListener('city-modal-visibility', onCityModalVisibility as EventListener);
    };
  }, []);

  const shouldHideByDate = nowMs >= HIDE_AT_MS;

  const timerParts = useMemo(() => {
    if (countdown.isOver) return null;
    return {
      hours: pad2(countdown.hours),
      minutes: pad2(countdown.minutes),
      seconds: pad2(countdown.seconds),
    };
  }, [countdown]);

  const closePopup = () => {
    sessionStorage.setItem(POPUP_SEEN_SESSION_KEY, '1');
    setOpen(false);
  };

  if (!canShow || shouldHideByDate || !open || cityModalOpen) return null;

  return (
    <div className="fixed inset-0 z-[10010] flex items-center justify-center p-3 sm:p-4">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={closePopup} />

      <div className="relative w-full max-w-[700px] min-h-[440px] sm:min-h-[500px] overflow-visible rounded-3xl bg-gradient-to-r from-[#0036A5] via-[#0A62FF] to-[#1D4ED8] shadow-[0_24px_70px_rgba(2,6,23,0.45)]">
        {/* side burst effect */}
        <span className="pointer-events-none absolute left-[-44px] top-1/2 -translate-y-1/2 h-36 w-36 rounded-full bg-cyan-200/35 blur-2xl animate-ping" />
        <span className="pointer-events-none absolute right-[-44px] top-1/2 -translate-y-1/2 h-36 w-36 rounded-full bg-pink-200/35 blur-2xl animate-ping" />
        <span className="pointer-events-none absolute left-[-6px] top-1/2 -translate-y-1/2 h-24 w-12 bg-gradient-to-r from-white/70 to-transparent blur-sm" />
        <span className="pointer-events-none absolute right-[-6px] top-1/2 -translate-y-1/2 h-24 w-12 bg-gradient-to-l from-white/70 to-transparent blur-sm" />

        {/* confetti particles from left */}
        <span className="pointer-events-none absolute left-8 top-[30%] h-2.5 w-2.5 rounded-full bg-yellow-300/90 animate-bounce" />
        <span className="pointer-events-none absolute left-14 top-[44%] h-2 w-2 rounded-full bg-lime-200/90 animate-ping" />
        <span className="pointer-events-none absolute left-10 top-[58%] h-2.5 w-2.5 rounded-full bg-cyan-200/90 animate-pulse" />
        <span className="pointer-events-none absolute left-20 top-[70%] h-2 w-2 rounded-full bg-fuchsia-200/90 animate-bounce" />

        {/* confetti particles from right */}
        <span className="pointer-events-none absolute right-8 top-[30%] h-2.5 w-2.5 rounded-full bg-pink-200/90 animate-bounce" />
        <span className="pointer-events-none absolute right-14 top-[44%] h-2 w-2 rounded-full bg-yellow-200/90 animate-ping" />
        <span className="pointer-events-none absolute right-10 top-[58%] h-2.5 w-2.5 rounded-full bg-indigo-200/90 animate-pulse" />
        <span className="pointer-events-none absolute right-20 top-[70%] h-2 w-2 rounded-full bg-cyan-200/90 animate-bounce" />

        <button
          type="button"
          onClick={closePopup}
          className="absolute right-3 top-3 z-10 rounded-lg p-1.5 text-white/90 hover:bg-white/20"
          aria-label="Закрыть уведомление"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="pointer-events-none absolute left-1/2 top-[56%] z-[0] -translate-x-1/2 -translate-y-1/2 opacity-95">
          <iframe
            title="Celebration effect"
            className="h-[460px] w-[460px] sm:h-[620px] sm:w-[620px]"
            src="https://lottie.host/embed/948dec6b-78ef-4b7b-b7a3-fe337713fa58/FdNOvR8ic9.lottie"
          />
        </div>

        <div className="relative z-[1] flex min-h-[440px] sm:min-h-[500px] flex-col items-center justify-center px-5 py-12 sm:px-8 text-center text-white">

          <h3 className="text-2xl sm:text-4xl font-bold leading-tight max-w-[620px]">
            {countdown.isOver
              ? 'Наш новый офис уже работает'
              : 'Скоро открытие нового офиса Manora'}
          </h3>
          <p className="mt-2 text-base sm:text-xl text-white/90">
            {countdown.isOver ? 'Ждём вас в новом офисе' : '16 февраля, 17:30'}
          </p>

          {countdown.isOver ? (
            <div className="mt-8 text-3xl sm:text-4xl font-bold"></div>
          ) : (
            <div className="mt-8 inline-flex items-end gap-4 sm:gap-8">
              <div className="flex flex-col items-center leading-none">
                <span className="text-6xl sm:text-8xl font-extrabold tabular-nums">{timerParts?.hours}</span>
                <span className="text-xs sm:text-sm font-semibold uppercase tracking-wide mt-2 text-white/90">час</span>
              </div>
              <div className="flex flex-col items-center leading-none">
                <span className="text-6xl sm:text-8xl font-extrabold tabular-nums">{timerParts?.minutes}</span>
                <span className="text-xs sm:text-sm font-semibold uppercase tracking-wide mt-2 text-white/90">минута</span>
              </div>
              <div className="flex flex-col items-center leading-none">
                <span className="text-6xl sm:text-8xl font-extrabold tabular-nums">{timerParts?.seconds}</span>
                <span className="text-xs sm:text-sm font-semibold uppercase tracking-wide mt-2 opacity-0 select-none">сек</span>
              </div>
            </div>
          )}

          <Link
            href="/branches"
            onClick={closePopup}
            className="mt-8 inline-flex items-center justify-center rounded-full bg-white px-5 py-2.5 text-sm sm:text-base font-semibold text-[#0036A5] shadow-md hover:bg-blue-50 transition-colors"
          >
            Посмотреть
          </Link>
        </div>
      </div>
    </div>
  );
}
