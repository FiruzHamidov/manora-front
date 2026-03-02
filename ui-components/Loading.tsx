'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import Logo from '@/icons/Logo';

export const Loading = () => {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return createPortal(
      <div
          className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-xs pointer-events-none"
          aria-hidden="false"
          role="status"
          aria-live="polite"
          tabIndex={-1}
      >
        <div className="pointer-events-auto flex flex-col items-center">
          <div className="animate-pulse">
            <Logo className="w-36 h-11" />
          </div>

          <span className="sr-only">Загрузка…</span>

          <div className="mt-6 flex space-x-2">
            <div className="w-2 h-2 bg-white rounded-full animate-bounce" />
            <div
                className="w-2 h-2 bg-white rounded-full animate-bounce"
                style={{ animationDelay: '0.1s' }}
            />
            <div
                className="w-2 h-2 bg-white rounded-full animate-bounce"
                style={{ animationDelay: '0.2s' }}
            />
          </div>
        </div>
      </div>,
      document.body
  );
};