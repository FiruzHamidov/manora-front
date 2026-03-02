import Image from 'next/image';

export const WhyNeededDesign = () => {
  return (
    <div className="bg-white rounded-[22px] flex flex-col lg:flex-row gap-6 lg:gap-[79px] p-6 lg:p-0">
      <div className="lg:mt-10 lg:ml-[60px] lg:mb-20">
        <div className="text-2xl lg:text-[32px] font-bold mb-6 lg:mb-8">
          Зачем нужен дизайн-проект?
        </div>
        <div className="text-lg lg:text-2xl leading-6 lg:leading-8 text-[#353E5C]">
          Задача дизайн-проекта интерьера квартиры - ответить на всевозможные
          вопросы прораба и строителей, которые будут реализовывать проект.
          Тщательно подготовленный дизайн-проект оптимизирует ремонт, позволяя
          избежать лишних трат и простоев в работе.
          <br />
          <br />
          При создании интерьера вашей квартиры мы разрабатываем подробный
          дизайн-проект. В него входят все необходимые документы для проведения
          ремонта: от общей концепции интерьера до детализированных технических
          чертежей.
        </div>
      </div>
      <div className="flex justify-center lg:block">
        <Image
          src={'/images/extra-pages/design-why-needed.png'}
          width={551}
          height={523}
          alt="Почему нужен дизайн"
          className="lg:mt-[106px] lg:mr-5 w-[280px] h-[265px] lg:w-[551px] lg:h-[523px] object-cover rounded-lg lg:rounded-none"
        />
      </div>
    </div>
  );
};
