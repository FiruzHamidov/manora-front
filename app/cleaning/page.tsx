import { FAQ } from '@/ui-components/FAQ';
import { ExtraPagesBanner } from '../_components/extra-pages-banner';
import { WhyUs } from '../_components/why-us';
import { ProcessSteps } from './_components/process-steps';
import { ApplicationForm } from '../document-registration/_components/application-form';
import { PhotoCarousel } from './_components/photo-carousel';
import GoogleAdSlot from '@/app/_components/ads/GoogleAdSlot';

const bannerData = {
    title: 'Клининговые услуги',
    description: 'Подготовим объект к продаже или сдаче  чисто, быстро и профессионально.'
}

export default function Cleaning() {
  return (
    <>
      <div className="mx-auto w-full max-w-[1520px] px-4 sm:px-6 lg:px-8 pt-10 md:pt-[100px] pb-10md:pb-5">
        <ExtraPagesBanner
          title={bannerData.title}
          description={bannerData.description}
          buttonLabel="Заказать уборку"
          buttonLink="#cleaning-form"
          imageUrl="/images/extra-pages/cleaning-banner.png"
          imageAlt="Клининговые услуги"
        />

        <div className="py-10">
          <WhyUs
            title="Почему мы?"
            items={[
              {
                description: 'Профессиональные клинеры',
                image: '/images/extra-pages/cleaning-profi.png',
              },
              {
                description: 'Гарантия качества',
                image: '/images/extra-pages/cleaning-checked.png',
              },
              {
                description: 'Индивидуальный подход',
                image: '/images/extra-pages/cleaning-individual.png',
              },
              {
                description: 'Современное оборудование',
                image: '/images/extra-pages/cleaning-hardware.png',
              },
            ]}
          />
        </div>

        <ProcessSteps />

        <div className="py-6">
          <div className="bg-white rounded-[22px] p-4 md:p-6">
            <GoogleAdSlot
              slot="2404125144"
              format="auto"
              fullWidthResponsive="true"
            />
          </div>
        </div>

        <div className="py-10">
          <FAQ
            items={[
              {
                question: 'Что входит в уборку?',
                answer:
                  'В уборку входит комплексная чистка всех помещений, включая кухни, ванные комнаты, гостиные и спальни. Мы также предлагаем дополнительные услуги, такие как мытье окон и уборка после ремонта.',
              },
              {
                question: 'Сколько длится?',
                answer:
                  'Время уборки зависит от размера объекта и объема работ. Обычно уборка занимает от 2 до 6 часов.',
              },
              {
                question: 'Чем вы убираете?',
                answer:
                  'Мы используем только профессиональные и безопасные моющие средства, которые эффективно удаляют загрязнения и не вредят здоровью. Также мы применяем современное оборудование для достижения наилучших результатов.',
              },
              {
                question: 'Как быстро можно заказать?',
                answer:
                  'Вы можете заказать уборку в любое время. Мы стараемся организовать уборку в течение 24 часов после вашего запроса, но в экстренных случаях можем предложить срочную уборку в течение нескольких часов.',
              },
            ]}
          />
        </div>
      </div>

      <div className="pb-10 md:pb-24">
        <PhotoCarousel />
      </div>
      <div className="mx-auto w-full max-w-[1520px] px-4 sm:px-6 lg:px-8 pb-16 md:pb-[108px]" id="cleaning-form">
          <ApplicationForm title={bannerData.title} description={bannerData.description}/>
      </div>
    </>
  );
}
