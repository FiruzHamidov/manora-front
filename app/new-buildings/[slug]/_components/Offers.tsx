import { FC, useState, useRef, ChangeEvent, FormEvent, useEffect } from 'react';
import Image from 'next/image';
import useEmblaCarousel from 'embla-carousel-react';
import { resolveMediaUrl } from '@/constants/base-url';
import { X } from 'lucide-react';
import type { NewBuilding } from '@/services/new-buildings/types';
import BedIcon from '@/icons/BedIcon';
import ShowerIcon from '@/icons/ShowerIcon';
import PlanIcon from '@/icons/PlanIcon';
import FloorIcon from '@/icons/FloorIcon';
import { getLeadErrorMessage, getSourceUrl, getUtmFromUrl, submitLead } from '@/services/leads/api';

interface OffersProps {
  building: NewBuilding;
}

const formatCompletionQuarter = (dateStr?: string | null) => {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return '';
    const q = Math.floor(d.getMonth() / 3) + 1;
    return `Сдача в ${q} кв. ${d.getFullYear()}`;
  } catch {
    return '';
  }
};

const BlockTabs: FC<{
  blocks: any[];
  selected: number | null;
  onSelect: (id: number | null) => void;
}> = ({ blocks, selected, onSelect }) => {
  return (
    <div className="flex gap-3 mb-6 overflow-x-auto pb-2 scrollbar-hide">
      <button
        onClick={() => onSelect(null)}
        className={`px-5 py-3 rounded-xl border-2 cursor-pointer transition-all duration-200 whitespace-nowrap font-medium ${
          selected === null
            ? 'border-[#0036A5] bg-[#0036A5] text-white shadow-md'
            : 'border-gray-200 bg-white text-[#667085] hover:border-[#0036A5]/30 hover:bg-[#F7FAFD]'
        }`}
      >
        Все корпуса
      </button>
      {blocks.map((b) => (
        <button
          key={b.id}
          onClick={() => onSelect(b.id)}
          className={`flex flex-col items-start px-5 py-3 rounded-xl border-2 text-left cursor-pointer transition-all duration-200 whitespace-nowrap min-w-[140px] ${
            selected === b.id
              ? 'border-[#0036A5] bg-[#0036A5] text-white shadow-md'
              : 'border-gray-200 bg-white text-[#667085] hover:border-[#0036A5]/30 hover:bg-[#F7FAFD]'
          }`}
        >
          <span className="font-semibold text-sm">{b.name}</span>
          <span
            className={`text-xs mt-1 ${
              selected === b.id ? 'text-white/80' : 'text-[#667085]'
            }`}
          >
            {formatCompletionQuarter(b.completion_at)}
          </span>
        </button>
      ))}
    </div>
  );
};

const UnitCarousel: FC<{
  photos: { id?: number; path: string }[];
  onOpenGallery: (
    photos: { id?: number; path: string }[],
    index: number
  ) => void;
}> = ({ photos, onOpenGallery }) => {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: false });
  const hasPhotos = photos && photos.length > 0;
  const imgUrls = hasPhotos
    ? photos.map((p) => resolveMediaUrl(p.path))
    : ['/images/no-image.png'];

  return (
    <div className="embla">
      <div className="embla__viewport overflow-hidden" ref={emblaRef}>
        <div className="embla__container flex">
          {imgUrls.map((src, i) => (
            <div key={i} className="embla__slide min-w-full relative">
              <button
                type="button"
                onClick={() => {
                  onOpenGallery(photos, i);
                }}
                className="block w-full h-full"
              >
                <div className="relative w-full h-20 md:h-20 bg-[#F0F7FF] rounded">
                  <Image
                    src={src}
                    alt={`Фото ${i + 1}`}
                    fill
                    className="object-contain p-2 cursor-pointer"
                  />
                </div>
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const ModalCarousel: FC<{ images: string[]; startIndex?: number }> = ({
  images,
  startIndex = 0,
}) => {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: false });

  useEffect(() => {
    if (emblaApi) {
      emblaApi.scrollTo(startIndex);
    }
  }, [emblaApi, startIndex]);

  return (
    <div className="embla h-full">
      <div className="embla__viewport overflow-hidden h-full" ref={emblaRef}>
        <div className="embla__container flex h-full">
          {images.map((src, i) => (
            <div
              key={i}
              className="embla__slide min-w-full relative h-full flex items-center justify-center"
            >
              <div className="relative w-full h-full">
                <Image
                  src={src ?? '/images/no-image.png'}
                  alt={`Фото ${i + 1}`}
                  fill
                  className="object-contain"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export const Offers: FC<OffersProps> = ({ building }) => {
  const units = building.units || [];
  const [selectedBlockId, setSelectedBlockId] = useState<number | null>(null);
  const [expandedRooms, setExpandedRooms] = useState<Set<number>>(new Set());
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [modalPhotos, setModalPhotos] = useState<string[]>([]);
  const [modalIndex, setModalIndex] = useState<number>(0);
  const isLightboxOpen = Boolean(selectedImage || (modalPhotos && modalPhotos.length > 0));

  const [formData, setFormData] = useState({ name: '', phone: '' });
  const [errors, setErrors] = useState<{ name?: string; phone?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const nameRef = useRef<HTMLInputElement>(null);
  const phoneRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const body = document.body;
    const html = document.documentElement;
    const prevOverflow = body.style.overflow;
    const prevTouchAction = body.style.touchAction;
    const prevHtmlOverflow = html.style.overflow;
    const prevHtmlTouchAction = html.style.touchAction;

    if (isLightboxOpen) {
      body.style.overflow = 'hidden';
      body.style.touchAction = 'none';
      html.style.overflow = 'hidden';
      html.style.touchAction = 'none';
    } else {
      body.style.overflow = prevOverflow;
      body.style.touchAction = prevTouchAction;
      html.style.overflow = prevHtmlOverflow;
      html.style.touchAction = prevHtmlTouchAction;
    }

    return () => {
      body.style.overflow = prevOverflow;
      body.style.touchAction = prevTouchAction;
      html.style.overflow = prevHtmlOverflow;
      html.style.touchAction = prevHtmlTouchAction;
    };
  }, [isLightboxOpen]);

  type FormState = {
    name: string;
    phone: string;
  };

  type FormErrors = Partial<Record<keyof FormState, string>>;
  type FieldName = keyof FormState;

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const field = name as FieldName;

    setFormData((prev) => ({ ...prev, [field]: value }));

    setErrors((prev) => {
      const next: FormErrors = { ...prev };
      if (field in next) delete next[field];
      return next;
    });
  };

  const validate = () => {
    const t = (s: string) => s.trim();
    const next: { name?: string; phone?: string } = {};

    if (!t(formData.name)) next.name = 'Укажите имя';
    else if (!/^[\p{L}\s'-]{2,}$/u.test(t(formData.name)))
      next.name = 'Имя должно содержать минимум 2 буквы';

    const digits = formData.phone.replace(/[^\d+]/g, '');
    if (!t(formData.phone)) next.phone = 'Укажите телефон';
    else if (!/^\+?\d{7,15}$/.test(digits))
      next.phone = 'Неверный формат телефона';

    return next;
  };

  const focusFirstError = (errs: typeof errors) => {
    if (errs.name) nameRef.current?.focus();
    else if (errs.phone) phoneRef.current?.focus();
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    const next = validate();
    if (Object.keys(next).length) {
      setErrors(next);
      focusFirstError(next);
      return;
    }

    setIsSubmitting(true);

    const sourceUrl = getSourceUrl();
    const payload = {
      ...formData,
      title: 'Оставьте заявку',
      pageUrl: sourceUrl,
    };

    try {
      const result = await submitLead({
        lead: {
          service_type: 'Новостройки',
          name: formData.name.trim(),
          phone: formData.phone.trim(),
          source: 'web-new-building-offers',
          source_url: sourceUrl,
          utm: getUtmFromUrl(sourceUrl),
          context: {
            building_id: building.id,
            building_name: building.title,
          },
        },
        telegram: payload,
      });
      if (!result.ok) {
        console.error(result.message);
        alert(getLeadErrorMessage(result));
        return;
      }

      setFormData({ name: '', phone: '' });
      setErrors({});
      alert('Заявка отправлена! Мы скоро свяжемся с вами.');
    } catch (err) {
      console.error(err);
      alert('Ошибка сети. Попробуйте позже.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleRoom = (rooms: number) => {
    const newExpanded = new Set(expandedRooms);
    if (newExpanded.has(rooms)) {
      newExpanded.delete(rooms);
    } else {
      newExpanded.add(rooms);
    }
    setExpandedRooms(newExpanded);
  };

  if (units.length === 0) {
    return (
      <div className="mt-5 rounded-[26px] bg-white px-4 py-5 shadow-[0_2px_20px_rgba(15,23,42,0.05)] md:px-6 md:py-6">
        <h2 className="text-[28px] font-extrabold text-[#111827]">Планировки и квартиры</h2>
        <div className="text-[#666F8D]">
          Информация о доступных квартирах скоро появится
        </div>
      </div>
    );
  }

  return (
    <div className="mt-5 rounded-[26px] bg-white px-4 py-5 shadow-[0_2px_20px_rgba(15,23,42,0.05)] md:px-6 md:py-6">
      <div className="flex flex-wrap items-center gap-2">
        <div className="rounded-xl bg-[#0036A5] px-4 py-2 text-sm font-semibold text-white">
          Планировки
        </div>
        <div className="rounded-xl bg-[#F1F5F9] px-4 py-2 text-sm font-semibold text-[#64748B]">
          Квартиры
        </div>
      </div>

      <h2 className="mt-5 text-[28px] font-extrabold text-[#111827]">Доступные планировки</h2>

      {building.blocks && building.blocks.length > 0 && (
        <BlockTabs
          blocks={building.blocks}
          selected={selectedBlockId}
          onSelect={(id) => setSelectedBlockId(id)}
        />
      )}
      {building.units && building.units.length > 0 && (
        <div className="mt-8">

          <div className="overflow-hidden rounded-2xl border border-[#E5E7EB]">
            {(() => {
              const units = building.units || [];
              const unitsForBlock = selectedBlockId
                ? units.filter((u: any) => u.block_id === selectedBlockId)
                : units;

              // group by rooms (bedrooms || rooms || 0)
              const groups: Record<number, any[]> = {};
              unitsForBlock.forEach((u: any) => {
                const r = Number(u.bedrooms ?? u.rooms ?? 0);
                groups[r] = groups[r] || [];
                groups[r].push(u);
              });

              const roomKeys = Object.keys(groups)
                .map(Number)
                .sort((a, b) => a - b);

              const formatArea = (n: number) => `${n} м²`;

              const formatPrice = (n: number) => {
                if (!n) return '—';
                if (n >= 1000000) {
                  return `${(n / 1000000).toLocaleString('ru-RU', {
                    maximumFractionDigits: 1,
                  })} млн с.`;
                }
                return `${n.toLocaleString('ru-RU')} с.`;
              };

              const plural = (n: number) => {
                const mod10 = n % 10;
                const mod100 = n % 100;
                if (mod10 === 1 && mod100 !== 11) return 'предложение';
                if (mod10 >= 2 && mod10 <= 4 && !(mod100 >= 12 && mod100 <= 14))
                  return 'предложения';
                return 'предложений';
              };

              return roomKeys.map((rooms) => {
                const items = groups[rooms];
                const areas = items
                  .map((i) => Number(i.area ?? i.total_area ?? 0))
                  .filter(Boolean);
                const minArea = areas.length ? Math.min(...areas) : null;

                const prices = items
                  .map((i) => Number(i.total_price ?? i.price ?? 0))
                  .filter(Boolean);
                const minPrice = prices.length ? Math.min(...prices) : null;
                const maxPrice = prices.length ? Math.max(...prices) : null;
                const isExpanded = expandedRooms.has(rooms);

                return (
                  <div key={rooms}>
                    <div className="border-b border-[#E3E6EA] px-4 py-5">
                      <div className="text-lg font-semibold mb-2">
                        {rooms}-комнатные
                      </div>

                      {/* MOBILE */}
                      <div className="flex flex-col gap-2 text-sm md:hidden">
                        <div className="text-[#667085]">
                          {minArea ? `Площадь от ${minArea} м²` : '—'}
                        </div>

                        <div className="font-medium">
                          {minPrice !== null && maxPrice !== null
                            ? `${formatPrice(minPrice)} – ${formatPrice(
                                maxPrice
                              )}`
                            : '—'}
                        </div>

                        <button
                          onClick={() => toggleRoom(rooms)}
                          className="flex items-center gap-2 text-[#0B66FF] underline w-fit"
                        >
                          <span>
                            {items.length} {plural(items.length)}
                          </span>

                          <svg
                            className={`w-4 h-4 transition-transform ${
                              isExpanded ? 'rotate-180' : ''
                            }`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 14l-7 7m0 0l-7-7m7 7V3"
                            />
                          </svg>
                        </button>
                      </div>

                      {/* DESKTOP */}
                      <div className="hidden md:flex items-center justify-between gap-4">
                        <div className="text-[#667085]">
                          {minArea ? `От ${minArea} м²` : '—'}
                        </div>

                        <div className="font-medium">
                          {minPrice !== null && maxPrice !== null
                            ? `${formatPrice(minPrice)} – ${formatPrice(
                                maxPrice
                              )}`
                            : '—'}
                        </div>

                        <button
                          onClick={() => toggleRoom(rooms)}
                          className="flex items-center gap-2 text-[#0B66FF] underline"
                        >
                          <span>
                            {items.length} {plural(items.length)}
                          </span>
                          <svg
                            className={`w-4 h-4 transition-transform ${
                              isExpanded ? 'rotate-180' : ''
                            }`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 14l-7 7m0 0l-7-7m7 7V3"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="grid grid-cols-1 gap-4 bg-[#F8FAFC] p-4 md:grid-cols-2 xl:grid-cols-3">
                        {items.map((unit) => (
                          <div
                            key={unit.id}
                            className="overflow-hidden rounded-2xl border border-[#E3E6EA] bg-white shadow-[0_1px_10px_rgba(15,23,42,0.04)]"
                          >
                            <div className="flex gap-3 p-3 border-b border-[#E3E6EA]">
                              <div className="relative w-20 h-20 shrink-0">
                                <UnitCarousel
                                  photos={unit.photos || []}
                                  onOpenGallery={(photos, i) => {
                                    const hasPhotos =
                                      photos && photos.length > 0;
                                    const urls = hasPhotos
                                      ? photos.map((p) =>
                                          resolveMediaUrl(p.path)
                                        )
                                      : ['/images/no-image.png'];
                                    setModalPhotos(urls);
                                    setModalIndex(i);
                                    setSelectedImage(urls[i] ?? null);
                                  }}
                                />
                              </div>
                              <div className="flex-1">
                                <div className="text-sm font-medium text-[#0036A5]">
                                  {unit.bedrooms}-комн.
                                </div>
                                <div className="text-xs text-[#667085] mb-2">
                                  {unit.name || `Корпус ${unit.block_id}`}
                                </div>
                                <div className="text-[#0036A5] font-bold text-sm">
                                  {parseFloat(
                                    unit.total_price ?? '0'
                                  ).toLocaleString('ru-RU', {
                                    maximumFractionDigits: 0,
                                  })}{' '}
                                  с.
                                </div>
                              </div>
                            </div>

                            <div className="flex justify-between items-center p-3">
                              <div className="flex gap-3">
                                <div className="flex items-center gap-1 text-[#667085] text-xs">
                                  <BedIcon className="w-4 h-4" />
                                  <span>{unit.bedrooms}</span>
                                </div>
                                <div className="flex items-center gap-1 text-[#667085] text-xs">
                                  <ShowerIcon className="w-4 h-4" />
                                  <span>{unit.bathrooms}</span>
                                </div>
                                <div className="flex items-center gap-1 text-[#667085] text-xs">
                                  <PlanIcon className="w-4 h-4" />
                                  <span>
                                    {parseFloat(
                                      String(unit.area ?? '0')
                                    ).toFixed(1)}{' '}
                                    м²
                                  </span>
                                </div>
                                <div className="flex items-center gap-1 text-[#667085] text-xs">
                                  <FloorIcon className="w-4 h-4" />
                                  <span>{unit.floor}</span>
                                </div>
                              </div>

                              <div>
                                <span className="ml-auto text-sm text-[#667085]">
                                  {parseFloat(
                                    unit.price_per_sqm ?? '0'
                                  ).toLocaleString('ru-RU', {
                                    maximumFractionDigits: 0,
                                  })}{' '}
                                  с./м²
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              });
            })()}
          </div>

          <div className="mt-4 text-sm text-[#667085]">
            Всего{' '}
            {selectedBlockId
              ? (building.units || []).filter(
                  (u) => u.block_id === selectedBlockId
                ).length
              : (building.units || []).length}{' '}
            квартир в ЖК
          </div>
        </div>
      )}

      {/* <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {units.map((unit) => (
          <div
            key={unit.id}
            className="bg-[#F7FAFD] rounded-xl overflow-hidden"
          >
            <div
              className="relative h-[188px] w-full bg-[#F0F7FF] rounded-xl mb-4 px-12 py-[18px] cursor-pointer"
              onClick={() => setSelectedImage('/images/buildings/plans/1.png')}
            >
              <Image
                fill
                src="/images/buildings/plans/1.png"
                alt={unit.name ?? `Plan + ${unit.id}`}
                className="object-contain p-2 rotate-270"
              />
            </div>

            <div className="px-4 pb-4">
              <h3 className="text-xl font-semibold mb-1">
                {unit.bedrooms} комнатная квартира
              </h3>
              <p className="text-[#667085] mb-3 text-sm">
                {unit.description || `Квартира ${unit.name}`}
              </p>

              <div className="flex items-center gap-4 mb-3">
                <div className="flex items-center gap-1 text-[#667085]">
                  <BedIcon className="w-5 h-5 mr-1" />
                  <span>{unit.bedrooms}</span>
                </div>

                <div className="flex items-center gap-1 text-[#667085]">
                  <ShowerIcon className="w-5 h-5 mr-1" />
                  <span>{unit.bathrooms}</span>
                </div>

                <div className="flex items-center gap-1 text-[#667085]">
                  <PlanIcon className="w-5 h-5 mr-1" />
                  <span>
                    {parseFloat(String(unit.area ?? '1')).toFixed(1)} м²
                  </span>
                </div>

                <div className="flex items-center gap-1 text-[#667085]">
                  <FloorIcon className="w-5 h-5 mr-1" />
                  <span>{unit.floor}</span>
                </div>
              </div>

              <div className="flex items-center">
                <span className="text-[#0036A5] text-2xl font-bold">
                  {parseFloat(unit.total_price ?? '0').toLocaleString('ru-RU', {
                    maximumFractionDigits: 0,
                  })}{' '}
                  с.
                </span>
                <span className="ml-auto text-sm text-[#667085]">
                  {parseFloat(unit.price_per_sqm ?? '0').toLocaleString(
                    'ru-RU',
                    {
                      maximumFractionDigits: 0,
                    }
                  )}{' '}
                  с./м²
                </span>
              </div>
            </div>
          </div>
        ))}
      </div> */}

      {(selectedImage || (modalPhotos && modalPhotos.length > 0)) && (
        <div
          className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4"
          onClick={() => {
            setSelectedImage(null);
            setModalPhotos([]);
            setModalIndex(0);
          }}
        >
          <div
            className="relative bg-white rounded-2xl w-full max-w-7xl max-h-[90vh] overflow-y-auto md:overflow-hidden grid grid-cols-1 md:grid-cols-2 md:divide-x md:divide-dashed md:divide-gray-200"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => {
                setSelectedImage(null);
                setModalPhotos([]);
                setModalIndex(0);
              }}
              className="absolute top-4 right-4 z-10 bg-white rounded-full p-2 hover:bg-gray-100 transition-colors cursor-pointer"
            >
              <X className="w-6 h-6 text-gray-700" />
            </button>

            <div className="p-6 md:p-10 flex items-center justify-center">
              <div className="relative w-full h-60 md:h-[520px] bg-[#F7FAFD] rounded-lg overflow-hidden">
                {/* Modal carousel using embla */}
                {modalPhotos && modalPhotos.length > 0 ? (
                  <ModalCarousel images={modalPhotos} startIndex={modalIndex} />
                ) : (
                  <Image
                    src={selectedImage || '/images/no-image.png'}
                    alt="Plan preview"
                    fill
                    className="object-contain"
                  />
                )}
              </div>
            </div>

            <div className="flex flex-col lg:flex-row lg:justify-center lg:gap-52 max-w-[450px] mx-auto">
              <div className="bg-white rounded-t-2xl lg:rounded-2xl pt-6 pb-8 px-6 lg:pt-[30px] lg:pb-[46px] lg:px-10 lg:my-[35px]">
                <div className="mb-4 lg:mb-4">
                  <h3 className="text-xl lg:text-2xl font-bold mb-1">
                    Оставьте заявку
                  </h3>
                  <p className="text-[#666F8D] text-sm">
                    Наши менеджеры свяжутся с вами через 20 мин
                  </p>
                </div>

                <form
                  onSubmit={handleSubmit}
                  className="space-y-3 lg:space-y-5"
                  noValidate
                >
                  <div>
                    <label className="block text-sm text-[#666F8D] mb-1">
                      ФИО
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg
                          className="h-5 w-5 text-[#0036A5]"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                      <input
                        ref={nameRef}
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        placeholder="Введите ФИО"
                        className={`w-full pl-10 pr-3 py-3 bg-gray-100 rounded-lg outline-none border transition-all focus:ring-2 focus:ring-blue-500 focus:bg-white ${
                          errors.name ? 'border-red-500' : 'border-transparent'
                        }`}
                      />
                    </div>
                    {errors.name && (
                      <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm text-[#666F8D] mb-1">
                      Телефон
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg
                          className="h-5 w-5 text-[#0036A5]"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                        </svg>
                      </div>
                      <input
                        ref={phoneRef}
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        placeholder="+992 9XX XXX XXX"
                        className={`w-full pl-10 pr-3 py-3 bg-gray-100 rounded-lg outline-none border transition-all focus:ring-2 focus:ring-blue-500 focus:bg-white ${
                          errors.phone ? 'border-red-500' : 'border-transparent'
                        }`}
                      />
                    </div>
                    {errors.phone && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.phone}
                      </p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-[#0036A5] text-white py-[13px] rounded-lg hover:bg-blue-800 transition-colors duration-200 disabled:opacity-50 cursor-pointer"
                  >
                    {isSubmitting ? 'Отправка...' : 'Отправить запрос'}
                  </button>
                  <div className="text-[#666F8D]">
                    Нажимая кнопку «Отправить», я соглашаюсь обработкой моих
                    данных
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
