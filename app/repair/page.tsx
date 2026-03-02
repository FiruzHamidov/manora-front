import {FAQ} from '@/ui-components/FAQ';
import {ExtraPagesBanner} from '../_components/extra-pages-banner';
import {About} from './_components/about';
import {OurAdvantages} from './_components/our-advantages';
import {WeSuggest} from './_components/we-suggest';
import {WorkWithUs} from './_components/work-with-us';
import {ApplicationForm} from '../document-registration/_components/application-form';
import GoogleAdSlot from '@/app/_components/ads/GoogleAdSlot';

const bannerData = {
    title: 'Ремонт под ключ',
    description: 'Доверьте ремонт профессионалам - мы берём на себя все этапы работ: от черновой отделки до финального декора.'
}

export default function Repair() {
    return (
        <div className="mx-auto w-full max-w-[1520px] px-4 sm:px-6 lg:px-8 py-10 md:pt-[50px]">
            <ExtraPagesBanner
                title={bannerData.title}
                description={bannerData.description}
                buttonLabel="Оставить заявку"
                buttonLink="#repair-form"
                imageUrl="/images/extra-pages/repair-banner.png"
                imageAlt="Ремонт под ключ"
            />

            <div className="py-10">
                <About/>
            </div>

            <div className="py-10">
                <WorkWithUs/>
            </div>

            <WeSuggest/>

            <div className="py-10">
                <OurAdvantages/>
            </div>

            <div className="pb-6">
                <div className="bg-white rounded-[22px] p-4 md:p-6">
                    <GoogleAdSlot
                        slot="2404125144"
                        format="auto"
                        fullWidthResponsive="true"
                    />
                </div>
            </div>

            <FAQ
                items={[
                    {
                        question: 'Как объяснить ремонтнику, чего я хочу?',
                        answer:
                            'Мы поможем вам сформулировать ваши пожелания и предпочтения, чтобы ремонтник точно понял, что нужно сделать.',
                    },
                    {
                        question: 'Сколько стоит проверить смету и как происходит оплата?',
                        answer:
                            'Проверка сметы бесплатна. Оплата производится поэтапно, согласно договору.',
                    },
                    {
                        question: 'Сколько примерно стоит ремонт квартиры под ключ?',
                        answer:
                            'Стоимость ремонта квартиры под ключ зависит от многих факторов, включая площадь, используемые материалы и сложность работ. Мы можем предложить предварительный расчет после осмотра объекта.',
                    },
                ]}
            />

            <div className="py-10" id="repair-form">
                <ApplicationForm title={bannerData.title} description={bannerData.description}/>
            </div>
        </div>
    );
}
