'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { resolveAuthRouteByCode, useAuthGate } from '@/services/login/hooks';

const GATE_ROUTES = new Set([
  '/complete-profile',
  '/auth/pending',
  '/auth/rejected',
  '/auth/inactive',
  '/login',
  '/register',
]);

export default function AuthGateMount() {
  const pathname = usePathname();
  const router = useRouter();
  const { data } = useAuthGate(true);

  useEffect(() => {
    const code = data?.auth_state?.code;
    if (!code || !pathname) return;

    if (code !== 'OK') {
      const target = resolveAuthRouteByCode(code);
      if (pathname !== target) {
        router.replace(target);
      }
      return;
    }

    if (GATE_ROUTES.has(pathname)) {
      router.replace('/profile');
    }
  }, [data?.auth_state?.code, pathname, router]);

  return null;
}
