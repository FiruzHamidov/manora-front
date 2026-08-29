'use client';

import type ymaps from 'yandex-maps';

declare global { interface Window { ymaps?: typeof ymaps } }

let sdkPromise: Promise<typeof ymaps> | null = null;

/** Load the official Maps 2.1 SDK once for React-independent map renderers. */
export function loadYandexMaps(): Promise<typeof ymaps> {
  if (window.ymaps) return new Promise(resolve => window.ymaps!.ready(() => resolve(window.ymaps!)));
  if (sdkPromise) return sdkPromise;
  sdkPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    let settled = false;
    const fail = (error: Error) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timeout);
      script.remove();
      sdkPromise = null;
      reject(error);
    };
    const succeed = (sdk: typeof ymaps) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timeout);
      resolve(sdk);
    };
    const timeout = window.setTimeout(() => fail(new Error('Yandex Maps API timed out')), 12_000);
    const query = new URLSearchParams({ lang: 'ru_RU' });
    const apiKey = process.env.NEXT_PUBLIC_YANDEX_MAPS_API_KEY;
    if (apiKey) query.set('apikey', apiKey);
    script.src = `https://api-maps.yandex.ru/2.1/?${query}`;
    script.async = true;
    script.dataset.manoraYandexMaps = 'true';
    script.onload = () => window.ymaps ? window.ymaps.ready(() => window.ymaps ? succeed(window.ymaps) : fail(new Error('Yandex Maps API is unavailable'))) : fail(new Error('Yandex Maps API is unavailable'));
    script.onerror = () => fail(new Error('Yandex Maps API failed to load'));
    document.head.appendChild(script);
  });
  return sdkPromise;
}
