import { FAQ } from '@/ui-components/FAQ';
import { ExtraPagesBanner } from '../_components/extra-pages-banner';
import { ApplicationForm } from './_components/application-form';
import { ProcessSteps } from './_components/process-steps';
import { Cards } from './_components/cards';
import GoogleAdSlot from '@/app/_components/ads/GoogleAdSlot';

export default function BuyRealEstate() {
  return (
    <div className="mx-auto w-full max-w-[1520px] px-4 sm:px-6 lg:px-8 pt-10 md:pt-[100px] pb-10">
      <ExtraPagesBanner
        title="Срочный выкуп недвижимости"
        description="Быстро и безопасно выкупим вашу недвижимость по рыночной цене, полное юридическое сопровождение и прозрачные условия сделки."
        buttonLabel="Оставить заявку"
        buttonLink="/buy-property#buy-form"
        imageUrl="/images/extra-pages/buy-real-estate.png"
        imageAlt="Покупка недвижимости"
      />

      <div className="pt-10">
        <Cards />
      </div>

      <div className="py-10">
        <ProcessSteps />
      </div>

      <div className="pb-6">
        <div className="bg-white rounded-[22px] p-4 md:p-6">
          <GoogleAdSlot
            slot="5085881730"
            format="auto"
            fullWidthResponsive="true"
            layout="in-article"
          />
        </div>
      </div>

      <ApplicationForm id={'buy-form'} title={'Срочный выкуп недвижимости'} />

      <div className="py-10">
        <FAQ
          items={[
            {
              question: 'Сколько времени занимает выкуп?',
              answer:
                'Сроки продажи зависят от многих факторов, включая рыночные условия и готовность документов. В среднем, процесс может занять от нескольких дней до нескольких недель.',
            },
            {
              question: 'Можно ли продать квартиру с долгами?',
              answer:
                'Для продажи недвижимости вам понадобятся документы, подтверждающие право собственности, технический паспорт, а также документы, удостоверяющие личность продавца.',
            },
            {
              question: 'Какие документы нужны?',
              answer:
                'Комиссия зависит от условий сделки и может варьироваться. Мы предлагаем прозрачные тарифы без скрытых комиссий.',
            },
            {
              question: 'Сколько стоит оценка?',
              answer:
                'Мы предлагаем прозрачные тарифы без скрытых комиссий. Комиссия зависит от условий сделки и может варьироваться.',
            },
            {
              question: 'Что если квартира не оформлена?',
              answer:
                'Вы можете оставить заявку на нашем сайте, и наши менеджеры свяжутся с вами в ближайшее время.',
            },
          ]}
        />
      </div>
    </div>
  );
}
