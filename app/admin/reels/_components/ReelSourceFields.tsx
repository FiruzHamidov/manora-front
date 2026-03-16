'use client';

import type { ReactNode } from 'react';
import { useDeferredValue, useMemo, useState } from 'react';
import { CarFront, Building2, House, Sparkles } from 'lucide-react';
import { Input } from '@/ui-components/Input';
import { useGetPropertiesQuery } from '@/services/properties/hooks';
import { useGetCarsQuery } from '@/services/cars/hooks';
import { useDevelopers } from '@/services/new-buildings/hooks';
import type { Property } from '@/services/properties/types';
import type { Car } from '@/services/cars/types';
import type { Developer, Paginated } from '@/services/new-buildings/types';
import type { ReelSourceType } from '@/services/reels/types';

type GenericFields = {
  title: string;
  description: string;
  hook: string;
};

type ReelSourceFieldsProps = {
  disabled?: boolean;
  locked?: boolean;
  sourceType: ReelSourceType;
  sourceId: string;
  genericFields: GenericFields;
  errors?: Record<string, string>;
  onSourceTypeChange: (value: ReelSourceType) => void;
  onSourceIdChange: (value: string) => void;
  onGenericFieldChange: (field: keyof GenericFields, value: string) => void;
};

type SourceCardProps = {
  active: boolean;
  disabled?: boolean;
  icon: ReactNode;
  label: string;
  description: string;
  onClick: () => void;
};

type OptionItem = {
  id: number;
  title: string;
  subtitle: string;
};

function SourceTypeCard({
  active,
  disabled = false,
  icon,
  label,
  description,
  onClick,
}: SourceCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`rounded-[20px] border p-4 text-left transition ${
        active
          ? 'border-[#B2CCFF] bg-[#EEF4FF]'
          : 'border-[#EAECF0] bg-white hover:border-[#D0D5DD]'
      } disabled:opacity-60`}
    >
      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-[#0036A5] shadow-sm">
        {icon}
      </div>
      <div className="mt-3 text-sm font-semibold text-[#101828]">{label}</div>
      <div className="mt-1 text-sm leading-6 text-[#667085]">{description}</div>
    </button>
  );
}

function SourceOptionList({
  items,
  value,
  onSelect,
}: {
  items: OptionItem[];
  value: string;
  onSelect: (value: string) => void;
}) {
  if (items.length === 0) {
    return (
      <div className="rounded-[20px] border border-dashed border-[#D0D5DD] px-4 py-8 text-center text-sm text-[#667085]">
        Ничего не найдено по текущему запросу.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {items.map((item) => {
        const active = value === String(item.id);
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onSelect(String(item.id))}
            className={`w-full rounded-[18px] border px-4 py-3 text-left transition ${
              active
                ? 'border-[#B2CCFF] bg-[#EEF4FF]'
                : 'border-[#EAECF0] bg-white hover:border-[#D0D5DD]'
            }`}
          >
            <div className="text-sm font-semibold text-[#101828]">{item.title}</div>
            <div className="mt-1 text-sm text-[#667085]">{item.subtitle}</div>
          </button>
        );
      })}
    </div>
  );
}

function normalizeDevelopers(data?: Developer[] | Paginated<Developer>): Developer[] {
  if (!data) return [];
  return Array.isArray(data) ? data : data.data ?? [];
}

function formatPrice(value?: string | number | null, currency?: string | null) {
  if (value === undefined || value === null || value === '') return 'Цена не указана';
  const amount = Number(value);
  if (!Number.isFinite(amount)) return `${value} ${currency ?? ''}`.trim();
  return `${amount.toLocaleString('ru-RU')} ${currency ?? ''}`.trim();
}

function getPropertyOption(property: Property): OptionItem {
  return {
    id: property.id,
    title: property.title || `Объект #${property.id}`,
    subtitle: [
      formatPrice(property.price, property.currency),
      property.district || property.location?.district || property.location?.city,
      property.total_area ? `${property.total_area} м2` : null,
    ]
      .filter(Boolean)
      .join(' · '),
  };
}

function getCarOption(car: Car): OptionItem {
  return {
    id: car.id,
    title:
      car.title ||
      `${car.brand?.name ?? ''} ${car.model?.name ?? ''}`.trim() ||
      `Авто #${car.id}`,
    subtitle: [
      car.year ? `Год ${car.year}` : null,
      formatPrice(car.price, car.currency),
      car.category?.name ?? null,
    ]
      .filter(Boolean)
      .join(' · '),
  };
}

function getDeveloperOption(developer: Developer): OptionItem {
  return {
    id: developer.id,
    title: developer.name,
    subtitle: [
      developer.phone || null,
      developer.address || null,
      developer.total_projects ? `Проектов: ${developer.total_projects}` : null,
    ]
      .filter(Boolean)
      .join(' · '),
  };
}

export function ReelSourceFields({
  disabled = false,
  locked = false,
  sourceType,
  sourceId,
  genericFields,
  errors,
  onSourceTypeChange,
  onSourceIdChange,
  onGenericFieldChange,
}: ReelSourceFieldsProps) {
  const [search, setSearch] = useState('');
  const deferredSearch = useDeferredValue(search);

  const propertyQuery = useGetPropertiesQuery(
    {
      title: deferredSearch || undefined,
      per_page: 20,
    },
    false
  );
  const carQuery = useGetCarsQuery({
    search: deferredSearch || undefined,
    per_page: 20,
  });
  const developersQuery = useDevelopers({ page: 1, per_page: 100 });

  const developerOptions = useMemo(() => {
    const developers = normalizeDevelopers(developersQuery.data);
    const normalizedSearch = deferredSearch.trim().toLowerCase();

    return developers
      .filter((developer) => {
        if (!normalizedSearch) return true;
        return (
          developer.name.toLowerCase().includes(normalizedSearch) ||
          String(developer.id).includes(normalizedSearch)
        );
      })
      .slice(0, 20)
      .map(getDeveloperOption);
  }, [deferredSearch, developersQuery.data]);

  const propertyOptions = (propertyQuery.data?.data ?? []).map(getPropertyOption);
  const carOptions = (carQuery.data?.data ?? []).map(getCarOption);

  const sourceOptions =
    sourceType === 'property'
      ? propertyOptions
      : sourceType === 'car'
      ? carOptions
      : sourceType === 'developer'
      ? developerOptions
      : [];

  const isLoading =
    sourceType === 'property'
      ? propertyQuery.isLoading
      : sourceType === 'car'
      ? carQuery.isLoading
      : sourceType === 'developer'
      ? developersQuery.isLoading
      : false;

  return (
    <section className="rounded-[24px] bg-white p-5 shadow-[0_1px_2px_rgba(16,24,40,0.04)] md:p-6">
      <div>
        <h2 className="text-xl font-bold text-[#101828]">Источник рилса</h2>
        <p className="mt-1 text-sm text-[#667085]">
          Выберите, на чём строится сценарий: объект недвижимости, автомобиль, застройщик или полностью ручной generic-режим.
        </p>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <SourceTypeCard
          active={sourceType === 'property'}
          disabled={disabled || locked}
          icon={<House className="h-5 w-5" />}
          label="Недвижимость"
          description="Рилс строится на данных объявления недвижимости."
          onClick={() => onSourceTypeChange('property')}
        />
        <SourceTypeCard
          active={sourceType === 'car'}
          disabled={disabled || locked}
          icon={<CarFront className="h-5 w-5" />}
          label="Автомобиль"
          description="Сценарий привязан к карточке автомобиля."
          onClick={() => onSourceTypeChange('car')}
        />
        <SourceTypeCard
          active={sourceType === 'developer'}
          disabled={disabled || locked}
          icon={<Building2 className="h-5 w-5" />}
          label="Застройщик"
          description="Рилс собирается по профилю застройщика."
          onClick={() => onSourceTypeChange('developer')}
        />
        <SourceTypeCard
          active={sourceType === 'generic'}
          disabled={disabled || locked}
          icon={<Sparkles className="h-5 w-5" />}
          label="Без привязки"
          description="Полностью ручной generic-сценарий без источника."
          onClick={() => onSourceTypeChange('generic')}
        />
      </div>

      {locked ? (
        <div className="mt-4 rounded-[18px] bg-[#F8FAFC] px-4 py-3 text-sm text-[#667085]">
          Источник рилса заблокирован в режиме редактирования, чтобы не менять связанный backend-объект.
        </div>
      ) : null}

      {sourceType === 'generic' ? (
        <div className="mt-5 grid gap-4">
          <Input
            label="Заголовок основы"
            name="source_data_title"
            value={genericFields.title}
            onChange={(event) => onGenericFieldChange('title', event.target.value)}
            error={errors?.source_data_title}
            disabled={disabled}
            placeholder="Например: Подборка сильных предложений"
          />
          <Input
            label="Описание основы"
            name="source_data_description"
            textarea
            rows={3}
            value={genericFields.description}
            onChange={(event) => onGenericFieldChange('description', event.target.value)}
            error={errors?.source_data_description}
            disabled={disabled}
            placeholder="Коротко опишите, о чём рилс и какую подборку или идею он раскрывает"
          />
          <Input
            label="Хук основы"
            name="source_data_hook"
            value={genericFields.hook}
            onChange={(event) => onGenericFieldChange('hook', event.target.value)}
            error={errors?.source_data_hook}
            disabled={disabled}
            placeholder="Сильные предложения за 25 секунд"
          />
        </div>
      ) : (
        <div className="mt-5">
          <Input
            label="Поиск источника"
            name="source_lookup"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            disabled={disabled}
            placeholder={
              sourceType === 'property'
                ? 'Введите название объекта'
                : sourceType === 'car'
                ? 'Введите марку, модель или ID'
                : 'Введите название застройщика'
            }
          />

          <div className="mt-4">
            {isLoading ? (
              <div className="rounded-[20px] border border-dashed border-[#D0D5DD] px-4 py-8 text-center text-sm text-[#667085]">
                Загрузка источников...
              </div>
            ) : (
              <SourceOptionList
                items={sourceOptions}
                value={sourceId}
                onSelect={onSourceIdChange}
              />
            )}
          </div>

          {errors?.source_id ? (
            <p className="mt-2 text-xs text-red-600">{errors.source_id}</p>
          ) : null}
        </div>
      )}
    </section>
  );
}
