import Image from 'next/image';

const cardsData = [
  {
    image: '/images/extra-pages/handshake.png',
    description: 'Проконсультироваться',
  },
  {
    image: '/images/extra-pages/document.png',
    description: 'Оценить квартиру',
  },
  {
    image: '/images/extra-pages/gold-money.png',
    description: 'Разместить рекламу',
  },
  {
    image: '/images/extra-pages/home-search.png',
    description: 'Заключение сделки',
  },
];

export const Cards = () => {
  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between gap-4 md:gap-5">
        {cardsData?.map((item, index) => (
          <div
            key={index}
            className="bg-white rounded-2xl px-6 md:px-[30px] pt-6 md:pt-10 pb-8 md:pb-[50px] flex-1"
          >
            <Image
              src={item.image}
              alt={item.description}
              width={144}
              height={144}
              className="mb-4 md:mb-[26px] mx-auto w-20 h-20 md:w-36 md:h-36 object-contain"
            />
            <p className="text-base md:text-[20px] text-center leading-5 md:leading-normal text-[#353E5C]">
              {item.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};
