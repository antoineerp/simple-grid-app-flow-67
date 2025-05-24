
import { useState, useEffect } from 'react';
import { getIsLoggedIn, getCurrentUser } from '@/services/auth/authService';
import type { Utilisateur } from '@/types/auth';

export const useAuth = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(getIsLoggedIn());
  const [user, setUser] = useState<Utilisateur | null>(null);

  useEffect(() => {
    const updateAuthState = () => {
      const loggedIn = getIsLoggedIn();
      setIsLoggedIn(loggedIn);
      
      if (loggedIn) {
        // Récupérer les informations utilisateur depuis le localStorage
        const userDataString = localStorage.getItem('currentUser');
        const userRole = localStorage.getItem('userRole');
        
        console.log('useAuth - User data from localStorage:', userDataString);
        console.log('useAuth - User role from localStorage:', userRole);
        
        if (userDataString) {
          try {
            const userData = JSON.parse(userDataString);
            // S'assurer que le rôle est correctement défini
            const finalUser = {
              ...userData,
              role: userData.role || userRole || 'utilisateur'
            };
            console.log('useAuth - Final user object:', finalUser);
            setUser(finalUser);
          } catch (error) {
            console.error('useAuth - Erreur lors du parsing des données utilisateur:', error);
            setUser(null);
          }
        } else {
          // Créer un objet utilisateur minimal avec les informations disponibles
          const currentUserId = getCurrentUser();
          if (currentUserId) {
            setUser({
              id: 0,
              email: currentUserId,
              identifiant_technique: currentUserId,
              role: userRole || 'utilisateur',
              nom: '',
              prenom: ''
            });
          }
        }
      } else {
        setUser(null);
      }
    };

    // Initialiser l'état
    updateAuthState();

    // Écouter les changements d'authentification
    const handleStorageChange = () => {
      updateAuthState();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('database-user-changed', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('database-user-changed', handleStorageChange);
    };
  }, []);

  return {
    isLoggedIn,
    user
  };
};
