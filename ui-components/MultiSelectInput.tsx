'use client';

import { Fragment, useMemo, useState } from 'react';
import { Combobox, Transition } from '@headlessui/react';
import clsx from 'clsx';
import { Check, ChevronDown, MapPin, Search, X } from 'lucide-react';

export type MultiOption = {
    id: string | number;
    name: string;
    slug?: string;
    unavailable?: boolean;
};

type MultiSelectInputProps = {
    label: string;
    options: MultiOption[];
    value: Array<string | number>;                // список выбранных id
    onChange: (ids: Array<string | number>) => void;
    placeholder?: string;
    disabled?: boolean;
    searchable?: boolean;
    searchPlaceholder?: string;
};

export default function MultiSelectInput({
                                             label,
                                             options,
                                             value,
                                             onChange,
                                             placeholder = 'Выберите...',
                                             disabled,
                                             searchable = false,
                                             searchPlaceholder = 'Начните вводить название',
                                         }: MultiSelectInputProps) {
    const [query, setQuery] = useState('');
    const selectedObjects = options.filter(o => value.includes(o.id));
    const normalizedQuery = query.trim().toLocaleLowerCase('ru-RU');
    const filteredOptions = useMemo(
        () =>
            normalizedQuery
                ? options.filter((option) =>
                    option.name.toLocaleLowerCase('ru-RU').includes(normalizedQuery)
                )
                : options,
        [normalizedQuery, options]
    );

    const handleChange = (selected: MultiOption[]) => {
        onChange(selected.map(s => s.id));
        setQuery('');
    };

    const removeOne = (id: string | number) => {
        onChange(value.filter(v => v !== id));
    };

    if (searchable) {
        return (
            <div className="flex w-full flex-col gap-2">
                <label className="text-sm font-medium text-[#475569]">{label}</label>
                <Combobox
                    multiple
                    value={selectedObjects}
                    onChange={handleChange}
                    onClose={() => setQuery('')}
                    disabled={disabled}
                >
                    <div className="relative">
                        <div
                            className={clsx(
                                'rounded-xl border border-[#C9D5D0] bg-white shadow-[0_2px_10px_rgba(15,60,44,0.04)] transition focus-within:border-[#16845F] focus-within:ring-2 focus-within:ring-[#DDF1E9]',
                                disabled && 'cursor-not-allowed bg-[#F3F5F4] opacity-60'
                            )}
                        >
                            {selectedObjects.length > 0 ? (
                                <div className="flex flex-wrap gap-1.5 px-3 pt-2.5">
                                    {selectedObjects.map((item) => (
                                        <span
                                            key={item.id}
                                            className="inline-flex min-h-7 items-center gap-1 rounded-full bg-[#EAF6F0] px-2.5 text-xs font-semibold text-[#006341]"
                                        >
                                            {item.name}
                                            <button
                                                type="button"
                                                onClick={(event) => {
                                                    event.stopPropagation();
                                                    removeOne(item.id);
                                                }}
                                                className="rounded-full p-0.5 transition hover:bg-[#D4EDE2]"
                                                aria-label={`Удалить ${item.name}`}
                                            >
                                                <X size={13} />
                                            </button>
                                        </span>
                                    ))}
                                </div>
                            ) : null}

                            <div className="flex min-h-12 items-center">
                                <MapPin className="ml-3.5 shrink-0 text-[#16845F]" size={19} />
                                <Combobox.Input
                                    value={query}
                                    onChange={(event) => setQuery(event.target.value)}
                                    placeholder={selectedObjects.length ? 'Добавить город' : placeholder}
                                    autoComplete="off"
                                    className="h-12 min-w-0 flex-1 bg-transparent px-3 text-[15px] font-medium text-[#17251F] outline-none placeholder:font-normal placeholder:text-[#89958F]"
                                />
                                <Combobox.Button
                                    className="mr-1.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[#66756F] transition hover:bg-[#EEF6F2] hover:text-[#006341]"
                                    aria-label={`Открыть список: ${label}`}
                                >
                                    <ChevronDown size={19} />
                                </Combobox.Button>
                            </div>
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
                            <Combobox.Options className="absolute z-30 mt-2 max-h-72 w-full overflow-auto rounded-2xl border border-[#DDE7E2] bg-white p-2 shadow-[0_18px_45px_rgba(20,50,39,0.16)] focus:outline-none">
                                <div className="mb-1 flex items-center gap-2 px-2 py-1.5 text-xs font-medium text-[#78857F]">
                                    <Search size={14} />
                                    {query ? `Результаты по запросу «${query}»` : searchPlaceholder}
                                </div>

                                {filteredOptions.length === 0 ? (
                                    <div className="rounded-xl bg-[#F5F8F6] px-3 py-4 text-center text-sm text-[#6B7872]">
                                        Город не найден
                                    </div>
                                ) : (
                                    filteredOptions.map((option) => {
                                        const selected = value.includes(option.id);
                                        return (
                                            <Combobox.Option
                                                key={option.id}
                                                value={option}
                                                disabled={option.unavailable}
                                                className={({ active }) =>
                                                    clsx(
                                                        'flex cursor-pointer select-none items-center justify-between rounded-xl px-3 py-3 text-sm transition',
                                                        active ? 'bg-[#EAF6F0] text-[#005C3D]' : 'text-[#25342E]',
                                                        option.unavailable && 'cursor-not-allowed opacity-50'
                                                    )
                                                }
                                            >
                                                <span className={selected ? 'font-semibold' : 'font-medium'}>
                                                    {option.name}
                                                </span>
                                                <span
                                                    className={clsx(
                                                        'flex h-6 w-6 items-center justify-center rounded-full',
                                                        selected ? 'bg-[#006341] text-white' : 'text-transparent'
                                                    )}
                                                >
                                                    <Check size={15} strokeWidth={2.5} />
                                                </span>
                                            </Combobox.Option>
                                        );
                                    })
                                )}
                            </Combobox.Options>
                        </Transition>
                    </div>
                </Combobox>
            </div>
        );
    }

    return (
        <div className="w-full flex flex-col gap-3">
            <label className="block text-[#666F8D] text-lg">{label}</label>
            <Combobox multiple value={selectedObjects} onChange={handleChange} disabled={disabled}>
                <div className="relative">
                    {/* Поле ввода работает как кнопка */}
                    <Combobox.Button
                        as="div"
                        className={clsx(
                            "relative w-full cursor-pointer bg-[#F0F2F5] rounded-lg py-2 px-3 text-lg pr-10 text-left",
                            "outline-none focus-visible:ring-2 focus-visible:ring-[#006341]",
                            disabled && "opacity-60 cursor-not-allowed"
                        )}
                    >
                        <div className="flex flex-wrap gap-1.5">
                            {selectedObjects.length === 0 && (
                                <span className="text-gray-400">{placeholder}</span>
                            )}
                            {selectedObjects.map(item => (
                                <span
                                    key={item.id}
                                    className="inline-flex items-center gap-1 rounded-full bg-[#EFFAF5] text-[#006341] text-sm px-2 py-0.5"
                                >
                  {item.name}
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            removeOne(item.id);
                                        }}
                                        className="hover:text-[#004D33]"
                                        aria-label={`Удалить ${item.name}`}
                                    >
                    {/* Иконка X */}
                                        <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                      <path
                          fillRule="evenodd"
                          d="M10 8.586 4.95 3.536 3.536 4.95 8.586 10l-5.05 5.05L4.95 16.464 10 11.414l5.05 5.05 1.414-1.414L11.414 10l5.05-5.05L15.05 3.536 10 8.586z"
                          clipRule="evenodd"
                      />
                    </svg>
                  </button>
                </span>
                            ))}
                        </div>

                        {/* стрелка справа */}
                        <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                            <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5 text-black">
                                <path
                                    fillRule="evenodd"
                                    d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.08 1.04l-4.24 4.25a.75.75 0 01-1.06 0L5.21 8.27a.75.75 0 01.02-1.06z"
                                    clipRule="evenodd"
                                />
                            </svg>
                        </div>
                    </Combobox.Button>

                    {/* список опций */}
                    <Transition
                        as={Fragment}
                        leave="transition ease-in duration-100"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                    >
                        <Combobox.Options className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black/5 focus:outline-none sm:text-sm">
                            {options.map((opt) => {
                                const selected = value.includes(opt.id);
                                return (
                                    <Combobox.Option
                                        key={opt.id}
                                        value={opt}
                                        disabled={opt.unavailable}
                                        className={({ active }) =>
                                            clsx(
                                                'relative cursor-default select-none py-2 pl-10 pr-4',
                                                active ? 'bg-purple-600 text-white rounded-lg' : 'text-gray-900',
                                                opt.unavailable && 'opacity-60 cursor-not-allowed'
                                            )
                                        }
                                    >
                    <span className={clsx('block truncate', selected ? 'font-medium' : 'font-normal')}>
                      {opt.name}
                    </span>
                                        {selected && (
                                            <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                        {/* Галочка */}
                                                <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
                          <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-7.071 7.071a1 1 0 01-1.414 0L3.293 9.95a1 1 0 111.414-1.415l3.102 3.102 6.364-6.364a1 1 0 011.414 0z"
                              clipRule="evenodd"
                          />
                        </svg>
                      </span>
                                        )}
                                    </Combobox.Option>
                                );
                            })}
                        </Combobox.Options>
                    </Transition>
                </div>
            </Combobox>
        </div>
    );
}
