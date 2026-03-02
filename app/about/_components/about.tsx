import Image from 'next/image';

export const AboutUs = () => {
  return (
    <div className="pt-2 md:pt-12">
      {/* About Us Section */}
      <section className="bg-white rounded-[22px] mx-auto px-4 md:px-12 pt-10 md:pt-[50px] mb-10 md:pb-0 pb-10">
        <div className="flex flex-col lg:flex-row md:gap-10 overflow-hidden">
          <div className="lg:w-1/3">
            <h2 className="text-2xl md:text-4xl font-bold md:mb-6 text-[#020617]">
              О нас
            </h2>
            <div className="relative h-80 w-full hidden md:block">
              <Image
                src="/images/about/1.png"
                alt="3D Buildings"
                width={670}
                height={670}
                className="!w-[670px] !h-[670px] absolute opacity-40"
              />
            </div>
          </div>

          <div className="lg:w-2/3">
            <p className="text-[#666F8D] mb-4">
              Manora: Открытая платформа недвижимости
              Таджикистана для всех!
            </p>

            <p className="text-[#666F8D] mb-4">
              В Manora мы стремимся сделать процесс покупки или продажи
              недвижимости максимально приятным и беззаботным для наших
              пользователей. Наша команда обладает глубокими
              знаниями рынка недвижимости в Душанбе и готова помочь вам найти
              идеальный вариант, соответствующий вашим потребностям и ожиданиям.
            </p>

            <p className="text-[#666F8D] mb-4">
              Мы понимаем, что каждая сделка — это важный шаг, поэтому
              обеспечиваем полное юридическое сопровождение на всех этапах. Наша
              цель — обеспечить вам комфорт и уверенность в каждом решении.
            </p>

            <p className="text-[#666F8D]">
              Доверьтесь профессионалам Manora и сделайте вашу сделку с
              недвижимостью легкой и успешной!
            </p>
          </div>
        </div>
      </section>

      <div className="bg-white rounded-[22px] mb-5 w-full md:hidden block">
        <Image
          src="/images/about/1.png"
          alt="3D Buildings"
          width={410}
          height={410}
          className="!w-[410px] !h-[410px]"
        />
      </div>

      <section className="mb-5 md:mb-10">
        <div className="flex flex-col lg:flex-row gap-5">
          <div className="bg-white px-4 py-6 md:p-10 rounded-[22px] lg:w-2/3">
            <h2 className="text-2xl md:text-3xl font-bold mb-6 text-[#020617]">
              Миссия компании {'Manora'}
            </h2>

            <p className="text-[#666F8D] mb-3">
              В Manora мы предлагаем людям не просто жильё — мы открываем
              путь к лучшей жизни.
            </p>

            <p className="text-[#666F8D] mb-3">
              Наша миссия — изменить жизнь людей, предоставляя профессиональные,
              надёжные и прозрачные услуги в сфере недвижимости. Мы в Manora
              работаем для того, чтобы каждый мог осуществить свою мечту
              о новом доме — с помощью опытных, неравнодушных, которые работают
              с ответственностью, честностью и любовью.
            </p>

            <p className="text-[#666F8D]">
              Manora — это не просто компания, это семья, которая каждый
              день трудится ради мечт людей.
            </p>
          </div>

          <div className="bg-white rounded-[22px] md:p-10 lg:w-1/3 flex items-center justify-center overflow-hidden relative">
            <div className="h-60 w-60">
              <Image
                src="/images/about/2.png"
                alt="Target"
                width={444}
                height={444}
                className="w-full h-full md:w-[444px] md:h-[444px] md:absolute left-16 top-0 -rotate-[90deg]"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="mb-5 md:mb-10">
        <div className="flex flex-col lg:flex-row gap-5">
          <div className="lg:w-1/3 order-2 md:order-none relative bg-white rounded-[22px] md:p-10 flex items-center justify-center overflow-hidden">
            <div className="h-80 w-80">
              <Image
                src="/images/about/3.png"
                alt="Blue House"
                width={444}
                height={444}
                className="w-full h-full md:w-[444px] md:h-[444px] right-16 md:absolute -left-14 -top-3"
              />
            </div>
          </div>

          <div className="lg:w-2/3 bg-white rounded-[22px] px-4 py-6 md:p-10">
            <h2 className="text-2xl md:text-3xl font-bold mb-5 md:mb-8 text-[#020617]">
              Зачем мы существуем:
            </h2>

            <ul className="space-y-4 md:space-y-6">
              <li className="flex items-start">
                <span className="text-blue-700 font-bold mr-2">•</span>
                <p className="text-gray-600">
                  Чтобы каждый человек, независимо от своего бюджета, мог найти
                  подходящую и надёжную недвижимость;
                </p>
              </li>

              <li className="flex items-start">
                <span className="text-blue-700 font-bold mr-2">•</span>
                <p className="text-gray-600">
                  Чтобы процесс покупки и продажи был прозрачным, безопасным и
                  простым;
                </p>
              </li>

              <li className="flex items-start">
                <span className="text-blue-700 font-bold mr-2">•</span>
                <p className="text-gray-600">
                  Чтобы клиенты чувствовали себя не одинокими, а понятыми и
                  поддержанными;
                </p>
              </li>

              <li className="flex items-start">
                <span className="text-blue-700 font-bold mr-2">•</span>
                <p className="text-gray-600">
                  Чтобы поднять культуру продаж в Таджикистане на новый
                  профессиональный уровень — с помощью знаний, этики и
                  преданности делу.
                </p>
              </li>
            </ul>
          </div>
        </div>
      </section>

      <section className="bg-white rounded-[22px] px-4 py-6 md:pl-10 md:pr-20 mx-auto md:py-16">
        <h2 className="text-2xl md:text-[32px] font-bold mb-[22px] text-[#020617]">
          Миссия сотрудника Manora
        </h2>

        <p className="text-[#666F8D] mb-3">
          Я, как член команды Manora, ощущаю себя ответственным и
          полноправным участником в реализации мечт людей. <br /> Моя миссия —
          предоставлять надёжный, ориентированный на человека и профессиональный
          сервис каждому, кто обращается в нашу компанию.
        </p>

        <p className="text-[#666F8D]">
          Моя миссия — не просто продажа, а создание доверия, душевного
          спокойствия и долгосрочных отношений с каждым клиентом. Я работаю с
          преданностью, честностью и профессионализмом, потому что представляю
          компанию, которая ценит людей и создаёт истинную ценность.
        </p>
      </section>
    </div>
  );
};
