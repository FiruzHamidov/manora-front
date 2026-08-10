'use client';

import { Fragment, useMemo, useRef, useState } from 'react';
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
  emptyMessage?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  icon?: LucideIcon;
  variant?: 'default' | 'compact' | 'hero';
  searchable?: boolean;
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
  emptyMessage = 'Ничего не найдено',
  required = false,
  disabled = false,
  error,
  icon: Icon = MapPin,
  variant = 'default',
  searchable = true,
}: SearchableSelectProps) {
  const [query, setQuery] = useState('');
  const buttonRef = useRef<HTMLButtonElement>(null);
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
  const isHero = variant === 'hero';

  return (
    <div className={isHero ? 'h-full min-w-0' : undefined}>
      <label
        className={isCompact || isHero ? 'sr-only' : 'mb-2 block text-sm font-medium text-[#53645D]'}
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
        <div className={`relative ${isHero ? 'h-full' : ''}`}>
          <div
            className={`relative flex items-center transition focus-within:ring-2 ${
              isHero
                ? 'h-full cursor-pointer rounded-[15px] border bg-white/78 shadow-none hover:border-[#A9CDBE] focus-within:bg-white/88 focus-within:ring-0'
                : isCompact
                ? 'min-h-11 rounded-lg border-0 bg-white shadow-none'
                : 'min-h-12 rounded-xl border bg-white shadow-[0_2px_10px_rgba(15,60,44,0.04)]'
            } ${
              error
                ? 'border-red-500 focus-within:ring-red-100'
                : 'border-[#C9D5D0] focus-within:border-[#16845F] focus-within:ring-[#DDF1E9]'
            } ${disabled ? 'cursor-not-allowed bg-[#F3F5F4] opacity-60' : ''}`}
          >
            <Icon
              className={`pointer-events-none shrink-0 text-[#16845F] ${isHero ? 'ml-4' : isCompact ? 'ml-3' : 'ml-3.5'}`}
              size={isHero || isCompact ? 18 : 19}
            />
            {searchable ? (
              <>
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
                  className={`min-w-0 flex-1 cursor-text bg-transparent font-medium text-[#17251F] outline-none placeholder:font-normal placeholder:text-[#89958F] ${
                    isHero
                      ? 'h-full px-2.5 text-[14px]'
                      : isCompact
                        ? 'h-11 px-2.5 text-[15px]'
                        : 'h-12 px-3 text-[15px]'
                  }`}
                />
                <Combobox.Button
                  ref={buttonRef}
                  className={`flex shrink-0 items-center justify-center rounded-lg text-[#66756F] transition hover:bg-[#EEF6F2] hover:text-[#006341] ${
                    isHero ? 'mr-2 h-9 w-9' : isCompact ? 'mr-1 h-8 w-8' : 'mr-1.5 h-9 w-9'
                  }`}
                  aria-label={`Открыть список: ${label}`}
                >
                  <ChevronDown size={isCompact ? 17 : 19} />
                </Combobox.Button>
              </>
            ) : (
              <Combobox.Button
                ref={buttonRef}
                id={name}
                aria-invalid={Boolean(error)}
                aria-describedby={describedById}
                className={`flex min-w-0 flex-1 cursor-pointer items-center text-left font-medium text-[#17251F] outline-none ${
                  isHero
                    ? 'h-full px-2.5 text-[14px]'
                    : isCompact
                      ? 'h-11 px-2.5 text-[15px]'
                      : 'h-12 px-3 text-[15px]'
                }`}
              >
                <span className={`min-w-0 flex-1 truncate ${selectedOption ? '' : 'font-normal text-[#89958F]'}`}>
                  {selectedOption?.name ?? placeholder}
                </span>
                <span className={`ml-2 flex shrink-0 items-center justify-center rounded-lg text-[#66756F] ${isHero ? 'h-9 w-9' : 'h-8 w-8'}`}>
                  <ChevronDown size={isCompact ? 17 : 19} />
                </span>
              </Combobox.Button>
            )}
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
              className={`absolute z-[70] max-h-72 overflow-auto rounded-2xl border border-[#DDE7E2] bg-white p-2 shadow-[0_18px_45px_rgba(20,50,39,0.16)] focus:outline-none ${
                isHero ? 'bottom-full mb-2' : 'mt-2'
              } ${
                isHero ? 'w-full min-w-[300px]' : isCompact ? 'min-w-[260px]' : 'w-full'
              }`}
            >
              <div className="mb-1 flex items-center gap-2 px-2 py-1.5 text-xs font-medium text-[#78857F]">
                {searchable ? <Search size={14} /> : null}
                {query ? `Результаты по запросу «${query}»` : searchable ? searchPlaceholder : 'Выберите вариант'}
              </div>

              {filteredOptions.length === 0 ? (
                <div className="rounded-xl bg-[#F5F8F6] px-3 py-4 text-center text-sm text-[#6B7872]">
                  {emptyMessage}
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
