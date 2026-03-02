'use client';

import NewsBanner from './_components/banner';
import NewsGrid from './_components/news-grid';

export default function NewsPage() {
  return (
    <div className="mx-auto w-full max-w-[1520px] px-4 sm:px-6 lg:px-8 pt-10 mb-14 md:pb-[130px]">
      <NewsBanner />
      <NewsGrid />
    </div>
  );
}
