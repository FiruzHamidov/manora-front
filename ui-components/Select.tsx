'use client';

import {ChangeEvent} from 'react';
import {SelectOption} from '@/services/add-post/types';

interface SelectProps {
    label: string;
    name: string;
    value: string;
    options: SelectOption[];
    onChange: (e: ChangeEvent<HTMLSelectElement>) => void;
    labelField?: keyof SelectOption;
    valueField?: keyof SelectOption;
    required?: boolean;
    className?: string;
}

export function Select({
                           label,
                           name,
                           value,
                           options,
                           onChange,
                           labelField = 'name',
                           valueField = 'id',
                           required = false,
                           className = '',
                       }: SelectProps) {
    return (
        <div className={className}>
            <label className="block mb-2 text-sm  text-[#666F8D]">
                {label}
                {required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <select
                name={name}
                value={value}
                onChange={onChange}
                required={required}
                className="w-full px-4 py-3 rounded-lg border border-[#BAC0CC] bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#0036A5] focus:border-transparent"
            >
                <option value="">Выберите из списка</option>
                {options.map((opt) => (
                    <option key={opt.id} value={String(opt[valueField])}>
                        {opt[labelField]}
                    </option>
                ))}
            </select>
        </div>
    );
}
