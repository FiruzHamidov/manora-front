'use client';
import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';

declare global {
  interface Window {
    BX24?: unknown;
  }
}

type Props = { children: ReactNode };

export default function HeaderAndFooterGate({ children }: Props) {
  const pathname = usePathname();
  const isIframe =
    typeof window !== 'undefined' && window.self !== window.top;
  const isBxEmbed =
    typeof window !== 'undefined' && Boolean(window.BX24);

  const isEmbed = isIframe || isBxEmbed;
  const isLegacyAuraRoute = pathname?.startsWith('/aura');

  return isEmbed || isLegacyAuraRoute ? null : <>{children}</>;
}
