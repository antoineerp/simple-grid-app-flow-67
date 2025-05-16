
import { useState, useEffect } from 'react';
import { User } from '@/types/auth';
import { getAuthToken, getCurrentUser } from '@/services/auth/authService';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadUser = () => {
      try {
        const currentUser = getCurrentUser();
        setUser(currentUser);
        
        // Stocker le rôle dans localStorage pour accès facile
        if (currentUser?.role) {
          localStorage.setItem('userRole', currentUser.role);
        }
      } catch (error) {
        console.error("Error loading user:", error);
        setUser(null); // S'assurer que l'utilisateur est null en cas d'erreur
      } finally {
        setIsLoading(false);
      }
    };

    loadUser();
  }, []);

  const isAuthenticated = (): boolean => {
    const token = getAuthToken();
    return !!token && !!user;
  };

  const getUserId = (): string | undefined => {
    return user?.id;
  };

  const getRole = (): string | undefined => {
    return user?.role;
  };

  const getUserName = (): string => {
    return user ? `${user.prenom || ''} ${user.nom || ''}`.trim() : '';
  };

  const logout = () => {
    // This will be implemented through the authService
    window.location.href = '/';
  };

  return {
    user,
    isLoading,
    isAuthenticated,
    getUserId,
    getRole,
    getUserName,
    logout
  };
};
