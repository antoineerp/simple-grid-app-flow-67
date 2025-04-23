
import { useState } from 'react';
import type { Utilisateur } from '@/services';

export const useUserTable = () => {
  const [showPasswords, setShowPasswords] = useState<{[key: string]: boolean}>({});

  const getInitials = (nom: string, prenom: string) => {
    return `${prenom.charAt(0)}${nom.charAt(0)}`.toUpperCase();
  };

  const togglePasswordVisibility = (userId: number) => {
    setShowPasswords(prev => ({
      ...prev,
      [userId]: !prev[userId]
    }));
  };

  return {
    showPasswords,
    getInitials,
    togglePasswordVisibility
  };
};
