import Image from 'next/image';

export const RateBanner = () => {
  return (
    <div className="bg-white rounded-[22px]">
      <div className="relative flex flex-col md:flex-row items-center md:items-center md:justify-start gap-6 md:gap-10 text-center">
        <Image
          src="/images/extra-pages/keys.png"
          alt="Иконка ключей"
          width={214}
          height={214}
          priority
          className="absolute -top-2 -left-8 w-[110px] h-[110px] md:w-[214px] md:h-[214px] object-contain"
        />

        <div className="md:flex-1 text-center md:pl-48 md:pr-[121px] py-[50px]">
          <h2 className="text-[20px] md:text-2xl font-bold uppercase text-black mb-3 md:mb-[30px]">
            Оценка недвижимости
          </h2>
          <p className="text-[#666F8D] text-sm md:text-2xl leading-6 md:leading-8 mx-auto">
            Оценкой вашей недвижимости занимаются квалифицированные и
            сертифицированные специалисты. Мы предлагаем широкий перечень
            профессиональных оценочных услуг. Обратившись к нам, вы получите
            надёжное решение любых задач, связанных с оценкой имущества.
          </p>
        </div>
      </div>
    </div>
  );
};
