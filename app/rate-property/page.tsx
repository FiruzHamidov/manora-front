import { FAQ } from '@/ui-components/FAQ';
import { Cards } from './_components/cards';
import { ExtraPagesBanner } from '../_components/extra-pages-banner';
import { ApplicationForm } from '../sell-property/_components/application-form';
import { WhyWeRate } from './_components/why-we-rate';
import { RateBanner } from './_components/rate-banner';
import GoogleAdSlot from '@/app/_components/ads/GoogleAdSlot';

export default function RateProperty() {
  return (
    <div className="mx-auto w-full max-w-[1520px] px-4 sm:px-6 lg:px-8 py-10 md:pt-[50px]">
      <ExtraPagesBanner
        title="Мы осуществляем реальную оценку вашей недвижимости."
        description="Точная и объективная оценка стоимости - основа успешной сдачи или продажи недвижимости"
        buttonLabel="Получить консультацию"
        buttonLink="#rate-property-form"
        imageUrl="/images/extra-pages/rate-property-banner.png"
        imageAlt="Сдайте свою недвижимость быстро и выгодно"
      />

      <div className="py-10">
        <Cards />
      </div>

      <WhyWeRate />

      <div className="py-10">
        <RateBanner />
      </div>

      <div className="py-6">
        <div className="bg-white rounded-[22px] p-4 md:p-6">
          <GoogleAdSlot
            slot="5694010534"
            format="auto"
            fullWidthResponsive="true"
            layout="in-article"
          />
        </div>
      </div>

      <ApplicationForm id={'rate-property-form'} title={'Оценка недвижимости'}/>

      <div className="py-10">
        <FAQ
          items={[
            {
              question: 'Сколько времени занимает продать?',
              answer:
                'Время продажи зависит от многих факторов, включая рыночные условия и подготовку недвижимости. В среднем, процесс может занять от нескольких недель до нескольких месяцев.',
            },
            {
              question: 'Можно ли продать квартиру с долгами?',
              answer:
                'Да, продажа квартиры с долгами возможна, но может потребовать дополнительных шагов, таких как погашение долгов или согласование с кредиторами.',
            },
            {
              question: 'Какие документы нужны?',
              answer:
                'Для продажи квартиры обычно требуются следующие документы: паспорт собственника, свидетельство о праве собственности, кадастровый паспорт, а также документы, подтверждающие отсутствие долгов по коммунальным платежам.',
            },
            {
              question: 'Сколько стоит оценка?',
              answer:
                'Бесплатная оценка объекта недвижимости предоставляется в рамках наших услуг. Мы предлагаем профессиональную оценку, чтобы помочь вам определить справедливую рыночную стоимость вашей недвижимости.',
            },
            {
              question: 'Что если квартира не оформлена?',
              answer:
                'Если квартира не оформлена, это может усложнить процесс продажи. Вам может потребоваться оформить все необходимые документы и получить юридическое заключение о праве собственности.',
            },
          ]}
        />
      </div>
    </div>
  );
}
