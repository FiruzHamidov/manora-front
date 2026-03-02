'use client';

import {FC, useEffect, useRef, useState} from 'react';
import Image from 'next/image';

interface PromoCardData {
    id: number | string;
    title: string;
    description: string;
    bgColor: string;
    textColor: string;
    imageUrl: string;
    imageAlt: string;
}

const promoData: PromoCardData[] = [
    {
        id: 1,
        title: 'Квартира мечты по<br />лучшей цене!',
        description:
            'Современные новостройки с выгодными условиями - успей купить по специальной цене!',
        bgColor: 'bg-yellow-400',
        textColor: 'text-black',
        imageUrl: '/images/promo/1.png',
        imageAlt: 'Современное жилое здание',
    },
    {
        id: 2,
        title: 'Ипотека в новостройках<br />от 14% годовых',
        description:
            'Выгодные условия и комфортное жильё — оформите ипотеку на лучших условиях!',
        bgColor: 'bg-green-500',
        textColor: 'text-white',
        imageUrl: '/images/promo/2.png',
        imageAlt: 'Дом',
    },
    {
        id: 3,
        title: 'Сервис аренды квартир<br />в новостройках',
        description:
            'Аренда без хлопот – просто, быстро, выгодно в месте с Manora еще не было так просто',
        bgColor: 'bg-sky-500',
        textColor: 'text-white',
        imageUrl: '/images/promo/3.png',
        imageAlt: 'Дом с ключами',
    },
];

interface PromoCardProps {
    cardData: PromoCardData;
}

const PromoCard: FC<PromoCardProps> = ({cardData}) => {
    return (
        <div
            data-slide
            className={`relative rounded-3xl p-6 md:p-8 overflow-hidden h-full flex flex-col min-h-[200px] md:min-h-[225px] snap-start ${cardData.bgColor} ${cardData.textColor} hover:shadow-lg transition-shadow duration-200 cursor-pointer`}
        >
            <div className="relative z-10">
                <h3
                    className="text-sm md:text-[20px] font-bold mb-2.5 leading-tight md:leading-none"
                    dangerouslySetInnerHTML={{__html: cardData.title}}
                />
            </div>
            <div className="relative z-10 md:max-w-[60%]">
                <p className="text-xs md:text-[13px] opacity-90">
                    {cardData.description}
                </p>
            </div>

            <div
                className="absolute bottom-0 right-0 w-1/2 md:w-[45%] lg:w-[55%] max-w-[160px] sm:max-w-[180px] md:max-w-[200px] lg:max-w-[220px] aspect-[5/4] pointer-events-none -bottom-1 -right-1 md:-bottom-2 md:-right-2">
                <Image
                    src={cardData.imageUrl}
                    alt={cardData.imageAlt}
                    fill
                    sizes="(max-width: 640px) 50vw, (max-width: 768px) 25vw, (max-width: 1024px) 20vw, 15vw"
                />
            </div>
        </div>
    );
};

const Promo: FC = () => {
    const [activeIndex, setActiveIndex] = useState(0);
    const scrollerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const el = scrollerRef.current;
        if (!el) return;

        const onScroll = () => {
            const slides = Array.from(
                el.querySelectorAll<HTMLElement>('[data-slide]')
            );
            if (!slides.length) return;
            let idx = 0;
            let min = Number.POSITIVE_INFINITY;
            slides.forEach((slide, i) => {
                const dist = Math.abs(slide.offsetLeft - el.scrollLeft);
                if (dist < min) {
                    min = dist;
                    idx = i;
                }
            });
            setActiveIndex(idx);
        };

        el.addEventListener('scroll', onScroll, {passive: true});
        return () => el.removeEventListener('scroll', onScroll);
    }, []);

    const scrollTo = (index: number) => {
        const el = scrollerRef.current;
        if (!el) return;
        const slides = el.querySelectorAll<HTMLElement>('[data-slide]');
        const target = slides[index];
        if (!target) return;
        el.scrollTo({left: target.offsetLeft, behavior: 'smooth'});
    };

    return (
        <section className="sm:mx-auto w-full max-w-auto md:max-w-[1520px] py-10 md:py-20 px-0 sm:px-6 lg:px-8">
            <div
                ref={scrollerRef}
                className="
      overflow-x-auto md:overflow-visible hide-scrollbar snap-x snap-mandatory
      /* full-bleed на мобиле */
      w-screen max-w-[100vw] relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw]
      /* визуальные поля по краям и корректный snap */
      px-4 scroll-px-4
      /* на md+ возвращаемся в рамки контейнера */
      md:static md:w-auto md:max-w-none md:ml-0 md:mr-0 md:px-0 md:scroll-px-0
    "
            >
                <div
                    className="
        grid grid-flow-col auto-cols-[95%] sm:auto-cols-[95%] gap-4
        md:grid-flow-row md:auto-cols-auto md:grid-cols-3 md:gap-6 lg:gap-8
      "
                >
                    {promoData.map(card => (
                        <PromoCard key={card.id} cardData={card}/>
                    ))}
                </div>
            </div>

            {/* Dots indicator - only show on mobile/tablet */
            }
            <div className="flex md:hidden justify-center items-center space-x-2 mt-[18px]">
                {promoData.map((_, index) => (
                    <button
                        key={index}
                        onClick={() => scrollTo(index)}
                        className={`w-2.5 h-2.5 rounded-full transition-colors duration-200 ${
                            index === activeIndex
                                ? 'bg-[#0036A5]'
                                : 'bg-gray-300 hover:bg-gray-400'
                        }`}
                        aria-label={`Перейти к слайду ${index + 1}`}
                    />
                ))}
            </div>
        </section>
    );
};

export default Promo;
