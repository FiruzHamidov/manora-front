import { FC, ReactNode } from 'react';

interface TabProps {
  isActive: boolean;
  onClick: () => void;
  children: ReactNode;
  className?: string;
}

export const Tab: FC<TabProps> = ({
  isActive,
  onClick,
  children,
  className = '',
}) => {
  return (
    <button
      className={`sm:px-6 px-4 py-4 rounded-full cursor-pointer md:text-lg text-sm transition-colors ${
        isActive ? 'bg-[#0036A5] text-white' : 'bg-white text-[#020617]'
      } ${className}`}
      onClick={onClick}
    >
      {children}
    </button>
  );
};
