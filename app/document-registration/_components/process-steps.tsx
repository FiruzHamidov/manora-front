import Image from 'next/image';

const steps = [
  { number: 1, text: 'Вы оставляете заявку' },
  { number: 2, text: 'Бесплатная консультация' },
  { number: 3, text: 'Подготовка документов' },
  { number: 4, text: 'Проверка и подписание' },
  { number: 5, text: 'Подача в госорганы' },
  { number: 6, text: 'Получение готовых бумаг' },
];

export const ProcessSteps = () => {
  return (
    <div className="flex flex-col lg:flex-row items-stretch gap-4 lg:gap-5">
      {/* Left side - Steps */}
      <div className="bg-white w-full lg:w-[70%] rounded-[22px] p-6 lg:px-[50px] lg:pt-[50px] lg:pb-[70px]">
        <h2 className="text-2xl lg:text-4xl font-bold text-gray-900 mb-6 lg:mb-[50px]">
          Как проходит процесс?
        </h2>

        <div className="space-y-4 lg:space-y-10">
          {steps.map((step, index) => (
            <div key={step.number} className="relative">
              <div className="flex items-start gap-3 lg:gap-6">
                {/* Step number */}
                <div className="flex-shrink-0 w-8 h-8 lg:w-[50px] lg:h-[50px] bg-[#0036A5] text-white rounded-full flex items-center justify-center font-bold text-sm lg:text-2xl">
                  {step.number}
                </div>

                {/* Step text */}
                <p className="text-sm lg:text-2xl text-[#353E5C] pt-0.5 lg:pt-3">
                  {step.text}
                </p>
              </div>

              {/* Connecting line (except for last item) */}
              {index < steps.length - 1 && (
                <div className="absolute left-4 lg:left-6 top-10 lg:top-[88px] w-0.5 lg:w-[9px] h-6 lg:h-8 bg-[#E3E6EA]"></div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Right side - Image */}
      <div className="relative self-stretch bg-white rounded-[22px] p-6 lg:px-9 lg:py-[43px]">
        <Image
          src="/images/extra-pages/doc-process.png"
          alt="Document signing process"
          width={600}
          height={400}
          className="w-full h-[200px] lg:h-full rounded-2xl fill-[#0036A542]/[26%] text-[#0036A542]/[26%] object-cover"
        />
      </div>
    </div>
  );
};
