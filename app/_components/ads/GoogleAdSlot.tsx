'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { reserveSessionAdSlot } from '@/app/_components/ads/policy';

declare global {
    interface Window {
        adsbygoogle?: unknown[];
    }
}

type GoogleAdSlotProps = {
    slot: string;
    format?: string;
    fullWidthResponsive?: 'true' | 'false';
    layout?: string;
    layoutKey?: string;
    className?: string;
};

export default function GoogleAdSlot({
    slot,
    format = 'auto',
    fullWidthResponsive = 'true',
    layout,
    layoutKey,
    className = '',
}: GoogleAdSlotProps) {
    const adsClientId = process.env.NEXT_PUBLIC_GOOGLE_ADS_CLIENT_ID;
    const isAdsEnabled = process.env.NODE_ENV === 'production' && Boolean(adsClientId);
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const adRef = useRef<HTMLModElement | null>(null);
    const [isSlotAllowed, setIsSlotAllowed] = useState(false);

    useEffect(() => {
        if (!isAdsEnabled) return;
        setIsSlotAllowed(reserveSessionAdSlot());
    }, [isAdsEnabled]);

    useEffect(() => {
        if (!isAdsEnabled || !isSlotAllowed) return;

        let intervalId: number | null = null;
        let timeoutId: number | null = null;

        const pushAd = () => {
            const node = adRef.current;
            if (!node) return false;

            // Prevent duplicate push for an already initialized node.
            if (node.getAttribute('data-adsbygoogle-status')) return true;

            try {
                if (window.adsbygoogle) {
                    window.adsbygoogle.push({});
                    return true;
                }
            } catch {
                // noop
            }
            return false;
        };

        if (!pushAd()) {
            intervalId = window.setInterval(() => {
                if (pushAd() && intervalId) {
                    window.clearInterval(intervalId);
                    intervalId = null;
                }
            }, 200);

            timeoutId = window.setTimeout(() => {
                if (intervalId) {
                    window.clearInterval(intervalId);
                    intervalId = null;
                }
            }, 3000);
        }

        return () => {
            if (intervalId) window.clearInterval(intervalId);
            if (timeoutId) window.clearTimeout(timeoutId);
        };
    }, [isAdsEnabled, isSlotAllowed, pathname, searchParams?.toString()]);

    if (!isAdsEnabled || !isSlotAllowed) return null;

    return (
        <ins
            ref={adRef}
            className={`adsbygoogle adbanner-customize ${className}`.trim()}
            style={{
                display: 'block',
                overflow: 'hidden',
                border: process.env.NODE_ENV === 'development' ? '1px solid red' : 'none',
                minWidth: '250px',
            }}
            data-ad-client={adsClientId}
            data-ad-slot={slot}
            data-ad-format={format}
            data-full-width-responsive={fullWidthResponsive}
            data-ad-layout={layout}
            data-ad-layout-key={layoutKey}
        />
    );
}
