'use client';

import { toast } from 'react-toastify';

interface ToastProps {
  type: 'success' | 'error' | 'info';
  message: string;
  onClose?: () => void;
  className?: string;
}

export function Toast({ type, message, onClose, className = '' }: ToastProps) {
  const styles = {
    success: 'bg-green-100 border-green-500 text-green-700',
    error: 'bg-red-100 border-red-500 text-red-700',
    info: 'bg-blue-100 border-[#0036A5] text-blue-700',
  };

  return (
    <div
      className={`fixed top-4 right-4 z-50 p-4 rounded-lg border-l-4 shadow-lg ${styles[type]} ${className}`}
    >
      <div className="flex items-center justify-between">
        <span>{message}</span>
        {onClose && (
          <button
            onClick={onClose}
            className="ml-4 text-gray-600 hover:text-gray-800"
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
}

// Simple toast function for quick usage
export const showToast = (
  type: 'success' | 'error' | 'info',
  message: string
) => {
  if (type === 'success') {
    toast.success(`✅ ${message}`);
  } else if (type === 'error') {
    toast.error(`❌ ${message}`);
  } else {
    toast.info(`ℹ️ ${message}`);
  }
};
