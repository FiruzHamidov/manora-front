import { APP_STORE_URL, GOOGLE_PLAY_URL } from '@/constants/app-links';

export default function AppStoreLinks() {
  return (
    <div className="flex flex-wrap gap-2">
      {[
        { href: APP_STORE_URL, name: 'App Store', device: 'Для iPhone и iPad' },
        { href: GOOGLE_PLAY_URL, name: 'Google Play', device: 'Для Android' },
      ].map(({ href, name, device }) => (
        <a key={name} href={href} target="_blank" rel="noopener noreferrer"
          aria-label={`Скачать Manora в ${name}`}
          className="flex min-h-12 min-w-36 flex-col justify-center rounded-xl bg-[#172A21] px-4 py-2 text-white transition-colors hover:bg-[#006341] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#006341]">
          <span className="text-xs text-white/80">{device}</span>
          <span className="text-base font-semibold">{name}</span>
        </a>
      ))}
    </div>
  );
}
