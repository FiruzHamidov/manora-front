import { FAQ } from '@/ui-components/FAQ';
import { Cards } from './_components/cards';
import { ExtraPagesBanner } from '../_components/extra-pages-banner';
import { ProcessSteps } from './_components/process-steps';
import { HowItWorks } from './_components/how-it-works';
import { ApplicationForm } from './_components/application-form';
import GoogleAdSlot from '@/app/_components/ads/GoogleAdSlot';

export default function SellProperty() {
  return (
    <div className="mx-auto w-full max-w-[1520px] px-4 sm:px-6 lg:px-8 py-10 md:pt-[50px]">
      <ExtraPagesBanner
        title="Как выгодно продать недвижимость?"
        description="Эффективные стратегии и проверенные способы быстрой и прибыльной продажи недвижимости"
        buttonLabel="Получить консультацию"
        buttonLink="#sell-property-form"
        imageUrl="/images/extra-pages/sell-property-banner-min.png"
        imageAlt="Как выгодно продать недвижимость?"
      />

      <div className="py-10">
        <Cards />
      </div>

      <ProcessSteps />

      <div className="py-10">
        <HowItWorks />
      </div>

      <div className="py-6">
        <div className="bg-white rounded-[22px] p-4 md:p-6">
          <GoogleAdSlot
            slot="2404125144"
            format="auto"
            fullWidthResponsive="true"
          />
        </div>
      </div>

      <ApplicationForm id={'sell-property-form'} title={'Продать квартиру'}/>

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
