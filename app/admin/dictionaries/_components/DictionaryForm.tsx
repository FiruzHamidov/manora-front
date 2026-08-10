'use client';

import { ChangeEvent, MouseEvent } from 'react';
import { Input } from '@/ui-components/Input';

export type DictionaryFormFieldType = 'text' | 'number' | 'select';

export type DictionarySelectOption = {
  value: string;
  label: string;
};

export type DictionaryFormField = {
  name: string;
  label: string;
  type: DictionaryFormFieldType;
  placeholder?: string;
  required?: boolean;
  min?: number;
  max?: number;
  rows?: number;
  options?: DictionarySelectOption[];
};

export type DictionaryFormErrors = Record<string, string>;

type DictionaryFormValue = Record<string, string>;

type DictionaryFormProps = {
  fields: DictionaryFormField[];
  values: DictionaryFormValue;
  errors: DictionaryFormErrors;
  disabled: boolean;
  onChange: (field: string, value: string) => void;
  onSubmit: () => Promise<void> | void;
  onCancel: (event?: MouseEvent<HTMLButtonElement>) => void;
};

export default function DictionaryForm({
  fields,
  values,
  errors,
  disabled,
  onChange,
  onSubmit,
  onCancel,
}: DictionaryFormProps) {
  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    onChange(e.target.name, e.target.value);
  };

  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      void onSubmit();
    }} className="grid gap-4 sm:grid-cols-2">
      {fields.map((field) => {
        if (field.type === 'select') {
          return (
            <div key={field.name} className="space-y-1">
              <label className="block mb-2 text-sm text-[#666F8D]">
                {field.label}
                {field.required && <span className="text-red-500 ml-1">*</span>}
              </label>
              <select
                name={field.name}
                value={values[field.name] ?? ''}
                onChange={handleChange}
                required={field.required}
                disabled={disabled}
                className={`w-full px-4 py-3 rounded-lg border text-gray-900 focus:outline-none focus:ring-2 focus:border-transparent bg-white ${
                  errors[field.name] ? 'border-red-500 focus:ring-red-500' : 'border-[#BAC0CC] focus:ring-[#006341]'
                }`}
              >
                <option value="">—</option>
                {(field.options ?? []).map((option) => (
                  <option value={option.value} key={`${field.name}-${option.value}`}>
                    {option.label}
                  </option>
                ))}
              </select>
              {errors[field.name] && (
                <p className="text-xs text-red-600">{errors[field.name]}</p>
              )}
            </div>
          );
        }

        return (
          <Input
            key={field.name}
            name={field.name}
            label={field.label}
            value={values[field.name] ?? ''}
            onChange={handleChange}
            placeholder={field.placeholder}
            type={field.type}
            required={field.required}
            disabled={disabled}
            min={field.min}
            max={field.max}
            rows={field.rows}
            error={errors[field.name]}
          />
        );
      })}

      <div className="sm:col-span-2 flex justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 rounded-md border text-sm text-[#475467] hover:bg-gray-50"
          disabled={disabled}
        >
          Отмена
        </button>
        <button
          type="submit"
          className="px-4 py-2 rounded-md bg-[#006341] text-white hover:bg-[#004D33] disabled:opacity-60"
          disabled={disabled}
        >
          Сохранить
        </button>
      </div>
    </form>
  );
}

