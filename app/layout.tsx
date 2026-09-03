// app/layout.tsx
import { ReactNode, Suspense } from 'react';
import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import './globals.css';
import MainFooter from './_components/manora/MainFooter';
import MainHeader from './_components/manora/MainHeader';
import BranchOpeningTopBanner from './_components/BranchOpeningTopBanner';
import BranchOpeningPopup from './_components/BranchOpeningPopup';
import MobileBottomNavigation from './_components/MobileBottomNavigation';
import { QueryProvider } from '@/utils/providers';
import GoogleAnalyticsClient from '@/google-analytics-client';
import ToastProvider from '@/app/_components/_providers/ToastProvider';
import ClientChatMount from '@/app/_components/client-chat-mount';
import HeaderAndFooterGate from '@/app/_components/layout/HeaderAndFooterGate';
import AuthModalMount from '@/app/_components/auth/AuthModalMount';
import AuthGateMount from '@/app/_components/auth/AuthGateMount';
import PushNotificationMount from '@/app/_components/push-notification-mount';

const SITE_URL = 'https://manora.tj';
const GA_ID = process.env.NEXT_PUBLIC_GA_ID ?? '';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Manora.tj — Недвижимость и авто в Таджикистане',
    template: '%s — Manora.tj',
  },
  description:
    'Manora.tj — поиск, покупка и аренда недвижимости и авто в Таджикистане. Умные фильтры и актуальные объявления.',
  applicationName: 'Manora.tj',
  keywords: [
    'недвижимость',
    'квартиры',
    'аренда',
    'покупка',
    'Душанбе',
    'Таджикистан',
    'manora.tj',
  ],
  authors: [{ name: 'Manora.tj' }],
  openGraph: {
    type: 'website',
    url: SITE_URL,
    siteName: 'Manora.tj',
    title: 'Manora.tj — Недвижимость и авто в Таджикистане',
    description:
      'Поиск, покупка и аренда недвижимости и авто в Таджикистане. Удобные фильтры и актуальные объявления.',
    images: [
      {
        url: '/manora.svg',
        width: 1200,
        height: 630,
        alt: 'Manora.tj',
      },
    ],
    locale: 'ru_RU',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Manora.tj — Недвижимость и авто в Таджикистане',
    description:
      'Поиск, покупка и аренда недвижимости и авто в Таджикистане. Удобные фильтры и актуальные объявления.',
    images: ['/manora.svg'],
  },
  alternates: {
    canonical: '/',
    languages: {
      ru: '/',
    },
  },
  icons: {
    icon: [
      { url: '/manora.svg', type: 'image/svg+xml' },
      {
        url: '/manora.svg',
        sizes: '32x32',
        type: 'image/svg+xml',
      },
      {
        url: '/manora.svg',
        sizes: '192x192',
        type: 'image/svg+xml',
      },
      {
        url: '/manora.svg',
        sizes: '512x512',
        type: 'image/svg+xml',
      },
    ],
    shortcut: ['/manora.svg'],
    apple: [{ url: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
    other: [
      {
        rel: 'mask-icon',
        url: '/manora.svg',
        color: '#006341',
      },
    ],
  },
  manifest: '/site.webmanifest', // PWA манифест, если используешь
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  appleWebApp: {
    statusBarStyle: 'default',
    title: 'Manora.tj',
    capable: true,
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default async function RootLayout({
  children,
  modal,
}: {
  children: ReactNode;
  modal: ReactNode;
}) {
  const adsClientId = process.env.NEXT_PUBLIC_GOOGLE_ADS_CLIENT_ID;
  const shouldLoadAdsScript =
    process.env.NODE_ENV === 'production' && Boolean(adsClientId);
  // Enable only after automatic history/search/form events are disabled in GA.
  const shouldLoadGaScript = Boolean(GA_ID) && process.env.NEXT_PUBLIC_GA_MANUAL_EVENTS_ONLY === 'true';
  const organizationLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Manora.tj',
    url: SITE_URL,
    logo: `${SITE_URL}/manora.svg`,
  };
  const websiteLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Manora.tj',
    url: SITE_URL,
    publisher: {
      '@type': 'Organization',
      name: 'Manora.tj',
      logo: `${SITE_URL}/manora.svg`,
    },
  };

  return (
    <html lang="ru">
      <head>
        <meta
          name="theme-color"
          media="(prefers-color-scheme: light)"
          content="#00000000"
        />
        <meta
          name="theme-color"
          media="(prefers-color-scheme: dark)"
          content="#00000000"
        />
        <meta name="mobile-web-app-capable" content="yes" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteLd) }}
        />

        {shouldLoadAdsScript && (
          <Script
            async
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsClientId}`}
            strategy="lazyOnload"
            crossOrigin="anonymous"
          ></Script>
        )}

        {shouldLoadGaScript && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
              strategy="afterInteractive"
            />
            <Script
              id="ga-loader"
              strategy="afterInteractive"
              dangerouslySetInnerHTML={{
                __html: `
                  window.dataLayer = window.dataLayer || [];
                  function gtag(){dataLayer.push(arguments);}
                  window.gtag = gtag;
                  gtag('js', new Date());
                  gtag('config', '${GA_ID}', {
                    send_page_view: false,
                    page_location: '${SITE_URL}/', page_path: '/', page_title: 'Manora', page_referrer: '',
                    allow_google_signals: false, allow_ad_personalization_signals: false
                  });
                  window.dispatchEvent(new Event('manora:ga-ready'));
                `,
              }}
            />
          </>
        )}
      </head>
      <body className="antialiased">
        <Suspense fallback={null}>
          <QueryProvider>
            <HeaderAndFooterGate>
              <BranchOpeningTopBanner />
              <BranchOpeningPopup />
              <MainHeader />
            </HeaderAndFooterGate>

            <main>{children}</main>
            {modal}
            <AuthGateMount />
            <AuthModalMount />
            <PushNotificationMount />
            <ToastProvider />
            <HeaderAndFooterGate>
              <MobileBottomNavigation />
              <ClientChatMount />
              <MainFooter />
            </HeaderAndFooterGate>
          </QueryProvider>

          {/* SPA-хиты */}
          {shouldLoadGaScript && <GoogleAnalyticsClient gaId={GA_ID} />}
        </Suspense>
      </body>
    </html>
  );
}
