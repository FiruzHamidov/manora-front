const items = [
  {
    title: 'Подбор арендаторов',
    description:
      'Быстро найдём надёжных арендаторов для вашей недвижимости - без рисков и лишних забот',
  },
  {
    title: 'Фотосъёмка и реклама объекта',
    description:
      'Профессиональные фото и эффективное продвижение - ваш объект будет замечен',
  },
  {
    title: 'Юридическая проверка',
    description:
      'Наши специалисты оказывают полную юридическую поддержку на всех этапах сделки.',
  },
  {
    title: 'Подготовка договора аренды',
    description:
      'Грамотно составим договор аренды с учётом всех ваших интересов и требований закона',
  },
  {
    title: 'Управление арендой (по желанию)',
    description:
      'Полное сопровождение аренды — от контроля платежей до решения бытовых вопросов, если вы хотите передать всё в надёжные руки',
  },
];

export const OurServices = () => {
  return (
    <div>
      <div>
        <h2 className="text-[32px] font-bold mb-6">Наши услуги</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5">
        {items.map((stage, index) => (
          <div
            key={index}
            className="rounded-[22px] bg-white overflow-hidden h-full"
          >
            <div className="bg-[#0036A5] h-[80px] text-white px-6 md:px-[30px] flex items-center">
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
