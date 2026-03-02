'use client';

import { ChangeEvent, ReactNode } from 'react';

interface FormFieldProps {
  label: string;
  name: string;
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  type?: string;
  textarea?: boolean;
  required?: boolean;
  placeholder?: string;
  className?: string;
  error?: string;
  helpText?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  disabled?: boolean;
}

export function FormField({
  label,
  name,
  value,
  onChange,
  type = 'text',
  textarea = false,
  required = false,
  placeholder,
  className = '',
  error,
  helpText,
  leftIcon,
  rightIcon,
  disabled = false,
}: FormFieldProps) {
  return (
    <div className={className}>
      <label className="block mb-2 text-sm  text-[#666F8D]">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>

      <div className="relative">
        {leftIcon && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
            {leftIcon}
          </div>
        )}

        {textarea ? (
          <textarea
            name={name}
            value={value}
            onChange={onChange}
            required={required}
            placeholder={placeholder}
            disabled={disabled}
            rows={4}
            className={`w-full px-4 py-3 rounded-lg border bg-white text-gray-900 resize-vertical focus:outline-none focus:ring-2 focus:ring-[#0036A5] focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500 ${
              leftIcon ? 'pl-10' : ''
            } ${rightIcon ? 'pr-10' : ''} ${
              error ? 'border-red-500' : 'border-[#BAC0CC]'
            }`}
          />
        ) : (
          <input
            name={name}
            value={value}
            type={type}
            onChange={onChange}
            required={required}
            placeholder={placeholder}
            disabled={disabled}
            className={`w-full px-4 py-3 rounded-lg border bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#0036A5] focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500 ${
              leftIcon ? 'pl-10' : ''
            } ${rightIcon ? 'pr-10' : ''} ${
              error ? 'border-red-500' : 'border-[#BAC0CC]'
            }`}
          />
        )}

        {rightIcon && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
            {rightIcon}
          </div>
        )}
      </div>

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

      {helpText && !error && (
        <p className="mt-2 text-sm text-gray-500">{helpText}</p>
      )}
    </div>
  );
}
