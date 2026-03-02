import Image from 'next/image';

const steps = [
  { number: 1, text: 'Вы оставляете заявку' },
  { number: 2, text: 'Мы делаем бесплатную оценку' },
  { number: 3, text: 'Согласуем цену и условия' },
  { number: 4, text: 'Подготавливаем документы' },
  { number: 5, text: 'Оформляем сделку' },
  { number: 6, text: 'Вы получаете деньги' },
];

export const ProcessSteps = () => {
  return (
    <div className="flex flex-col md:flex-row items-stretch gap-4 md:gap-5">
      {/* Left side - Steps */}
      <div className="bg-white w-full md:w-[60%] self-stretch rounded-[22px] p-6 md:px-[50px] md:pt-[50px] md:pb-[70px]">
        <h2 className="text-2xl md:text-4xl font-bold text-gray-900 mb-6 md:mb-[50px]">
          Как проходит выкуп — шаг за шагом?
        </h2>

        <div className="space-y-4 md:space-y-10">
          {steps.map((step, index) => (
            <div key={step.number} className="relative">
              <div className="flex items-start gap-3 md:gap-6">
                {/* Step number */}
                <div className="flex-shrink-0 w-8 h-8 md:w-[50px] md:h-[50px] bg-[#0036A5] text-white rounded-full flex items-center justify-center font-bold text-sm md:text-2xl">
                  {step.number}
                </div>

                {/* Step text */}
                <p className="text-sm md:text-2xl text-[#353E5C] pt-0.5 md:pt-0">
                  {step.text}
                </p>
              </div>

              {/* Connecting line (except for last item) */}
              {index < steps.length - 1 && (
                <div className="absolute left-4 md:left-5 -top-[34px] md:mt-[88px] w-0.5 md:w-[9px] h-6 md:h-8 bg-[#E3E6EA] rounded-full"></div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Right side - Image */}
      <div className="relative self-stretch bg-white rounded-[22px] p-6 md:px-9 md:py-[43px]">
        <Image
          src="/images/extra-pages/money.png"
          alt="Money process illustration"
          width={448}
          height={400}
          className="w-full h-[200px] md:w-[448px] md:h-full rounded-2xl object-cover"
        />
      </div>
    </div>
  );
};
