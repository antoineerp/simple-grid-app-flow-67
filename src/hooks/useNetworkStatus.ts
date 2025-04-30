
import { useState, useEffect, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';

interface NetworkStatus {
  isOnline: boolean;
  wasOffline: boolean;
}

export const useNetworkStatus = (): NetworkStatus => {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [wasOffline, setWasOffline] = useState<boolean>(false);
  const { toast } = useToast();
  const initialCheckDone = useRef<boolean>(false);
  
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
        description: "La connexion Internet n'est pas disponible. Mode hors-ligne activé.",
        variant: "destructive",
        duration: 5000,
      });
    };
    
    // Test actif de la connectivité au démarrage
    const checkConnectivity = async () => {
      try {
        const response = await fetch('/api/info.php', { 
          method: 'HEAD',
          cache: 'no-store'
        });
        setIsOnline(true);
        console.log("Test de connectivité API réussi");
        initialCheckDone.current = true;
      } catch (error) {
        console.error("Erreur de test de connectivité API:", error);
        setIsOnline(navigator.onLine);
        initialCheckDone.current = true;
      }
    };
    
    // Vérifier la connectivité au démarrage
    checkConnectivity();
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Initialiser avec l'état actuel
    setIsOnline(navigator.onLine);
    
    // Configurer une vérification périodique
    const intervalId = setInterval(checkConnectivity, 30000); // Vérifier toutes les 30 secondes
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(intervalId);
    };
  }, [isOnline, toast]);
  
  return { isOnline, wasOffline };
};
