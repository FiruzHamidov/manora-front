'use client';

import {useCallback, useEffect, useState} from 'react';
import Image from 'next/image';
import useEmblaCarousel from 'embla-carousel-react';

interface PhotoGalleryModalProps {
    isOpen: boolean;
    onClose: () => void;
    photos: string[];
    initialIndex?: number;
}

const PhotoGalleryModal = ({
                               isOpen,
                               onClose,
                               photos,
                               initialIndex = 0,
                           }: PhotoGalleryModalProps) => {
    const [selectedIndex, setSelectedIndex] = useState(initialIndex);
    const [emblaRef, emblaApi] = useEmblaCarousel({
        loop: photos.length > 1,
        skipSnaps: false,
        dragFree: false,
    });

    useEffect(() => {
        if (isOpen && emblaApi) {
            setSelectedIndex(initialIndex);
            emblaApi.scrollTo(initialIndex, true);
        }
    }, [isOpen, initialIndex, emblaApi]);

    const onSelect = useCallback(() => {
        if (!emblaApi) return;
        setSelectedIndex(emblaApi.selectedScrollSnap());
    }, [emblaApi]);

    useEffect(() => {
        if (!emblaApi) return;

        const syncSelection = () => {
            window.requestAnimationFrame(onSelect);
        };

        emblaApi.on('select', onSelect);
        emblaApi.on('reInit', onSelect);
        syncSelection();

        return () => {
            emblaApi.off('select', onSelect);
            emblaApi.off('reInit', onSelect);
        };
    }, [emblaApi, onSelect]);

    const scrollPrev = useCallback(() => {
        if (emblaApi) {
            emblaApi.scrollPrev();
        }
    }, [emblaApi]);

    const scrollNext = useCallback(() => {
        if (emblaApi) {
            emblaApi.scrollNext();
        }
    }, [emblaApi]);

    const scrollTo = useCallback(
        (index: number) => {
            if (emblaApi) {
                emblaApi.scrollTo(index);
            }
        },
        [emblaApi]
    );

    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (event: KeyboardEvent) => {
            if (['ArrowLeft', 'ArrowRight', 'Escape'].includes(event.key)) {
                event.preventDefault();
            }

            switch (event.key) {
                case 'Escape':
                    onClose();
                    break;
                case 'ArrowLeft':
                    scrollPrev();
                    break;
                case 'ArrowRight':
                    scrollNext();
                    break;
                case 'Home':
                    scrollTo(0);
                    break;
                case 'End':
                    scrollTo(photos.length - 1);
                    break;
            }
        };

        document.addEventListener('keydown', handleKeyDown, {passive: false});

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen, onClose, scrollPrev, scrollNext, scrollTo, photos.length]);

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
            document.documentElement.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
            document.documentElement.style.overflow = '';
        }

        return () => {
            document.body.style.overflow = '';
            document.documentElement.style.overflow = '';
        };
    }, [isOpen]);

    if (!isOpen || photos.length === 0) return null;

    return (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center">
            <button
                onClick={onClose}
                className="absolute top-4 right-4 z-20 w-12 h-12 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors focus:outline-none focus:ring-2 focus:ring-white/50"
                aria-label="Закрыть галерею"
                tabIndex={0}
            >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path
                        d="M18 6L6 18M6 6L18 18"
                        stroke="white"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                </svg>
            </button>

            <div className="absolute top-4 left-4 z-20 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
                {selectedIndex + 1} / {photos.length}
            </div>

            <div
                className="absolute top-4 left-1/2 transform -translate-x-1/2 z-20 bg-black/50 text-white px-3 py-1 rounded-full text-xs opacity-75 hidden sm:block">
                ← → для навигации, ESC для закрытия
            </div>

            <div className="w-full h-full max-w-7xl mx-auto px-4 flex flex-col">
                <div className="flex-1 relative">
                    <div className="overflow-hidden h-full" ref={emblaRef}>
                        <div className="flex h-full">
                            {photos.map((image, index) => (
                                <div
                                    key={index}
                                    className="relative min-w-full h-full flex items-center justify-center"
                                    style={{flex: '0 0 100%'}}
                                >
                                    <div className="relative w-full h-full flex items-center justify-center">
                                        <Image
                                            src={image}
                                            alt={`Фото ${index + 1}`}
                                            fill
                                            className="object-contain rounded-[22px]"
                                            sizes="100vw"
                                            quality={90}
                                            priority={index === selectedIndex}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {photos.length > 1 && (
                        <>
                            <button
                                onClick={scrollPrev}
                                className="absolute top-1/2 left-4 z-15 transform -translate-y-1/2 w-12 h-12 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors focus:outline-none focus:ring-2 focus:ring-white/50"
                                aria-label="Предыдущее фото"
                                tabIndex={0}
                            >
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                    <path
                                        d="M15 18L9 12L15 6"
                                        stroke="white"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />
                                </svg>
                            </button>

                            <button
                                onClick={scrollNext}
                                className="absolute top-1/2 right-4 z-15 transform -translate-y-1/2 w-12 h-12 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors focus:outline-none focus:ring-2 focus:ring-white/50"
                                aria-label="Следующее фото"
                                tabIndex={0}
                            >
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                    <path
                                        d="M9 18L15 12L9 6"
                                        stroke="white"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />
                                </svg>
                            </button>
                        </>
                    )}
                </div>

                {photos.length > 1 && (
                    <div className="mt-4 pb-4">
                        <div className="flex justify-center gap-2 max-w-full px-4 scrollbar-hide">
                            {photos.map((image, index) => (
                                <button
                                    key={index}
                                    className={`relative cursor-pointer flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all duration-200 focus:outline-none ${
                                        selectedIndex === index
                                            ? 'border-[#0036A5] scale-110'
                                            : 'border-transparent hover:border-[#0036A5]/50 hover:scale-105'
                                    }`}
                                    onClick={() => scrollTo(index)}
                                    tabIndex={0}
                                >
                                    <Image
                                        src={image}
                                        alt={`Миниатюра ${index + 1}`}
                                        fill
                                        className="object-cover"
                                        sizes="64px"
                                    />

                                    {selectedIndex === index && (
                                        <div className="absolute inset-0 bg-white/20"></div>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <div
                className="absolute inset-0 -z-10"
                onClick={onClose}
                aria-label="Закрыть галерею"
            />
        </div>
    );
};

export default PhotoGalleryModal;
