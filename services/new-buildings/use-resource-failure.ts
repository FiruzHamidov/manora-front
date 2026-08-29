'use client';

import { useEffect, useRef } from 'react';
import { residentialResourceFailure } from './analytics';
import { trackResidential } from './track';

/** Observe the component's error state once per retry, without changing SDK/player lifecycle. */
export function useResidentialResourceFailure(failed: boolean, attempt: number, context: {
  surface: 'catalog' | 'building'; endpoint: 'map-sdk' | 'video-player'; building_id?: number;
}) {
  const { surface, endpoint, building_id } = context;
  const reporter = useRef<{ key: string; report: () => void } | null>(null);
  useEffect(() => {
    if (!failed) return;
    const key = [surface, endpoint, building_id, attempt].join(':');
    if (reporter.current?.key !== key) reporter.current = {
      key, report: residentialResourceFailure({ surface, endpoint, building_id }, trackResidential),
    };
    reporter.current.report();
  }, [failed, attempt, surface, endpoint, building_id]);
}
