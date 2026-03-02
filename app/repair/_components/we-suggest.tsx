import Image from 'next/image';

const services = [
  {
    icon: (
      <svg
        width="42"
        height="42"
        viewBox="0 0 42 42"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M12.25 31.5C12.25 32.4665 11.4665 33.25 10.5 33.25C9.5335 33.25 8.75 32.4665 8.75 31.5C8.75 30.5335 9.5335 29.75 10.5 29.75C11.4665 29.75 12.25 30.5335 12.25 31.5Z"
          fill="#0036A5"
        />
        <path
          opacity="0.4"
          d="M17.5 10.5V31.5C17.5 35.366 14.366 38.5 10.5 38.5C6.63401 38.5 3.5 35.366 3.5 31.5V10.5C3.5 6.63401 6.63401 3.5 10.5 3.5C14.366 3.5 17.5 6.63401 17.5 10.5Z"
          fill="#0036A5"
        />
        <path
          opacity="0.7"
          d="M16.1832 35.5868L23.1382 28.6317L33.3549 17.975C36.0183 15.1969 35.972 10.7991 33.2506 8.07772C30.4881 5.31524 26.0092 5.31524 23.2467 8.07772L17.5 13.8245V31.4992C17.5 33.0249 17.0119 34.4367 16.1832 35.5868Z"
          fill="#0036A5"
        />
        <path
          d="M23.1382 28.633L16.1832 35.588C17.0102 34.4401 17.4981 33.0317 17.5 31.5093C17.4949 35.371 14.3629 38.5 10.5 38.5H31.324C35.19 38.5 38.324 35.366 38.324 31.5C38.324 27.634 35.19 24.5 31.324 24.5H27.1005L23.1382 28.633Z"
          fill="#0036A5"
        />
      </svg>
    ),
    title: 'Ремонт',
    description:
      'Качественный ремонт, выполненный по типовому решению или индивидуальному дизайн-проекту.',
    buttonText: 'Оставить заявку',
  },
  {
    icon: (
      <svg
        width="42"
        height="42"
        viewBox="0 0 42 42"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M22.3125 24.5H30.1C30.8732 24.5 31.5 23.8732 31.5 23.1V21C31.5 19.067 33.067 17.5 35 17.5C36.933 17.5 38.5 19.067 38.5 21V25.2778C38.5 27.1747 37.6511 28.8734 36.3125 30.0147V33.25C36.3125 33.9749 35.7249 34.5625 35 34.5625C34.2751 34.5625 33.6875 33.9749 33.6875 33.25V31.3396C33.2345 31.4445 32.7626 31.5 32.2778 31.5H9.72223C9.23737 31.5 8.76546 31.4445 8.3125 31.3396V33.25C8.3125 33.9749 7.72487 34.5625 7 34.5625C6.27513 34.5625 5.6875 33.9749 5.6875 33.25V30.0147C4.34888 28.8734 3.5 27.1747 3.5 25.2778V21C3.5 19.067 5.067 17.5 7 17.5C8.933 17.5 10.5 19.067 10.5 21V23.1C10.5 23.8732 11.1268 24.5 11.9 24.5H19.6875V8.75H22.3125V24.5Z"
          fill="#0036A5"
        />
        <g opacity="0.5">
          <path
            d="M30.1 24.5H22.3125V8.75H26.25C27.8763 8.75 28.6894 8.75 29.3656 8.8845C32.1425 9.43685 34.3132 11.6075 34.8655 14.3844C34.94 14.7591 34.9733 15.176 34.9881 15.75L35 15.75V17.5C33.067 17.5 31.5 19.067 31.5 21V23.1C31.5 23.8732 30.8732 24.5 30.1 24.5Z"
            fill="#0036A5"
          />
          <path
            d="M19.6875 24.5H11.9C11.1268 24.5 10.5 23.8732 10.5 23.1V21C10.5 19.071 8.93943 17.5064 7.01191 17.5V15.75C7.02673 15.176 7.05996 14.7591 7.1345 14.3844C7.68685 11.6075 9.85753 9.43685 12.6344 8.8845C13.3106 8.75 14.1237 8.75 15.75 8.75H19.6875V24.5Z"
            fill="#0036A5"
          />
        </g>
      </svg>
    ),
    title: 'Дизайн интерьеров',
    description:
      'Разрабатываем индивидуальный интерьер в рамках вашего бюджета. Ваше будущее пространство станет уютным и комфортным.',
    buttonText: 'Оставить заявку',
  },
];

export const WeSuggest = () => {
  return (
    <>
      <h2 className="text-2xl md:text-[36px] font-bold mb-6 md:mb-10">
        Мы предлагаем
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 md:auto-rows-[1fr] gap-4 md:gap-5 md:items-stretch">
        {/* Left side - Services */}
        <div className="space-y-4 md:space-y-5">
          {services.map((service, index) => (
            <div
              key={index}
              className="bg-white rounded-[22px] p-6 md:pt-[60px] md:pl-11 md:pb-[56px] md:pr-28"
            >
              {/* Mobile Layout - Vertical Stack */}
              <div className="flex flex-col items-center space-y-4 md:hidden">
                <div className="w-16 h-16 bg-[#F0F2F5] rounded-[22px] flex items-center justify-center">
                  <span>{service.icon}</span>
                </div>
                <h3 className="text-xl font-bold leading-6">{service.title}</h3>
                <p className="text-base leading-5 text-[#353E5C]">
                  {service.description}
                </p>
                <button className="bg-[#E3E6EA] text-[#353E5C] px-6 py-3 rounded-full text-base cursor-pointer w-full">
                  {service.buttonText}
                </button>
              </div>

              {/* Desktop Layout - Horizontal */}
              <div className="hidden md:flex items-start gap-4">
                <div className="w-20 h-20 bg-[#F0F2F5] rounded-[22px] flex items-center justify-center flex-shrink-0">
                  <span>{service.icon}</span>
                </div>
                <div className="space-y-5 flex-1">
                  <h3 className="text-2xl font-bold leading-8">
                    {service.title}
                  </h3>
                  <p className="text-lg leading-6 text-[#353E5C]">
                    {service.description}
                  </p>
                  <button className="bg-[#E3E6EA] text-[#353E5C] px-9 py-[21px] rounded-full text-lg cursor-pointer">
                    {service.buttonText}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="relative p-4 md:p-5 bg-white rounded-[22px]">
          <Image
            src="/images/extra-pages/repair-suggest.png"
            alt="Ремонт и дизайн интерьеров"
            className="w-full h-[300px] md:h-[640px] object-cover rounded-xl"
            width={589}
            height={676}
          />
        </div>
      </div>
    </>
  );
};
