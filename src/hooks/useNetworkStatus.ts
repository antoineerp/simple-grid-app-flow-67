
import { useState, useEffect } from 'react';

interface NetworkStatus {
  isOnline: boolean;
  wasOffline: boolean;
}

export const useNetworkStatus = (): NetworkStatus => {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [wasOffline, setWasOffline] = useState<boolean>(false);
  
  useEffect(() => {
    const handleOnline = () => {
      console.log("Connexion internet rétablie");
      setIsOnline(true);
      if (!isOnline) {
        setWasOffline(true);
      }
    };
    
    const handleOffline = () => {
      console.log("Connexion internet perdue");
      setIsOnline(false);
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Initialiser avec l'état actuel
    setIsOnline(navigator.onLine);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  return { isOnline, wasOffline };
};
