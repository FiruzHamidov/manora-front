'use client';

import DateIcon from '@/icons/DateIcon';

interface DateInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
}

export function DateInput({ label, value, onChange }: DateInputProps) {
  return (
    <div className="flex flex-col gap-3">
      <label className="text-[#666F8D] text-[18px]">{label}</label>
      <div className="relative">
        <input
          type="date"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="DD.MM.YYYY"
          className="w-full bg-[#F0F2F5] rounded-lg py-5 px-4 text-lg"
        />
        <div className="absolute inset-y-0 right-4 flex items-center">
          <DateIcon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
}
