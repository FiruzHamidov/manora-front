import {FAQ} from '@/ui-components/FAQ';
import {ExtraPagesBanner} from '../_components/extra-pages-banner';
import {PhotoCarousel} from './_components/photo-carousel';
import {WhyNeededDesign} from './_components/why-needed-design';
import {ApplicationForm} from '../document-registration/_components/application-form';
import {Stages} from './_components/stages';
import {ProcessSteps} from './_components/process-steps';
import GoogleAdSlot from '@/app/_components/ads/GoogleAdSlot';

const bannerData = {
    title: 'Дизайнерские услуги',
    description: 'Разрабатываем стильные и функциональные интерьеры, подготавливаем квартиры к продаже создаём 3D-визуализации и планировки'
}

export default function Design() {
    return (
        <div className="mx-auto w-full max-w-[1520px] px-4 sm:px-6 lg:px-8 pt-10 md:pt-[100px] pb-10">
            <ExtraPagesBanner
                title={bannerData.title}
                description={bannerData.description}
                buttonLabel="Заказать дизайн"
                buttonLink="#design-form"
                imageUrl="/images/extra-pages/design-banner.png"
                imageAlt="Дизайнерские услуги"
            />

            <div className="py-10">
                <PhotoCarousel/>
            </div>

            <WhyNeededDesign/>

            <div className="py-10">
                <Stages/>
            </div>

            <ProcessSteps/>

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
                            question: 'Как объяснить дизайнеру, чего я хочу?',
                            answer:
                                'Для лучшего понимания ваших пожеланий, мы рекомендуем подготовить референсы, фотографии интерьеров, которые вам нравятся, и описать ваши предпочтения по стилю и функциональности.',
                        },
                        {
                            question: 'Сколько стоит дизайн-проект и как происходит оплата?',
                            answer:
                                'Стоимость дизайн-проекта зависит от его сложности и объема работ. Мы предлагаем прозрачную систему ценообразования, и вы можете обсудить детали с нашим менеджером. Оплата может быть произведена поэтапно или единовременно.',
                        },
                        {
                            question:
                                'Сколько времени занимает разработка дизайн-проекта и ремонт?',
                            answer:
                                'Разработка дизайн-проекта обычно занимает от 2 до 4 недель, в зависимости от сложности. Сроки ремонта зависят от объема работ и могут варьироваться от нескольких недель до нескольких месяцев.',
                        },
                        {
                            question: 'Сколько примерно стоит ремонт квартиры под ключ?',
                            answer:
                                'Стоимость ремонта квартиры под ключ зависит от многих факторов, включая площадь, сложность работ и используемые материалы. Мы можем предоставить предварительную смету после обсуждения всех деталей.',
                        },
                    ]}
                />
            </div>

            <div id="design-form">
                <ApplicationForm title={bannerData.title} description={bannerData.description}/>
            </div>
        </div>
    );
}
