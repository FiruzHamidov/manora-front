'use client';

import { Fragment } from 'react';
import { Combobox, Transition } from '@headlessui/react';
import clsx from 'clsx';

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
};

export default function MultiSelectInput({
                                             label,
                                             options,
                                             value,
                                             onChange,
                                             placeholder = 'Выберите...',
                                             disabled,
                                         }: MultiSelectInputProps) {
    const selectedObjects = options.filter(o => value.includes(o.id));

    const handleChange = (selected: MultiOption[]) => {
        onChange(selected.map(s => s.id));
    };

    const removeOne = (id: string | number) => {
        onChange(value.filter(v => v !== id));
    };

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
                            "outline-none focus-visible:ring-2 focus-visible:ring-blue-600",
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
                                    className="inline-flex items-center gap-1 rounded-full bg-blue-50 text-blue-700 text-sm px-2 py-0.5"
                                >
                  {item.name}
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            removeOne(item.id);
                                        }}
                                        className="hover:text-blue-900"
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