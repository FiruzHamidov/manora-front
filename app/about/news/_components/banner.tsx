import Image from 'next/image';

const NewsBanner = () => {
  return (
    <div className="bg-[#0036A5] rounded-[22px] px-4 md:px-[60px] py-6 md:py-10 mb-10 md:mb-14 relative overflow-hidden h-[315px]">
      <div className="relative z-10 text-white">
        <h1 className="text-3xl md:text-[56px] font-bold mb-1">Все новости</h1>
        <div className="text-lg">Полезные новости и статьи</div>
      </div>

      {/* Background logo */}
      <div className="absolute right-5 -bottom-16">
        <Image
          src="/logo.svg"
          alt="Manora"
          width={720}
          height={214}
          className="w-[720px] h-[214px] object-contain brightness-0 invert opacity-20"
        />
      </div>
    </div>
  );
};

export default NewsBanner;
