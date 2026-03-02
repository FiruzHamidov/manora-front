'use client';

import { useEffect, useState } from 'react';
import LoginModal from '@/app/login/LoginModal';

export default function AuthModalMount() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const openModal = () => setIsOpen(true);
    const closeModal = () => setIsOpen(false);

    window.addEventListener('open-login-modal', openModal);
    window.addEventListener('close-login-modal', closeModal);

    return () => {
      window.removeEventListener('open-login-modal', openModal);
      window.removeEventListener('close-login-modal', closeModal);
    };
  }, []);

  if (!isOpen) {
    return null;
  }

  return <LoginModal onClose={() => setIsOpen(false)} />;
}
