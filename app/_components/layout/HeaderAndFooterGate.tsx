'use client';
import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';

type Props = { children: ReactNode };

export default function HeaderAndFooterGate({ children }: Props) {
  const pathname = usePathname();
  const isIframe =
    typeof window !== 'undefined' && window.self !== window.top;
  const isLegacyAuraRoute = pathname?.startsWith('/aura');
  const isAdminRoute = pathname?.startsWith('/admin');

  return isIframe || isLegacyAuraRoute || isAdminRoute ? null : <>{children}</>;
}
