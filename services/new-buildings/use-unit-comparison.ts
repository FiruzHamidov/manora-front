'use client';

import { useMemo, useState, useSyncExternalStore } from 'react';
import { UNIT_COMPARISON_KEY, UNIT_COMPARISON_EVENT, parseUnitComparison, changeUnitComparison, type UnitReference } from './unit-comparison';

const serverSnapshot = () => '';
function snapshot(): string {
  try { return window.localStorage.getItem(UNIT_COMPARISON_KEY) ?? ''; }
  catch { return 'unavailable'; }
}
function subscribe(notify: () => void) {
  const storage = (event: StorageEvent) => { if (!event.key || event.key === UNIT_COMPARISON_KEY) notify(); };
  window.addEventListener('storage', storage); window.addEventListener(UNIT_COMPARISON_EVENT, notify);
  return () => { window.removeEventListener('storage', storage); window.removeEventListener(UNIT_COMPARISON_EVENT, notify); };
}
export function useUnitComparison() {
  const raw = useSyncExternalStore(subscribe, snapshot, serverSnapshot);
  const state = useMemo(() => parseUnitComparison(raw), [raw]);
  const [busy, setBusy] = useState(false), [error, setError] = useState<string | null>(null);
  async function change(ref: UnitReference, add: boolean) {
    setBusy(true); setError(null);
    try {
      if (!navigator.locks) throw new Error('Для сохранения сравнения обновите браузер.');
      await navigator.locks.request(UNIT_COMPARISON_KEY, async () => {
        const current = parseUnitComparison(snapshot());
        if (current.error) throw new Error(current.error);
        const units = changeUnitComparison(current.units, ref, add);
        window.localStorage.setItem(UNIT_COMPARISON_KEY, JSON.stringify({ version: 1, units }));
        window.dispatchEvent(new Event(UNIT_COMPARISON_EVENT));
      });
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Не удалось сохранить сравнение.'); }
    finally { setBusy(false); }
  }
  return { ...state, error: state.error || error, busy, change };
}
