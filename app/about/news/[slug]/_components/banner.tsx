import Image from 'next/image';

const NewsBanner = () => {
  return (
    <div className="bg-[#0036A5] rounded-[22px] px-4 md:px-[60px] py-6 md:py-10 mb-10 md:mb-14 relative overflow-hidden h-[315px]">
      <div className="relative z-10 text-white">
        <h1 className="text-2xl md:text-[40px] md:leading-12 font-bold">
          ТОП-10 ошибок при ремонте <br /> квартиры: как сохранить бюджет и
          нервы
        </h1>
      </div>

      <div className="md:absolute right-5 -bottom-16">
        <Image
          src="/logo.svg"
          alt="Manora"
          width={720}
          height={214}
          className="w-full md:w-[720px] h-full md:h-[214px] object-contain brightness-0 invert opacity-20"
        />
      </div>
    </div>
  );
};

export default NewsBanner;
