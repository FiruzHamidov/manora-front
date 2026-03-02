import Image from 'next/image';

const steps = [
  { number: 1, text: 'Несколько вариантов планировки' },
  { number: 2, text: '4-6 ракурсов 3D-визуализации каждой комнаты' },
  {
    number: 3,
    text: '25 листов чертежей, подробно иллюстрирующих все технические моменты',
  },
  {
    number: 4,
    text: 'Полный перечень материалов, которые понадобятся для ремонтных работ',
  },
  { number: 5, text: 'Расчет бюджета проекта' },
  { number: 6, text: 'Смету на ремонтно-отделочные работы' },
];

export const ProcessSteps = () => {
  return (
    <div className="flex flex-col lg:flex-row items-stretch gap-4 lg:gap-5">
      {/* Left side - Description */}
      <div className="relative flex-1 bg-white rounded-[22px] p-6 lg:px-9 lg:py-10">
        <div className="text-2xl lg:text-[32px] font-bold mb-6 lg:mb-8">
          Состав дизайн-проекта
        </div>

        <div className="text-lg lg:text-2xl leading-6 lg:leading-8 text-[#353E5C] mb-6">
          Готовый дизайн-проект - это инструкция по проведению ремонта, поэтому
          его можно отдать на реализацию прорабу или руководить командой
          строителей самостоятельно. По окончании работ по созданию
          дизайн-проекта вы получите пакет документов - гид по вашему будущему
          интерьеру.
        </div>

        {/* Image - hidden on mobile, positioned on desktop */}
        <div className="hidden lg:block">
          <Image
            src="/images/extra-pages/design-arch.png"
            alt="Document signing process"
            width={492}
            height={358}
            className="w-[492px] h-[358px] absolute"
          />
        </div>
      </div>

      {/* Right side - Steps */}
      <div className="bg-white flex-1 rounded-[22px] p-6 lg:px-[50px] lg:pt-[50px] lg:pb-[70px]">
        <h2 className="text-2xl lg:text-4xl font-bold text-gray-900 mb-6 lg:mb-[50px]">
          Документ включает в себя:
        </h2>

        <div className="space-y-6 lg:space-y-10">
          {steps.map((step, index) => (
            <div
              key={step.number}
              className="flex items-start gap-4 lg:gap-6 relative"
            >
              {/* Step number */}
              <div className="flex-shrink-0 w-10 h-10 lg:w-[50px] lg:h-[50px] bg-[#0036A5] text-white rounded-full flex items-center justify-center font-bold text-lg lg:text-2xl">
                {step.number}
              </div>

              {/* Step text */}
              <p className="text-base lg:text-2xl text-[#353E5C] leading-6 lg:leading-normal">
                {step.text}
              </p>

              {/* Connecting line (except for last item) */}
              {index < steps.length - 1 && (
                <div className="absolute left-4 lg:left-5 mt-12 lg:mt-[88px] w-[6px] lg:w-[9px] rounded-full h-4 lg:h-8 bg-[#E3E6EA]"></div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
