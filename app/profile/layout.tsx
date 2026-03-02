import { ReactNode } from 'react';
import MainShell from '@/app/_components/manora/MainShell';

export default function ProfileLayout({ children }: { children: ReactNode }) {
    return (
        <MainShell>
            <div className="mx-auto w-full max-w-[1520px] px-4 sm:px-6 lg:px-8 pt-4 pb-24">
                {/*<Sidebar />*/}

                {/* Контент */}
                <div className="mt-1 min-w-0">
                    {children}
                </div>
            </div>
        </MainShell>
    );
}
