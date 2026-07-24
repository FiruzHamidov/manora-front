'use client';

import { Fragment, useMemo, useState } from 'react';
import { Combobox, Transition } from '@headlessui/react';
import { Check, ChevronDown, MapPin, Search, type LucideIcon } from 'lucide-react';

export type SearchableSelectOption = {
  id: string | number;
  name: string;
};

type SearchableSelectProps = {
  label: string;
  name: string;
  value: string;
  options: SearchableSelectOption[];
  onValueChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  icon?: LucideIcon;
  variant?: 'default' | 'compact';
};

const normalizeSearchValue = (value: string) =>
  value.trim().toLocaleLowerCase('ru-RU').normalize('NFD').replace(/\p{Diacritic}/gu, '');

export function SearchableSelect({
  label,
  name,
  value,
  options,
  onValueChange,
  placeholder = 'Выберите город',
  searchPlaceholder = 'Начните вводить название',
  required = false,
  disabled = false,
  error,
  icon: Icon = MapPin,
  variant = 'default',
}: SearchableSelectProps) {
  const [query, setQuery] = useState('');
  const selectedOption = options.find((option) => String(option.id) === String(value)) ?? null;
  const normalizedQuery = normalizeSearchValue(query);
  const filteredOptions = useMemo(
    () =>
      normalizedQuery
        ? options.filter((option) => normalizeSearchValue(option.name).includes(normalizedQuery))
        : options,
    [normalizedQuery, options]
  );
  const describedById = error ? `${name}-error` : undefined;
  const isCompact = variant === 'compact';

  return (
    <div>
      <label
        className={isCompact ? 'sr-only' : 'mb-2 block text-sm font-medium text-[#53645D]'}
        htmlFor={name}
      >
        {label}
        {required ? <span className="ml-1 text-red-500">*</span> : null}
      </label>

      <Combobox
        value={selectedOption}
        onChange={(option: SearchableSelectOption | null) => {
          onValueChange(option ? String(option.id) : '');
          setQuery('');
        }}
        onClose={() => setQuery('')}
        disabled={disabled}
      >
        <div className="relative">
          <div
            className={`relative flex items-center bg-white transition focus-within:ring-2 ${
              isCompact
                ? 'min-h-11 rounded-lg border-0 shadow-none'
                : 'min-h-12 rounded-xl border shadow-[0_2px_10px_rgba(15,60,44,0.04)]'
            } ${
              error
                ? 'border-red-500 focus-within:ring-red-100'
                : 'border-[#C9D5D0] focus-within:border-[#16845F] focus-within:ring-[#DDF1E9]'
            } ${disabled ? 'cursor-not-allowed bg-[#F3F5F4] opacity-60' : ''}`}
          >
            <Icon
              className={`pointer-events-none shrink-0 text-[#16845F] ${isCompact ? 'ml-3' : 'ml-3.5'}`}
              size={isCompact ? 17 : 19}
            />
            <Combobox.Input
              id={name}
              name={name}
              displayValue={(option: SearchableSelectOption | null) => option?.name ?? ''}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={selectedOption ? undefined : placeholder}
              autoComplete="off"
              required={required}
              aria-invalid={Boolean(error)}
              aria-describedby={describedById}
              className={`min-w-0 flex-1 bg-transparent text-[15px] font-medium text-[#17251F] outline-none placeholder:font-normal placeholder:text-[#89958F] ${
                isCompact ? 'h-11 px-2.5' : 'h-12 px-3'
              }`}
            />
            <Combobox.Button
              className={`flex shrink-0 items-center justify-center rounded-lg text-[#66756F] transition hover:bg-[#EEF6F2] hover:text-[#006341] ${
                isCompact ? 'mr-1 h-8 w-8' : 'mr-1.5 h-9 w-9'
              }`}
              aria-label={`Открыть список: ${label}`}
            >
              <ChevronDown size={isCompact ? 17 : 19} />
            </Combobox.Button>
          </div>

          <Transition
            as={Fragment}
            enter="transition duration-150 ease-out"
            enterFrom="translate-y-1 opacity-0"
            enterTo="translate-y-0 opacity-100"
            leave="transition duration-100 ease-in"
            leaveFrom="translate-y-0 opacity-100"
            leaveTo="translate-y-1 opacity-0"
          >
            <Combobox.Options
              className={`absolute z-40 mt-2 max-h-72 overflow-auto rounded-2xl border border-[#DDE7E2] bg-white p-2 shadow-[0_18px_45px_rgba(20,50,39,0.16)] focus:outline-none ${
                isCompact ? 'min-w-[260px]' : 'w-full'
              }`}
            >
              <div className="mb-1 flex items-center gap-2 px-2 py-1.5 text-xs font-medium text-[#78857F]">
                <Search size={14} />
                {query ? `Результаты по запросу «${query}»` : searchPlaceholder}
              </div>

              {filteredOptions.length === 0 ? (
                <div className="rounded-xl bg-[#F5F8F6] px-3 py-4 text-center text-sm text-[#6B7872]">
                  Город не найден
                </div>
              ) : (
                filteredOptions.map((option) => (
                  <Combobox.Option
                    key={option.id}
                    value={option}
                    className={({ active }) =>
                      `flex cursor-pointer select-none items-center justify-between rounded-xl px-3 py-3 text-sm transition ${
                        active ? 'bg-[#EAF6F0] text-[#005C3D]' : 'text-[#25342E]'
                      }`
                    }
                  >
                    {({ selected }) => (
                      <>
                        <span className={selected ? 'font-semibold' : 'font-medium'}>{option.name}</span>
                        <span
                          className={`flex h-6 w-6 items-center justify-center rounded-full ${
                            selected ? 'bg-[#006341] text-white' : 'text-transparent'
                          }`}
                        >
                          <Check size={15} strokeWidth={2.5} />
                        </span>
                      </>
                    )}
                  </Combobox.Option>
                ))
              )}
            </Combobox.Options>
          </Transition>
        </div>
      </Combobox>

      {error ? (
        <p id={describedById} className="mt-1.5 text-xs text-red-600">
          {error}
        </p>
      ) : null}
    </div>
  );
}
