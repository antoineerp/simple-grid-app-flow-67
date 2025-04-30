
import { useState, useEffect, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';

interface NetworkStatus {
  isOnline: boolean;
  wasOffline: boolean;
  lastCheckTime: number; // Ajouter un timestamp pour le dernier contrôle
}

export const useNetworkStatus = (): NetworkStatus => {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [wasOffline, setWasOffline] = useState<boolean>(false);
  const [lastCheckTime, setLastCheckTime] = useState<number>(Date.now());
  const { toast } = useToast();
  const initialCheckDone = useRef<boolean>(false);
  const checkInProgressRef = useRef<boolean>(false);
  const retryCount = useRef<number>(0);
  
  useEffect(() => {
    const handleOnline = () => {
      console.log("Connexion internet rétablie");
      setIsOnline(true);
      setLastCheckTime(Date.now());
      
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
        
        // Marquer les données pour re-synchronisation
        const pendingSyncKeys = keys.filter(key => key.startsWith('pending_sync_'));
        if (pendingSyncKeys.length > 0) {
          console.log("useNetworkStatus - Données en attente de synchronisation détectées:", pendingSyncKeys);
          
          // Créer un événement personnalisé pour déclencher une re-synchronisation
          const syncEvent = new CustomEvent('force-sync-required', {
            detail: {
              timestamp: Date.now(),
              tables: pendingSyncKeys.map(key => key.replace('pending_sync_', ''))
            }
          });
          window.dispatchEvent(syncEvent);
        }
      } catch (error) {
        console.error("useNetworkStatus - Erreur lors du nettoyage des verrous:", error);
      }
    };
    
    const handleOffline = () => {
      console.log("Connexion internet perdue");
      setIsOnline(false);
      setLastCheckTime(Date.now());
      
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
        // Ajout d'un paramètre aléatoire pour éviter la mise en cache
        const cacheBreaker = `?nocache=${Date.now()}`;
        const response = await fetch('/api/info.php' + cacheBreaker, { 
          method: 'HEAD',
          cache: 'no-store',
          headers: { 'Cache-Control': 'no-cache, max-age=0' },
          credentials: 'same-origin'
        });
        
        if (response.ok) {
          setIsOnline(true);
          retryCount.current = 0; // Réinitialiser le compteur de tentatives
          console.log("Test de connectivité API réussi");
          
          // Si nous étions offline avant, déclencher une synchronisation
          if (!isOnline) {
            const syncEvent = new CustomEvent('connectivity-restored', {
              detail: { timestamp: Date.now() }
            });
            window.dispatchEvent(syncEvent);
          }
        } else {
          // Si le serveur répond mais avec une erreur, considérer comme en ligne quand même
          setIsOnline(true);
          console.warn(`Test de connectivité API: réponse avec statut ${response.status}`);
        }
        
        initialCheckDone.current = true;
      } catch (error) {
        console.error("Erreur de test de connectivité API:", error);
        
        // Incrémenter le nombre d'essais
        retryCount.current++;
        
        // Après plusieurs tentatives, se fier à navigator.onLine
        if (retryCount.current >= 3) {
          console.log(`Après ${retryCount.current} échecs, utilisation de navigator.onLine:`, navigator.onLine);
          setIsOnline(navigator.onLine);
        } else {
          // Sinon, maintenir l'état actuel
          console.log("Maintien de l'état de connexion actuel:", isOnline);
        }
        
        initialCheckDone.current = true;
      } finally {
        checkInProgressRef.current = false;
        setLastCheckTime(Date.now());
      }
    };
    
    // Vérifier la connectivité au démarrage
    checkConnectivity();
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Initialiser avec l'état actuel
    setIsOnline(navigator.onLine);
    
    // Configurer une vérification périodique avec intervalle dynamique
    const intervalId = setInterval(() => {
      // Ajuster l'intervalle en fonction de l'état de connexion
      checkConnectivity();
    }, isOnline ? 60000 : 30000); // Vérifier plus fréquemment si hors ligne
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(intervalId);
    };
  }, [isOnline, toast]);
  
  return { isOnline, wasOffline, lastCheckTime };
};
