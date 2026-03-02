'use client';

import { ReactNode } from 'react';

interface FormLayoutProps {
  children: ReactNode;
  title?: string;
  description?: string;
  className?: string;
}

export function FormLayout({
  children,
  title,
  description,
  className = '',
}: FormLayoutProps) {
  return (
    <div className={`sm:mx-auto w-full max-w-[1520px] lg:px-8 mx-auto px-0 sm:px-4 py-8 ${className}`}>
      <div className="max-w-4xl mx-auto">
        {title && (
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{title}</h1>
            {description && (
              <p className="text-gray-600 text-lg">{description}</p>
            )}
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-8">{children}</div>
      </div>
    </div>
  );
}
