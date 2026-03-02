import NewsCard from './news-card';

const newsItems = [
  {
    id: 1,
    title:
      'Цены на квартиры в Душанбе выросли на 12% за первый квартал 2025 года',
    date: '31.12.2024',
    imageUrl: '/images/news/1.jpeg',
    href: '/about/news/price-increase',
  },
  {
    id: 2,
    title: 'Как выбрать идеальную квартиру: 5 шагов от наших специалистов',
    date: '28.12.2024',
    imageUrl: '/images/news/2.jpeg',
    href: '/about/news/apartment-guide',
  },
  {
    id: 3,
    title: 'Открыта продажа квартир в новом жилом комплексе «Сафо»',
    date: '31.12.2024',
    imageUrl: '/images/news/3.jpeg',
    href: '/about/news/safo-complex',
  },
];

const NewsGrid = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[22px]">
      {newsItems.map((news) => (
        <NewsCard
          key={news.id}
          title={news.title}
          date={news.date}
          imageUrl={news.imageUrl}
          href={news.href}
        />
      ))}
    </div>
  );
};

export default NewsGrid;
