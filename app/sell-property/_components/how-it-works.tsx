const items = [
  {
    title: 'Эффективная реклама',
    description:
      'Добавьте объявление о своей недвижимости, и через 2 часа покупатели увидят его на сайте. Или просто оставьте свой телефон и мы всё сделаем.',
  },
  {
    title: 'Анализ рынка',
    description:
      'Наши специалисты проведут тщательный анализ рынка и помогут установить оптимальную стоимость для Вашего жилья',
  },
  {
    title: 'Грамотная оценка недвижимости',
    description:
      'Мы знаем не только по какой цене предложения размещаются, но и фактическую цену продажи. Поэтому наша оценка ближе к реальности.',
  },
  {
    title: 'Деловой подход к работе с покупателями',
    description:
      'Общение с потенциальными покупателями имеет особую специфику. Порой одно лишнее слово может разрушить положительное впечатление и отсрочить сделку.',
  },
  {
    title: 'Качественное оформление документов',
    description:
      'Даже при наличии покупателей их можно очень быстро потерять в том случае, если документы будут подготовлены не соответствующим образом.',
  },
  {
    title: 'Юридическое сопровождение',
    description:
      'Наши специалисты оказывают полную юридическую поддержку на всех этапах сделки.',
  },
];

export const HowItWorks = () => {
  return (
    <div>
      <div>
        <h2 className="text-2xl font-bold mb-6">Как это работает</h2>
        <p className="text-base text-[#666F8D] mb-8">
          Мы следуем четкому процессу, чтобы обеспечить максимальную
          эффективность и прозрачность на каждом этапе.
        </p>
      </div>
      <div className="flex flex-wrap flex-col md:flex-row items-stretch gap-4 md:gap-5">
        {items.map((stage, index) => (
          <div
            key={index}
            className="flex-1/4 rounded-[22px] bg-white overflow-hidden"
          >
            <div className="bg-[#0036A5] flex items-center h-[80px] text-white py-3 px-6 md:px-[30px]">
              <h2 className="text-xl md:text-2xl md:leading-8 font-bold">
                {stage.title}
              </h2>
            </div>
            <div className="px-6 md:pl-[30px] md:pr-10 pt-4 md:pt-[22px] pb-8 md:pb-16 text-[#666F8D]">
              {stage.description}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
