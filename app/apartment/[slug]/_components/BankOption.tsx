'use client';

import Image from 'next/image';

interface BankOptionProps {
  name: string;
  logo: string;
  isSelected: boolean;
  onSelect: () => void;
}

export function BankOption({
  name,
  logo,
  isSelected,
  onSelect,
}: BankOptionProps) {
  return (
    <button
      onClick={onSelect}
      className={`flex items-center justify-center w-full md:w-[230px] h-[87px] rounded-full border ${
        isSelected ? 'border-[#0036A5]' : 'border-[#E3E6EA]'
      } transition-colors hover:border-blue-300`}
    >
      <Image src={logo} alt={name} width={120} height={40} />
    </button>
  );
}
