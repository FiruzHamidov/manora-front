const benefits = [
  {
    number: '1',
    title: 'Высокое качество работы',
    description:
      'Мы гарантируем высокие стандарты выполнения всех работ, используя только проверенные материалы и современные технологии.',
  },
  {
    number: '2',
    title: 'Индивидуальный подход',
    description:
      'Каждому клиенту предоставляется персонализированное решение, которое идеально соответствует вашим потребностям и пожеланиям.',
  },
  {
    number: '3',
    title: 'Опытные специалисты',
    description:
      'Наша команда состоит из квалифицированных и опытных профессионалов, готовых справиться с любыми задачами.',
  },
  {
    number: '4',
    title: 'Соблюдение сроков',
    description:
      'Мы ценим ваше время и всегда завершаем проекты в оговоренные сроки, без лишних задержек.',
  },
  {
    number: '5',
    title: 'Конкурентные цены',
    description:
      'Мы предлагаем разумные и прозрачные цены на все услуги, обеспечивая отличное соотношение цены и качества.',
  },
  {
    number: '6',
    title: 'Гарантия на выполненные работы',
    description:
      'Мы уверены в качестве своей работы и предоставляем гарантию на выполненные услуги, чтобы вы могли быть уверены в надежности.',
  },
];

export const OurAdvantages = () => {
  return (
    <>
      <h2 className="text-2xl md:text-[32px] font-bold mb-6 md:mb-10">
        Наши преимущества
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
