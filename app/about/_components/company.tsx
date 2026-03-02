import Image from 'next/image';

export const Company = () => {
  return (
    <div className="pb-10 md:pb-[60px]">
      <h1 className="text-3xl md:text-[56px] font-bold mb-5 md:mb-[31px] text-[#020617]">
        О компании
      </h1>

      <div className="flex flex-col md:flex-row items-start justify-between gap-10 mb-11">
        <div className="max-w-2xl">
          <p className="md:text-lg text-[#666F8D] leading-relaxed">
            Эта платформа разработана, чтобы помочь людям быстро получать
            актуальную информацию по Таджикистану. Мы делаем поиск недвижимости
            доступным и удобным для каждого жителя нашей солнечной страны.
          </p>
        </div>

        <div className="hidden md:block md:max-w-sm xl:max-w-md">
          <Image
            src="/logo.svg"
            alt="Manora"
            width={430}
            height={139}
            className="w-[430px] h-[139px] object-contain"
          />
        </div>
      </div>

      <div className="flex flex-nowrap overflow-x-auto scroll-smooth pb-2 gap-4 md:gap-5 mb-10 md:mb-16 -mx-4 px-4 md:mx-0 md:px-0 hide-scrollbar">
        <div className="bg-white py-[18px] px-6 rounded-xl min-w-[260px] md:min-w-0 md:w-max flex-shrink-0">
          <h2 className="text-[32px] font-bold text-[#0036A5] mb-1">$100M</h2>
          <p className="text-[#666F8D] whitespace-normal">
            Текущий объем листинга
          </p>
        </div>

        <div className="bg-white py-[18px] px-6 rounded-xl min-w-[260px] md:min-w-0 md:w-max flex-shrink-0">
          <h2 className="text-[32px] font-bold text-[#0036A5] mb-1">$400M</h2>
          <p className="text-[#666F8D] whitespace-normal">
            Всего продано за 2019-2024 г.
          </p>
        </div>

        <div className="bg-white py-[18px] px-6 rounded-xl min-w-[260px] md:min-w-0 md:w-max flex-shrink-0">
          <h2 className="text-[32px] font-bold text-[#0036A5] mb-1">$2B</h2>
          <p className="text-[#666F8D] whitespace-normal">
            Объем продаж за весь срок службы
          </p>
        </div>
      </div>

      <iframe
        width="100%"
        height="420"
        src="https://www.youtube.com/embed/-FE4Po023WY?si=JCakGqwz3TTBbB8S"
        title="YouTube video player"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className="rounded-[22px] h-[220px] md:h-[420px]"
      ></iframe>
    </div>
  );
};
