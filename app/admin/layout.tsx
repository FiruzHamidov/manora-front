import { ReactNode } from 'react';

export default function ProfileLayout({ children }: { children: ReactNode }) {
  return (
      <div className="mx-auto w-full max-w-[1520px] px-4 sm:px-6 lg:px-8 pt-4 pb-24">
        {/*<Sidebar />*/}

        {/* Контент */}
        <main className="mt-1 min-w-0">
          {children}
        </main>
      </div>
  );
}
