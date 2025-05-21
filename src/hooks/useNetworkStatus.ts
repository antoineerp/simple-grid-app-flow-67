
import { useState, useEffect } from 'react';

interface NetworkStatus {
  isOnline: boolean;
  lastCheckTime?: Date;
}

/**
 * Hook pour détecter si l'utilisateur est en ligne ou hors ligne
 * @returns Un objet contenant l'état de la connexion
 */
export function useNetworkStatus(): NetworkStatus {
  const [status, setStatus] = useState<NetworkStatus>({
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    lastCheckTime: new Date()
  });

  useEffect(() => {
    // Gestionnaires d'événements pour mettre à jour l'état de connexion
    const handleOnline = () => setStatus({
      isOnline: true,
      lastCheckTime: new Date()
    });
    
    const handleOffline = () => setStatus({
      isOnline: false,
      lastCheckTime: new Date()
    });

    // Ajouter les gestionnaires d'événements
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Nettoyer les gestionnaires d'événements
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return status;
}
