import type { Metadata } from 'next';
import AppStoreLinks from '@/app/_components/manora/AppStoreLinks';

export const metadata: Metadata = {
  title: 'Скачать приложение Manora',
  description: 'Manora для iPhone, iPad и Android: недвижимость и автомобили в Таджикистане.',
};

export default function DownloadPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-3xl font-bold text-[#172A21]">Manora всегда под рукой</h1>
      <p className="mb-6 mt-4 text-lg text-[#666F8D]">
        Ищите недвижимость и автомобили, сохраняйте объявления и общайтесь с продавцами.
        Выберите магазин для вашего устройства.
      </p>
      <AppStoreLinks />
    </main>
  );
}
