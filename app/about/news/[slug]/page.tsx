import NewsBanner from './_components/banner';
import NewsContentCard from './_components/news-content-card';

const NewsSlug = () => {
  return (
    <div className="mx-auto w-full max-w-[1520px] px-4 sm:px-6 lg:px-8 pt-10 pb-[54px]">
      <NewsBanner />
      <NewsContentCard />
    </div>
  );
};

export default NewsSlug;
