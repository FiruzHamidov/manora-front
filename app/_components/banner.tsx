'use client';

import { FC, useState } from 'react';
import Image from 'next/image';
import clsx from 'clsx';
import { useRouter } from 'next/navigation';
import FilterSearchIcon from '@/icons/FilterSearchIcon';
import { SelectInput } from '@/ui-components/SelectInput';
import { AllFilters } from './filtersMain';
import { PropertyFilters } from '@/services/properties/types';
import { useGetPropertyTypesQuery } from '@/services/add-post';
import Link from 'next/link';

type ActiveTab =
  | 'buy'
  | 'sell'
  | 'to_rent'
  | 'to_rent_out'
  | 'map'
  | 'evaluate'
  | 'fast_buy';

export const MainBanner: FC<{ title: string, tab?: ActiveTab }> = ({ title, tab = 'buy' }) => {
  const router = useRouter();

  const { data: propertyTypes } = useGetPropertyTypesQuery();

  const [activeTab, setActiveTab] = useState<ActiveTab>(tab);
  const [propertyType, setPropertyType] = useState('');
  const [roomsFrom, setRoomsFrom] = useState('');
  const [roomsTo, setRoomsTo] = useState('');
  const [priceFrom, setPriceFrom] = useState('');
  const [priceTo, setPriceTo] = useState('');
  const [showPriceRange, setShowPriceRange] = useState(false);
  const [showRoomRange, setShowRoomRange] = useState(false);
  const [isAllFiltersOpen, setIsAllFiltersOpen] = useState(false);

  const handleSearch = () => {
    const searchParams = new URLSearchParams();

    if (propertyType) searchParams.append('propertyTypes', propertyType);
    if (roomsFrom) searchParams.append('roomsFrom', roomsFrom);
    if (roomsTo) searchParams.append('roomsTo', roomsTo);
    if (priceFrom) searchParams.append('priceFrom', priceFrom);
    if (priceTo) searchParams.append('priceTo', priceTo);

    const queryString = searchParams.toString();
    const params = new URLSearchParams(queryString);
    params.set('offer_type', activeTab === 'to_rent' ? 'rent' : 'sale');
    router.push(`/listings${params.toString() ? `?${params.toString()}` : ''}`);
  };

  const TAB_ACTIONS: Record<
    ActiveTab,
    { type: 'tab' | 'link'; label: string; href?: string }
  > = {
    buy: { type: 'tab', label: 'Купить' },
    sell: { type: 'link', label: 'Продать', href: '/sell-property' },
    to_rent: { type: 'tab', label: 'Снять' },
    to_rent_out: { type: 'link', label: 'Сдать', href: '/rent-property' },
    map: { type: 'tab', label: 'На карте' },
    evaluate: { type: 'link', label: 'Оценить', href: '/rate-property' },
    fast_buy: { type: 'link', label: 'Сроч. выкуп', href: '/buy-property' },
  };

  const handleAdvancedSearch = (filters: PropertyFilters) => {
    const searchParams = new URLSearchParams();

    Object.entries(filters).forEach(([key, value]) => {
      if (value && value !== '' && value !== '0') {
        searchParams.append(key, value as string);
      }
    });

    const queryString = searchParams.toString();
    const params = new URLSearchParams(queryString);
    params.set('offer_type', activeTab === 'to_rent' ? 'rent' : 'sale');
    router.push(`/listings${params.toString() ? `?${params.toString()}` : ''}`);
    setIsAllFiltersOpen(false);
  };

  return (
    <div
      className="mx-auto w-full max-w-[1520px] px-4 sm:px-6 lg:px-8 relative py-8 md:py-10 md:pt-[22px] overflow-hidden "
      style={{
        backgroundImage:
          "linear-gradient(rgba(0, 0, 0, 0.55), rgba(0, 0, 0, 0.55)), url('/images/banner/main.jpg')",
        backgroundSize: 'cover',
        backgroundPosition: 'center top',
        backgroundRepeat: 'no-repeat',
      }}
    >
      <div
        className={clsx(
          'bg-white/5 relative overflow-hidden z-0 rounded-[22px] px-4 sm:px-8 md:px-12 lg:px-[40px] py-6 sm:py-12 md:py-16 lg:py-[89px] backdrop-blur-[1px]',
          isAllFiltersOpen && 'rounded-b-none'
        )}
      >
        <Image
          src="/images/banner/building.png"
          alt="Building"
          width={695}
          height={695}
          className="absolute -right-12 z-0 top-0 opacity-[8%] z-[-1] pointer-events-none max-w-none"
        />
        <div className="text-center mb-6 sm:mb-8 md:mb-12 lg:mb-[60px] lg:px-[10px]">
          <h1 className="text-xl md:text-[52px] font-extrabold text-white mb-1.5 tracking-tight uppercase transition-all duration-300 hover:scale-105 cursor-default">
            {title}
          </h1>
          <p className="text-sm sm:text-base md:text-xl lg:text-2xl xl:text-3xl text-white">
             Manora - <span className='font-bold'>ключ </span> к дому вашей мечты
          </p>
        </div>

        {/* Tabs */}
        <div className="overflow-x-auto md:overflow-visible hide-scrollbar -mx-4 sm:mx-0 mb-6 md:mb-8">
          <div className="flex flex-nowrap md:flex-wrap gap-2 px-4 sm:px-0">
            {(
              Object.entries(TAB_ACTIONS) as [
                ActiveTab,
                (typeof TAB_ACTIONS)[ActiveTab]
              ][]
            ).map(([key, { type, label, href }]) => {
              const isActive = activeTab === key;

              const className = `shrink-0 whitespace-nowrap px-3 sm:px-6 lg:px-9 py-2 sm:py-3 rounded-lg cursor-pointer transition-all duration-150 ease-in-out text-sm sm:text-base ${
                isActive
                  ? 'bg-[#FFDE2C] shadow-sm'
                  : 'bg-white text-gray-700 border border-[#CBD5E1] hover:bg-gray-50 hover:border-gray-400'
              }`;

              if (type === 'tab') {
                return (
                  <button
                    key={key}
                    onClick={() => setActiveTab(key)}
                    className={className}
                  >
                    {label}
                  </button>
                );
              }

              if (type === 'link' && href) {
                return (
                  <Link key={key} href={href} className={className}>
                    {label}
                  </Link>
                );
              }

              return null;
            })}
          </div>
        </div>

        {/* Filter Controls */}
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:flex lg:flex-wrap gap-3">
            {/* Property Type */}
            <div className="sm:col-span-2 lg:col-span-1 lg:w-[273px]">
              <SelectInput
                value={propertyType}
                placeholder="Тип недвижимости"
                onChange={(value) => setPropertyType(value)}
                options={propertyTypes ?? []}
              />
            </div>

            {/* Rooms and Price in one row on mobile */}
            <div className="grid grid-cols-2 sm:col-span-2 lg:col-span-1 lg:flex gap-3">
              {/* Rooms Dropdown with range inputs */}
              <div className="lg:w-[169px] relative">
                <button
                  onClick={() => setShowRoomRange(!showRoomRange)}
                  className="w-full bg-white hover:bg-gray-50 px-4 py-3 rounded-lg text-left border border-gray-200 transition-colors flex items-center justify-between"
                >
                  <span className="text-gray-500">
                    {roomsFrom || roomsTo
                      ? `${roomsFrom || '0'} - ${roomsTo || '∞'}`
                      : 'Комнат'}
                  </span>

                  <svg
                    className={`w-4 h-4 transition-transform ${
                      showRoomRange ? 'rotate-180' : ''
                    }`}
                    width="12"
                    height="8"
                    viewBox="0 0 12 8"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M1 1.5L6 6.5L11 1.5"
                      stroke="#333"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>

                {showRoomRange && (
                  <div className="mt-2 grid grid-cols-2 gap-2 absolute z-50 w-full">
                    <input
                      type="tel"
                      placeholder="От"
                      value={roomsFrom}
                      onChange={(e) => setRoomsFrom(e.target.value)}
                      className="px-3 py-2 border outline-0 border-gray-200 rounded-lg text-sm bg-white"
                    />
                    <input
                      type="tel"
                      placeholder="До"
                      value={roomsTo}
                      onChange={(e) => setRoomsTo(e.target.value)}
                      className="px-3 py-2 border outline-0 border-gray-200 rounded-lg text-sm bg-white"
                    />
                  </div>
                )}
              </div>

              {/* Price Dropdown with expandable inputs */}
              <div className="lg:w-[241px] relative">
                <button
                  onClick={() => setShowPriceRange(!showPriceRange)}
                  className="w-full bg-white hover:bg-gray-50 px-4 py-3 rounded-lg text-left border border-gray-200 transition-colors flex items-center justify-between"
                >
                  <span className="text-gray-500">
                    {priceFrom || priceTo
                      ? `${priceFrom || '0'} - ${priceTo || '∞'}`
                      : 'Цена'}
                  </span>

                  <svg
                    className={`w-4 h-4 transition-transform ${
                      showPriceRange ? 'rotate-180' : ''
                    }`}
                    width="12"
                    height="8"
                    viewBox="0 0 12 8"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M1 1.5L6 6.5L11 1.5"
                      stroke="#333"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>

                {showPriceRange && (
                  <div className="mt-2 grid grid-cols-2 gap-2 absolute z-50 w-full">
                    <input
                      type="tel"
                      placeholder="От"
                      value={priceFrom}
                      onChange={(e) => setPriceFrom(e.target.value)}
                      className="px-3 py-2 border outline-0 border-gray-200 rounded-lg text-sm bg-white"
                    />
                    <input
                      type="tel"
                      placeholder="До"
                      value={priceTo}
                      onChange={(e) => setPriceTo(e.target.value)}
                      className="px-3 py-2 border outline-0 border-gray-200 rounded-lg text-sm bg-white"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* All Filters Button */}
            <button
              className="sm:col-span-2 lg:col-span-1 lg:w-[197px] bg-[#F0F2F5] hover:bg-sky-100 text-slate-700 px-4 sm:px-6 lg:px-[25px] py-3 rounded-lg text-lg flex items-center justify-center transition-colors cursor-pointer whitespace-nowrap"
              onClick={() => {
                setIsAllFiltersOpen((prev) => !prev);

                window.scrollBy({
                  top: 400, // на 100px вниз
                  left: 0,
                  behavior: 'smooth', // плавная прокрутка
                });
              }}
            >
              <FilterSearchIcon className="h-5 w-5 sm:h-6 sm:w-6 mr-2 text-[#0036A5]" />
              <span>Все фильтры</span>
            </button>

            {/* Search Button */}
            <button
              onClick={handleSearch}
              className="sm:col-span-2 lg:col-span-1 lg:w-[197px] cursor-pointer bg-[#FFDE2C] hover:bg-[#d9b90f] px-4 sm:px-6 lg:px-[71px] py-3 rounded-lg font-bold transition-all flex items-center justify-center"
            >
              Найти
            </button>
          </div>
        </div>
      </div>

      {/* All Filters Modal */}
      <AllFilters
        isOpen={isAllFiltersOpen}
        onClose={() => setIsAllFiltersOpen(false)}
        onSearch={handleAdvancedSearch}
        initialFilters={{
          propertyTypes: propertyType ? [propertyType] : [],
          roomsFrom,
          roomsTo,
          priceFrom,
          priceTo,
        }}
        propertyTypes={propertyTypes ?? []}
      />
    </div>
  );
};
