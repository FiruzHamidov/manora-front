import { ReactNode } from 'react';
import { cookies } from 'next/headers';
import MainShell from '@/app/_components/manora/MainShell';
import { Sidebar } from './_components/sidebar';

export default async function ProfileLayout({ children }: { children: ReactNode }) {
    const cookieStore = await cookies();
    const hasAuthToken = Boolean(cookieStore.get('auth_token')?.value);

    return (
        <MainShell>
            {hasAuthToken ? <Sidebar /> : null}
            <div
                className={`mx-auto w-full max-w-[1520px] px-4 pt-4 pb-24 sm:px-6 lg:px-8 ${
                    hasAuthToken ? 'lg:pl-[128px] xl:pl-[136px]' : ''
                }`}
            >
                <div className="mt-1 min-w-0">
                    {children}
                </div>
            </div>
        </MainShell>
    );
}
