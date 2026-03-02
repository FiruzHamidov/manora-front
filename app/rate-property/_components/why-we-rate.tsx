const benefits = [
  {
    number: '1',
    title: 'Более 5 лет опыта',
    description:
      'Мы провели сотни успешных оценок объектов - от квартир и домов до коммерческой недвижимости. ',
  },
  {
    number: '2',
    title: 'Современные методы анализа',
    description: 'Каждому клиенту предоставляется персонализированное решение.',
  },
  {
    number: '3',
    title: 'Юридическая точность',
    description:
      'Все наши отчёты соответствуют требованиям банков, нотариусов и государственных органов. ',
  },
  {
    number: '4',
    title: 'Быстрые сроки (от 1 дня)',
    description: 'Мы ценим ваше время. Предварительная оценка - за 1 день',
  },
  {
    number: '5',
    title: 'Удобство и сопровождение',
    description: 'Не нужно никуда ехать - всё можно сделать онлайн',
  },
  {
    number: '6',
    title: 'Гарантия на выполненные работы',
    description:
      'Мы предоставляем гарантию на все выполненные оценки и консультации',
  },
];

export const WhyWeRate = () => {
  return (
    <>
      <h2 className="text-2xl md:text-[36px] font-bold mb-6 md:mb-10">
        Почему стоит оценивать с нами
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
        {benefits.map((benefit, index) => (
          <div
            key={index}
            className="bg-white px-6 md:px-10 pt-6 md:pt-[30px] pb-6 md:pb-10 rounded-[22px]"
          >
            <div className="w-16 h-16 md:w-20 md:h-20 bg-[#F0F2F5] rounded-[22px] flex items-center justify-center mb-3 md:mb-4">
              <span className="text-2xl md:text-[40px] font-bold text-[#666F8D]">
                {benefit.number}
              </span>
            </div>

            <h3 className="text-xl md:text-2xl font-bold leading-6 md:leading-8 mb-2 md:mb-3">
              {benefit.title}
            </h3>

            <p className="text-base md:text-lg leading-5 md:leading-6 text-[#353E5C]">
              {benefit.description}
            </p>
          </div>
        ))}
      </div>
    </>
  );
};
