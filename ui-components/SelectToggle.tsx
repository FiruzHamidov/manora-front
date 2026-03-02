'use client';

import clsx from 'clsx';

interface SelectToggleProps<T extends string | number> {
  title: string;
  options: { id: T; name: string }[];
  selected: T | null;
  setSelected: (val: T) => void;
  className?: string;
  disabled?: boolean; // ← добавили
}

export function SelectToggle<T extends string | number>({
                                                          title,
                                                          options,
                                                          selected,
                                                          setSelected,
                                                          className = '',
                                                          disabled = false, // ← добавили
                                                        }: SelectToggleProps<T>) {
  return (
      <div className={className} aria-disabled={disabled}>
        <h2 className="font-semibold mb-2 text-[#666F8D]">{title}</h2>
        <div className="flex flex-wrap gap-2">
          {options.map((opt) => {
            const isActive = selected === opt.id;
            return (
                <button
                    key={String(opt.id)}
                    type="button"
                    disabled={disabled}
                    className={clsx(
                        'px-4 py-2 rounded-full border transition-colors',
                        isActive
                            ? 'bg-[#0036A5] text-white border-[#0036A5]'
                            : 'bg-white text-black border-[#BAC0CC] hover:border-[#0036A5]',
                        disabled && 'opacity-50 cursor-not-allowed hover:border-[#BAC0CC]'
                    )}
                    onClick={() => {
                      if (disabled) return;
                      setSelected(opt.id);
                    }}
                >
                  {opt.name}
                </button>
            );
          })}
        </div>
      </div>
  );
}