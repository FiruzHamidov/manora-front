'use client';

import clsx from 'clsx';

interface Option {
  id?: string | number;
  slug?: string;
  name: string;
  unavailable?: boolean;
}

interface SelectInputProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  suffix?: string;
}

export function SelectInput({
  label,
  placeholder,
  value,
  onChange,
  options,
  suffix,
}: SelectInputProps) {
  return (
    <div className="flex flex-col gap-3">
      {label && <label className="text-[#666F8D] text-lg">{label}</label>}
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={clsx(
            'w-full bg-[#F0F2F5] rounded-lg py-3 px-4 text-lg appearance-none outline-none',
            {
              'text-[#666F8D]': !value,
            }
          )}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((option) => (
            <option
              key={option.id || option.slug}
              value={option.id || option.slug}
            >
              {option.name}
            </option>
          ))}
        </select>

        {/* Custom dropdown arrow */}
        <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
          <svg
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
        </div>

        {suffix && (
          <span className="absolute right-10 top-1/2 transform -translate-y-1/2 text-gray-600">
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}
