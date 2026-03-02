'use client';

import type { ReactNode } from 'react';

type MainShellProps = {
  children: ReactNode;
};

export default function MainShell({ children }: MainShellProps) {
  return <div className="min-h-screen">{children}</div>;
}
