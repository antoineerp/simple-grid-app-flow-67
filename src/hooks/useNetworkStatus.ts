
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
  const checkInProgressRef = useRef<boolean>(false);
  
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
      
      // Nettoyer les verrous de synchronisation périmés lorsque la connexion est rétablie
      try {
        const keys = Object.keys(localStorage);
        const syncLockKeys = keys.filter(key => key.startsWith('sync_in_progress_') || key.startsWith('sync_lock_time_'));
        
        if (syncLockKeys.length > 0) {
          console.log("useNetworkStatus - Nettoyage des verrous après reconnexion:", syncLockKeys);
          syncLockKeys.forEach(key => {
            localStorage.removeItem(key);
          });
        }
      } catch (error) {
        console.error("useNetworkStatus - Erreur lors du nettoyage des verrous:", error);
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
      // Éviter les vérifications simultanées
      if (checkInProgressRef.current) return;
      
      checkInProgressRef.current = true;
      
      try {
        const response = await fetch('/api/info.php', { 
          method: 'HEAD',
          cache: 'no-store',
          // Ajouter un paramètre pour éviter la mise en cache
          headers: { 'Cache-Control': 'no-cache' }
        });
        
        if (response.ok) {
          setIsOnline(true);
          console.log("Test de connectivité API réussi");
        } else {
          // Si le serveur répond mais avec une erreur, considérer comme en ligne quand même
          setIsOnline(true);
          console.warn(`Test de connectivité API: réponse avec statut ${response.status}`);
        }
        
        initialCheckDone.current = true;
      } catch (error) {
        console.error("Erreur de test de connectivité API:", error);
        setIsOnline(navigator.onLine);
        initialCheckDone.current = true;
      } finally {
        checkInProgressRef.current = false;
      }
    };
    
    // Vérifier la connectivité au démarrage
    checkConnectivity();
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Initialiser avec l'état actuel
    setIsOnline(navigator.onLine);
    
    // Configurer une vérification périodique
    const intervalId = setInterval(checkConnectivity, 60000); // Vérifier toutes les 60 secondes (augmenté pour réduire la charge)
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(intervalId);
    };
  }, [isOnline, toast]);
  
  return { isOnline, wasOffline };
};
