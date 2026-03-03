'use client';

import {ChangeEvent} from 'react';

interface SelectProps<T extends object> {
    label: string;
    name: string;
    value: string;
    options: T[];
    onChange: (e: ChangeEvent<HTMLSelectElement>) => void;
    labelField?: keyof T;
    valueField?: keyof T;
    required?: boolean;
    className?: string;
    selectClassName?: string;
    placeholder?: string;
    disabled?: boolean;
    error?: string;
}

export function Select<T extends object>({
                           label,
                           name,
                           value,
                           options,
                           onChange,
                           labelField = 'name' as keyof T,
                           valueField = 'id' as keyof T,
                           required = false,
                           className = '',
                           selectClassName = '',
                           placeholder = 'Выберите из списка',
                           disabled = false,
                           error,
                       }: SelectProps<T>) {
    const describedById = error ? `${name}-error` : undefined;

    return (
        <div className={className}>
            <label className="block mb-2 text-sm text-[#666F8D]" htmlFor={name}>
                {label}
                {required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <select
                id={name}
                name={name}
                value={value}
                onChange={onChange}
                required={required}
                disabled={disabled}
                aria-invalid={!!error}
                aria-describedby={describedById}
                className={`w-full px-4 py-3 rounded-lg border bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#0036A5] focus:border-transparent ${
                    error ? 'border-red-500' : 'border-[#BAC0CC]'
                } ${selectClassName}`}
            >
                <option value="">{placeholder}</option>
                {options.map((opt) => (
                    <option
                        key={String((opt[valueField] ?? opt[labelField]) as string | number | undefined)}
                        value={String((opt[valueField] ?? '') as string | number)}
                    >
                        {String((opt[labelField] ?? '') as string | number)}
                    </option>
                ))}
            </select>
            {error && (
                <p id={describedById} className="mt-1 text-xs text-red-600">
                    {error}
                </p>
            )}
        </div>
    );
}
