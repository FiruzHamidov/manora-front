// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import clsx from 'clsx';
import { Tabs } from '@/ui-components/tabs/tabs';
import BuyCard from '../_components/buy/buy-card';
import { getComparisonIds, removeFromComparison } from '@/utils/comparison';
import { useGetPropertyByIdQuery } from '@/services/properties/hooks';
import { toast } from 'react-toastify';

const attributeLabels = [
  'Общая площадь',
  'Жилая площадь',
  'Город',
  'Этаж',
  'Балкон',
  'Материал стен',
  'Вид из окон',
  'Комнаты',
  'Ремонт',
  'Санузел',
  'Лифт',
];

const tabs = [
  { label: 'Все параметры', key: 'all' },
  { label: 'Только различия', key: 'differences' },
] as const;

const mapPropertyToComparisonFormat = (
  property: Property
): Property & { attributes: Record<string, string> } => {
  const attributes = {
    'Общая площадь': `${property.total_area || 0} м²`,
    'Жилая площадь': `${property.living_area || 0} м²`,
    Город:
      typeof property.location === 'object'
        ? property.location?.city || 'не указано'
        : 'не указано',
    Этаж: property.floor || 'не указан',
    Балкон: property.has_balcony ? 'Да' : 'Нет',
    'Материал стен': property.wall_material || 'не указан',
    'Вид из окон': property.view || 'не указан',
    Комнаты: property.room_type || 'не указано',
    Ремонт: property.repair_type?.name || 'не указано',
    Санузел: property.bathroom_type || 'не указан',
    Лифт: property.has_elevator ? 'Есть' : 'Нет',
  };

  return {
    ...property,
    attributes,
  };
};

export default function Comparison() {
  const [activeType, setActiveType] = useState<string>('all');
  const [comparisonIds, setComparisonIds] = useState<string[]>([]);
  const router = useRouter();

  useEffect(() => {
    const ids = getComparisonIds();
    setComparisonIds(ids);

    if (ids.length < 2) {
      toast.error('Выберите минимум 2 объекта для сравнения');
      router.push('/listings');
    }
  }, [router]);

  const {
    data: property1Data,
    isLoading: isLoading1,
    error: error1,
  } = useGetPropertyByIdQuery(comparisonIds[0] || '', !!comparisonIds[0]);

  const {
    data: property2Data,
    isLoading: isLoading2,
    error: error2,
  } = useGetPropertyByIdQuery(comparisonIds[1] || '', !!comparisonIds[1]);

  const properties = [
    property1Data && mapPropertyToComparisonFormat(property1Data),
    property2Data && mapPropertyToComparisonFormat(property2Data),
  ].filter(Boolean);

  const isLoading = isLoading1 || isLoading2;
  const hasError = error1 || error2;

  const hasDifference = (attribute: string) => {
    if (properties.length < 2) return false;
    return (
      properties[0].attributes[attribute] !==
      properties[1].attributes[attribute]
    );
  };

  const filteredAttributes = attributeLabels.filter(
    (attr) => activeType === 'all' || hasDifference(attr)
  );

  const handleRemoveProperty = (id) => {
    removeFromComparison(id);
    const newIds = getComparisonIds();
    setComparisonIds(newIds);

    if (newIds.length < 2) {
      toast.error('Недостаточно объектов для сравнения');
      router.push('/listings');
    }
  };

  if (isLoading) {
    return (
      <div className="mx-auto w-full max-w-[1520px] px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-[22px] p-[30px] text-center">
          <h1 className="text-xl sm:text-2xl font-bold mb-4">Сравнение</h1>
          <p>Загрузка данных для сравнения...</p>
        </div>
      </div>
    );
  }

  if (hasError || properties.length < 2) {
    return (
      <div className="mx-auto w-full max-w-[1520px] px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-[22px] p-[30px] text-center">
          <h1 className="text-xl sm:text-2xl font-bold mb-4">Сравнение</h1>
          <p className="mb-4">
            {hasError
              ? 'Ошибка при загрузке данных для сравнения'
              : 'Недостаточно объектов для сравнения'}
          </p>
          <button
            className="px-4 py-2 bg-[#0036A5] text-white rounded-md"
            onClick={() => router.push('/listings')}
          >
            Вернуться к списку объектов
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[1520px] px-4 sm:px-6 lg:px-8 py-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 sm:mb-10 bg-white rounded-[22px] p-4 sm:p-[30px]">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Сравнение</h1>
          <p className="text-[#666F8D] text-sm sm:text-base">
            Найдено {properties.length} объекта
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="w-full sm:w-auto overflow-x-auto hide-scrollbar">
            <Tabs
              tabs={tabs}
              activeType={activeType}
              setActiveType={setActiveType}
            />
          </div>
        </div>
      </div>

      {/* Property cards - responsive grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-[30px] mb-8 sm:mb-[53px]">
        {properties.map((property) => (
          <div key={property.id} className="relative">
            <button
              onClick={() => handleRemoveProperty(property.id)}
              className="absolute top-2 right-2 z-10 bg-white/60 rounded-full p-1 shadow-md"
              aria-label="Удалить из сравнения"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M18 6L6 18M6 6L18 18"
                  stroke="#0036A5"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            <BuyCard listing={property} />
          </div>
        ))}
      </div>

      {/* Comparison table - mobile responsive */}
      <div className="bg-white rounded-[22px] overflow-hidden mb-16 sm:mb-[83px]">
        {filteredAttributes.map((attribute) => {
          const isLightBackground = [
            'Жилая площадь',
            'Этаж',
            'Материал стен',
            'Комнаты',
            'Санузел',
          ].includes(attribute);

          return (
            <div
              key={attribute}
              className={clsx(
                'flex flex-col sm:flex-row',
                isLightBackground ? 'bg-[#EFF6FF]' : 'bg-white'
              )}
            >
              {/* Mobile: Stack vertically */}
              <div className="sm:hidden">
                <div className="px-4 py-3 border-b border-gray-100">
                  <div className="text-sm text-[#667085] mb-2">{attribute}</div>
                  <div className="flex justify-between gap-4">
                    <div className="flex-1">
                      <div className="text-xs text-gray-500 mb-1">Объект 1</div>
                      {attribute.includes('площадь') ? (
                        <div className="text-base font-normal">
                          {properties[0].attributes[attribute].split('м²')[0]}
                          <span>
                            м<sup>2</sup>
                          </span>
                        </div>
                      ) : (
                        <div className="text-base font-normal">
                          {properties[0].attributes[attribute]}
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="text-xs text-gray-500 mb-1">Объект 2</div>
                      {attribute.includes('площадь') ? (
                        <div className="text-base font-normal">
                          {properties[1].attributes[attribute].split('м²')[0]}
                          <span>
                            м<sup>2</sup>
                          </span>
                        </div>
                      ) : (
                        <div className="text-base font-normal">
                          {properties[1].attributes[attribute]}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Desktop: Side by side */}
              <div className="hidden sm:flex w-full">
                <div className="w-1/2 px-4 sm:px-[30px] py-4">
                  <div className="text-sm sm:text-lg text-[#667085] mb-2 sm:mb-3">
                    {attribute}
                  </div>

                  {attribute.includes('площадь') ? (
                    <div className="text-lg sm:text-2xl font-normal">
                      {properties[0].attributes[attribute].split('м²')[0]}
                      <span>
                        м<sup>2</sup>
                      </span>
                    </div>
                  ) : (
                    <div className="text-lg sm:text-2xl font-normal">
                      {properties[0].attributes[attribute]}
                    </div>
                  )}
                </div>

                <div className="w-1/2 px-4 sm:px-[30px] py-4">
                  <div className="h-6 mb-2 sm:mb-3" />
                  {attribute.includes('площадь') ? (
                    <div className="text-lg sm:text-2xl font-normal">
                      {properties[1].attributes[attribute].split('м²')[0]}
                      <span>
                        м<sup>2</sup>
                      </span>
                    </div>
                  ) : (
                    <div className="text-lg sm:text-2xl font-normal">
                      {properties[1].attributes[attribute]}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
