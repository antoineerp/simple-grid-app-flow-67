
import { useState, useEffect } from 'react';
import { User } from '@/types/auth';
import { getAuthToken, getCurrentUser } from '@/services/auth/authService';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = getCurrentUser();
        setUser(currentUser);
        
        // Stocker le rôle dans localStorage pour accès facile
        if (currentUser?.role) {
          // Pour la compatibilité, normaliser les rôles admin/administrateur
          if (currentUser.role === 'admin' || currentUser.role === 'administrateur') {
            // Toujours stocker les deux versions pour assurer la compatibilité
            localStorage.setItem('userRole', currentUser.role);
            // Assurer que le code qui vérifie spécifiquement 'admin' ou 'administrateur' fonctionne
            localStorage.setItem('isAdministrator', 'true');
          } else {
            localStorage.setItem('userRole', currentUser.role);
            localStorage.removeItem('isAdministrator');
          }
        }

        // Stocker également l'identifiant utilisateur pour garantir l'isolation des données
        if (currentUser?.id) {
          localStorage.setItem('currentUserId', currentUser.id);
          console.log(`Utilisateur identifié: ${currentUser.id} (${currentUser?.prenom} ${currentUser?.nom})`);
        }
      } catch (error) {
        console.error("Error loading user:", error);
        setUser(null); // S'assurer que l'utilisateur est null en cas d'erreur
        localStorage.removeItem('currentUserId');
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
    return user?.id || localStorage.getItem('currentUserId') || undefined;
  };

  const getRole = (): string | undefined => {
    return user?.role || localStorage.getItem('userRole') || undefined;
  };

  const isAdmin = (): boolean => {
    const role = getRole();
    return role === 'admin' || role === 'administrateur' || localStorage.getItem('isAdministrator') === 'true';
  };

  const getUserName = (): string => {
    return user ? `${user.prenom || ''} ${user.nom || ''}`.trim() : '';
  };

  const logout = () => {
    // This will be implemented through the authService
    localStorage.removeItem('userRole');
    localStorage.removeItem('isAdministrator');
    localStorage.removeItem('currentUserId');
    window.location.href = '/';
  };

  return {
    user,
    isLoading,
    isAuthenticated,
    getUserId,
    getRole,
    isAdmin,
    getUserName,
    logout
  };
};
