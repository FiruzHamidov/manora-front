import Image from 'next/image';

export const ProcessSteps = () => {
  return (
    <div className="flex flex-col lg:flex-row items-stretch gap-4 lg:gap-5">
      <div className="relative self-stretch bg-white rounded-[22px] p-6 lg:px-9 lg:py-[43px]">
        <Image
          src="/images/extra-pages/doc-process.png"
          alt="Document signing process"
          width={600}
          height={400}
          className="w-full h-[200px] lg:h-full rounded-2xl fill-[#0036A542]/[26%] text-[#0036A542]/[26%] object-cover"
        />
      </div>

      <div className="bg-white w-full lg:w-[70%] rounded-[22px] p-6 lg:p-[50px]">
        <h2 className="text-2xl lg:text-[32px] font-bold text-gray-900 mb-6 lg:mb-9">
          Быстрая и выгодная продажа недвижимости — вместе с нами.
        </h2>

        <div className="space-y-4 lg:space-y-8 text-base lg:text-2xl text-[#353E5C] leading-6 lg:leading-normal">
          <div>
            Manora — удобная платформа и ваш надёжный помощник
            в успешной продаже недвижимости. За годы работы на рынке мы накопили
            ценный опыт, активно применяем современные маркетинговые инструменты
            и внедряем инновационные подходы в обучение и работу команды.
            Благодаря этому наши клиенты получают быстрые и ощутимые результаты.
          </div>

          <div>
            За годы успешной работы на рынке мы накопили ценный опыт,
            сформировали сильную команду экспертов и выстроили эффективную
            систему продаж. Мы используем современные инструменты маркетинга,
            активно внедряем инновации в обучение персонала и адаптируемся к
            новым трендам рынка.
          </div>

          <div>
            Manora — это скорость, прозрачность и максимальная выгода от
            продажи. Продавайте легко. Продавайте уверенно. Продавайте с Manora!
          </div>
        </div>
      </div>
    </div>
  );
};
