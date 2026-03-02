import Image from 'next/image';

export const About = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-stretch">
      {/* Left side - Text content */}
      <div className="space-y-6 bg-white p-6 md:p-10 rounded-[22px]">
        <h2 className="text-2xl md:text-[32px] font-bold mb-6 md:mb-8">
          О нас
        </h2>

        <div className="space-y-4 md:space-y-5 text-lg md:text-2xl text-[#353E5C] leading-7 md:leading-8">
          <p>
            Современная компания для людей, которые ценят своё время, обладают
            уникальным, тонким чувством стиля и действительно ценят качество.
          </p>

          <p>
            С момента своего основания в 2017 мы неизменно придерживаемся
            высоких стандартов качества и стремимся предоставлять нашим клиентам
            лучший сервис.
          </p>

          <p>
            За годы работы мы накопили богатый опыт и разработали эффективные
            методы, позволяющие реализовывать проекты любой сложности с
            максимальной точностью и вниманием к деталям.
          </p>
        </div>
      </div>

      {/* Right side - Images */}
      <div className="space-y-4 md:space-y-5">
        <div className="relative p-4 md:p-5 bg-white overflow-hidden rounded-[22px]">
          <Image
            src="/images/extra-pages/repair-us-1.png"
            alt="Ремонт комнаты"
            width={600}
            height={310}
            className="w-full h-[200px] md:h-[310px] object-cover rounded-xl"
          />
        </div>

        <div className="relative p-4 md:p-5 bg-white overflow-hidden rounded-[22px]">
          <Image
            src="/images/extra-pages/repair-us-2.png"
            alt="Ремонт лестницы"
            width={600}
            height={310}
            className="w-full h-[200px] md:h-[310px] object-cover rounded-xl"
          />
        </div>
      </div>
    </div>
  );
};
