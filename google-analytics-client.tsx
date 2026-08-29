'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { analyticsPage } from '@/services/new-buildings/analytics';

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

type Props = {
  gaId: string;
};

export default function GoogleAnalyticsClient({ gaId }: Props) {
  const pathname = usePathname();
  const last = useRef<string | null>(null);

  useEffect(() => {
    const path = analyticsPage(pathname);
    if (!path) { last.current = null; return; }
    const send = () => {
      if (!window.gtag || last.current === path) return;
      last.current = path;
      window.gtag('event', 'page_view', {
        send_to: gaId, page_path: path, page_location: window.location.origin + path,
        page_title: 'Manora', page_referrer: '',
      });
    };
    window.addEventListener('manora:ga-ready', send);
    send();
    return () => window.removeEventListener('manora:ga-ready', send);
  }, [gaId, pathname]);

  return null;
}
