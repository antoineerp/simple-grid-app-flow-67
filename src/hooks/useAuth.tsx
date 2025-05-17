
import { useState, useEffect, useCallback } from 'react';
import { getCurrentUser } from '@/services/auth/authService';

export function useAuth() {
  const [user, setUser] = useState(getCurrentUser());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fonction pour vérifier si l'utilisateur est connecté
  const checkAuth = useCallback(() => {
    try {
      const currentUser = getCurrentUser();
      setUser(currentUser);
      setError(null);
      console.log("Auth check: ", { currentUser });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur inconnue lors de la vérification de l\'authentification';
      setError(message);
      console.error("Auth check error: ", message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Vérifier l'authentification au chargement et à intervalles réguliers
  useEffect(() => {
    checkAuth();
    
    // Vérification périodique de l'authentification toutes les 60 secondes
    const interval = setInterval(checkAuth, 60000);
    
    // Écouter les événements d'authentification
    const handleAuthEvent = () => {
      checkAuth();
    };
    
    window.addEventListener('auth-changed', handleAuthEvent);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('auth-changed', handleAuthEvent);
    };
  }, [checkAuth]);

  return {
    user,
    isLoading,
    error,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin' || user?.role === 'administrateur'
  };
}
