'use client';
import { useMemo } from 'react';

type Opt = { label: string; value: string | number };

export function MultiSelect({
                              label,
                              value,
                              options,
                              onChange,
                              className = '',
                            }: {
  label: string;
  value: (string | number)[];
  options: Opt[];
  onChange: (next: (string | number)[]) => void;
  className?: string;
}) {
  const set = useMemo(() => new Set(value), [value]);

  const toggle = (v: string | number) => {
    const next = new Set(set);
    if (next.has(v)) next.delete(v);
    else next.add(v);
    onChange(Array.from(next));
  };

  return (
      <div className={className}>
        <div className="block mb-2 text-sm text-[#666F8D]">{label}</div>
        <div className="flex flex-wrap gap-2">
          {options.map((o) => {
            const active = set.has(o.value);
            return (
                <button
                    key={String(o.value)}
                    type="button"
                    onClick={() => toggle(o.value)}
                    className={`px-4 py-3 rounded-lg border ${active ? 'bg-[#0036A5] text-white border-[#0036A5]' : 'bg-white text-gray-800 border-[#BAC0CC] hover:bg-gray-50'}`}
                >
                  {o.label}
                </button>
            );
          })}
        </div>
      </div>
  );
}