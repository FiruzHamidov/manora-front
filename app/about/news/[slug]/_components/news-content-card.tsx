import ShareCard from './share-card';

const NewsContentCard = () => {
  return (
    <div className="flex flex-col lg:flex-row gap-5">
      <div className="lg:w-2/3 bg-white px-4 md:px-10 py-6 md:py-7 rounded-[22px]">
        <article className="text-[#353E5C] text-lg">
          <div className="mb-4">
            Ремонт — это всегда стресс и неожиданные траты. Но 90% проблем можно
            избежать, если знать типичные ошибки и действовать на опережение.
            Вот полный гид, как сделать ремонт в квартире без переплат и ошибок.
          </div>

          <div className="mb-8">
            <div className="">1. Отсутствие четкого плана</div>
            <div className="">
              Ошибка: Начинать ремонт без дизайн-проекта и сметы.
            </div>
            <div>
              Последствия: Бесконечные переделки, перерасход материалов,
              конфликты с рабочими.
            </div>

            <div className=" mt-4">Как избежать:</div>
            <ul className="list-none pl-0">
              <li className="flex items-start gap-2 mb-2">
                <span>
                  Составьте техническое задание (что хотите изменить, стиль,
                  бюджет).
                </span>
              </li>
              <li className="flex items-start gap-2 mb-2">
                <span>
                  Закажите эскизный проект (хотя бы от руки или в
                  3D-планировщике).
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span>
                  Рассчитайте смету с запасом 15-20% на непредвиденное.
                </span>
              </li>
            </ul>

            <div className="italic mt-4">
              Пример: Без плана можно забыть про розетки у кровати — потом
              придется тянуть удлинители.
            </div>
          </div>

          <div className="mb-8">
            <div className="">2. Экономия на черновых работах</div>
            <div className="">
              Ошибка: Покупка самых дешевых материалов для стяжки, штукатурки,
              электропроводки.
            </div>
            <div>
              Последствия: Трещины в стенах, перегоревшая проводка, протечки.
            </div>

            <div className=" mt-4">Как избежать:</div>
            <ul className="list-none pl-0">
              <li className="flex items-start gap-2">
                <span>Не экономьте на:</span>
              </li>
            </ul>

            <div className="ml-7">Грунтовке (иначе обои отклеятся).</div>
            <div className="ml-7">Трубах и фитингах (дешевые = протечки).</div>
            <div className="ml-7">
              Кабеле (сечение 2,5 мм² для розеток, 1,5 мм² для света).
            </div>

            <div className="italic mt-4">
              Лайфхак: Лучше сэкономить на плитке (взяли за 800 ₽/м² вместо 2000
              ₽/м²), чем на гидроизоляции ванной.
            </div>
          </div>

          <div className="mb-8">
            <div className="">3. Неправильная последовательность ремонта</div>
            <div className="">
              Ошибка: Сначала поклеить обои, потом штробить стены под проводку.
            </div>
            <div>Последствия: Испорченная отделка, лишние затраты.</div>

            <div className=" mt-4">Правильный порядок:</div>
            <ul className="list-none pl-0">
              <li>- Демонтаж (убрать старое).</li>
              <li>- Черновая отделка (стяжка, штукатурка).</li>
              <li>- Разводка коммуникаций (электрика, сантехника).</li>
              <li>- Чистовая отделка (плитка, обои, покраска).</li>
              <li>- Установка техники и мебели.</li>
            </ul>
          </div>

          <div>
            <div className="">4. Непродуманное освещение</div>
            <div className="">
              Ошибка: Одна люстра в центре + 1-2 розетки на всю комнату.
            </div>
            <div>Последствия: Темные углы, удлинители по всему полу.</div>
          </div>
        </article>
      </div>
      <aside className="lg:w-1/3 lg:sticky lg:top-5 h-fit">
        <ShareCard />
      </aside>
    </div>
  );
};

export default NewsContentCard;
