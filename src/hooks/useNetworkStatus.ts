
import { useState, useEffect } from 'react';

/**
 * Hook pour détecter si l'utilisateur est en ligne ou hors ligne
 * @returns Un objet contenant l'état de la connexion
 */
export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    // Gestionnaires d'événements pour mettre à jour l'état de connexion
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    // Ajouter les gestionnaires d'événements
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Nettoyer les gestionnaires d'événements
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return { isOnline };
}
