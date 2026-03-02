'use client';

import Image from 'next/image';

type ManoraLoadingProps = {
  text?: string;
  className?: string;
  fullscreen?: boolean;
};

export default function ManoraLoading({
  text = 'Загрузка данных...',
  className = '',
  fullscreen = false,
}: ManoraLoadingProps) {
  const content = (
    <div className={`flex flex-col items-center justify-center py-10 ${className}`}>
      <div className="relative h-[64px] w-[280px]">
        <Image
          src="/logo.svg"
          alt="Manora"
          fill
          className="object-contain"
          priority
        />
        <span className="pointer-events-none absolute left-[4px] top-[19px] h-[48px] w-[48px] rounded-full border-[10px] border-[#FFFFFF] border-b-transparent border-r-transparent animate-spin" />
      </div>
      <p className="mt-4 text-sm font-medium text-[#334155]">{text}</p>
    </div>
  );

  if (fullscreen) {
    return (
      <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/25 backdrop-blur-md">
        {content}
      </div>
    );
  }

  return (
    content
  );
}
