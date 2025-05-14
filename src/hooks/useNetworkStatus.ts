
import { useState, useEffect, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';

interface NetworkStatus {
  isOnline: boolean;
  wasOffline: boolean;
  lastCheckTime: number;
}

export const useNetworkStatus = (): NetworkStatus => {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [wasOffline, setWasOffline] = useState<boolean>(false);
  const [lastCheckTime, setLastCheckTime] = useState<number>(Date.now());
  const { toast } = useToast();
  const initialCheckDone = useRef<boolean>(false);
  const checkInProgressRef = useRef<boolean>(false);
  const retryCount = useRef<number>(0);
  const networkErrorsCount = useRef<number>(0);
  const maxConsecutiveErrors = 5;
  
  // Fonction de contrôle de santé de la connexion
  const checkConnectivity = async (quiet = false): Promise<boolean> => {
    // Éviter les vérifications simultanées
    if (checkInProgressRef.current) return isOnline;
    
    checkInProgressRef.current = true;
    
    try {
      // Si trop d'erreurs consécutives, considérer comme hors ligne
      if (networkErrorsCount.current >= maxConsecutiveErrors) {
        console.log(`Trop d'erreurs réseau consécutives (${networkErrorsCount.current}), considéré comme hors ligne`);
        setIsOnline(false);
        checkInProgressRef.current = false;
        return false;
      }
      
      // Vérifie l'état global du navigateur d'abord
      if (!navigator.onLine) {
        console.log("Navigator.onLine indique hors ligne");
        setIsOnline(false);
        checkInProgressRef.current = false;
        return false;
      }
      
      // Ajout d'un paramètre aléatoire pour éviter la mise en cache
      const cacheBreaker = `?nocache=${Date.now()}`;
      
      // Utiliser fetch avec un timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 secondes max
      
      try {
        // Pour éviter trop de requêtes, on fait un test HEAD simple
        const response = await fetch('/api/info.php' + cacheBreaker, { 
          method: 'HEAD',
          cache: 'no-store',
          signal: controller.signal,
          headers: { 'Cache-Control': 'no-cache, max-age=0' },
          credentials: 'same-origin'
        });
        
        clearTimeout(timeoutId);
        
        if (response.ok) {
          console.log("Test de connectivité API réussi");
          networkErrorsCount.current = 0; // Réinitialiser le compteur d'erreurs
          setIsOnline(true);
          
          // Si nous étions offline avant, marquer comme récemment reconnecté
          if (!isOnline) {
            setWasOffline(true);
            if (!quiet) {
              toast({
                title: "Connexion rétablie",
                description: "La connexion Internet est de nouveau disponible."
              });
            }
            
            // Déclencher un événement de reconnexion
            window.dispatchEvent(new CustomEvent('connectivity-restored', {
              detail: { timestamp: Date.now() }
            }));
          }
          
          checkInProgressRef.current = false;
          setLastCheckTime(Date.now());
          return true;
        } else {
          console.warn(`Test de connectivité API: réponse avec statut ${response.status}`);
          networkErrorsCount.current++;
          
          // Après plusieurs erreurs consécutives, considérer comme hors ligne
          if (networkErrorsCount.current >= maxConsecutiveErrors) {
            setIsOnline(false);
          }
          
          checkInProgressRef.current = false;
          setLastCheckTime(Date.now());
          return false;
        }
      } catch (error) {
        clearTimeout(timeoutId);
        console.warn("Erreur lors du test de connectivité:", error);
        networkErrorsCount.current++;
        
        // Après plusieurs erreurs consécutives, considérer comme hors ligne
        if (networkErrorsCount.current >= maxConsecutiveErrors) {
          setIsOnline(false);
          if (!quiet && isOnline) { // Seulement notifier si on était en ligne avant
            toast({
              title: "Connexion perdue",
              description: "Mode hors-ligne activé suite à plusieurs échecs de connexion.",
              variant: "destructive",
            });
          }
        }
        
        checkInProgressRef.current = false;
        setLastCheckTime(Date.now());
        return false;
      }
    } catch (error) {
      console.error("Erreur inattendue lors de la vérification réseau:", error);
      checkInProgressRef.current = false;
      setLastCheckTime(Date.now());
      return isOnline; // Conserver l'état actuel
    }
  };
  
  useEffect(() => {
    const handleOnline = async () => {
      console.log("Événement navigator.onLine: Connexion disponible");
      
      // Attendre un court instant pour confirmer la connexion
      await new Promise(r => setTimeout(r, 1000));
      
      // Vérifier si la connexion est réellement disponible
      const connected = await checkConnectivity(false);
      
      if (connected) {
        // Nettoyer les verrous de synchronisation périmés
        try {
          const keys = Object.keys(localStorage);
          const syncLockKeys = keys.filter(key => key.startsWith('sync_in_progress_') || key.startsWith('sync_lock_time_'));
          
          if (syncLockKeys.length > 0) {
            console.log("Nettoyage des verrous après reconnexion:", syncLockKeys);
            syncLockKeys.forEach(key => {
              localStorage.removeItem(key);
            });
          }
        } catch (error) {
          console.error("Erreur lors du nettoyage des verrous:", error);
        }
      }
    };
    
    const handleOffline = () => {
      console.log("Événement navigator.onLine: Connexion perdue");
      setIsOnline(false);
      setLastCheckTime(Date.now());
      
      toast({
        title: "Connexion perdue",
        description: "Mode hors-ligne activé automatiquement.",
        variant: "destructive",
      });
    };
    
    // Vérifier la connectivité au démarrage après un court délai
    const initialTimeout = setTimeout(() => checkConnectivity(), 2000);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Configurer une vérification périodique avec intervalle dynamique
    const intervalId = setInterval(() => {
      if (!checkInProgressRef.current) {
        checkConnectivity(true); // En mode silencieux pour les vérifications périodiques
      }
    }, isOnline ? 60000 : 30000); // Vérifier plus fréquemment si hors ligne
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearTimeout(initialTimeout);
      clearInterval(intervalId);
    };
  }, [isOnline, toast]);
  
  return { isOnline, wasOffline, lastCheckTime };
};
