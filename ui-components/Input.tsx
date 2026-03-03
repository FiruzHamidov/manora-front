'use client';

import { ChangeEvent } from 'react';

interface InputProps {
  label: string;
  name: string;
  value: string | number;
  onChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  type?: string;
  textarea?: boolean;
  required?: boolean;
  placeholder?: string;
  className?: string;
  inputClassName?: string;
  disabled?: boolean;
  error?: string;
  maxLength?: number;
  rows?: number;
}

export function Input({
  label,
  name,
  value,
  onChange,
  type = 'text',
  textarea = false,
  required = false,
  disabled = false,
  placeholder,
  className = '',
  inputClassName = '',
  error,
  maxLength,
  rows = 4,
}: InputProps) {
  const describedById = error ? `${name}-error` : undefined;
  const baseFieldClass =
    'w-full px-4 py-3 rounded-lg border text-gray-900 focus:outline-none focus:ring-2 focus:border-transparent bg-white/10 backdrop-blur supports-[backdrop-filter]:bg-white/10';
  const okClass = 'border-[#BAC0CC] focus:ring-[#0036A5]';
  const errClass = 'border-red-500 focus:ring-red-500';

  return (
    <div className={className}>
      <label className="block mb-2 text-sm text-[#666F8D]" htmlFor={name}>
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>

      {textarea ? (
        <textarea
          id={name}
          name={name}
          value={value}
          onChange={onChange}
          required={required}
          placeholder={placeholder}
          rows={rows}
          maxLength={maxLength}
          disabled={disabled}
          aria-invalid={!!error}
          aria-describedby={describedById}
          className={`${baseFieldClass} resize-vertical ${
            error ? errClass : okClass
          } ${inputClassName}`}
        />
      ) : (
        <input
          id={name}
          name={name}
          value={value}
          type={type}
          onChange={onChange}
          required={required}
          placeholder={placeholder}
          maxLength={maxLength}
          disabled={disabled}
          aria-invalid={!!error}
          aria-describedby={describedById}
          className={`${baseFieldClass} ${error ? errClass : okClass} ${inputClassName}`}
        />
      )}

      {error && (
        <p id={describedById} className="mt-1 text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
