
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

interface NetworkStatus {
  isOnline: boolean;
  wasOffline: boolean;
}

export const useNetworkStatus = (): NetworkStatus => {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [wasOffline, setWasOffline] = useState<boolean>(false);
  const { toast } = useToast();
  
  useEffect(() => {
    const handleOnline = () => {
      console.log("Connexion internet rétablie");
      setIsOnline(true);
      
      if (!isOnline) {
        setWasOffline(true);
        toast({
          title: "Connexion rétablie",
          description: "La connexion Internet est de nouveau disponible. Synchronisation en cours...",
          duration: 3000,
        });
      }
    };
    
    const handleOffline = () => {
      console.log("Connexion internet perdue");
      setIsOnline(false);
      
      toast({
        title: "Connexion perdue",
        description: "La connexion Internet n'est pas disponible. Impossible de synchroniser les données.",
        variant: "destructive",
        duration: 5000,
      });
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Initialiser avec l'état actuel
    setIsOnline(navigator.onLine);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [isOnline, toast]);
  
  return { isOnline, wasOffline };
};
