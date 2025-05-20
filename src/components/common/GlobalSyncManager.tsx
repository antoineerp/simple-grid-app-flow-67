import React, { useEffect, useState, useRef } from 'react';
import { useSyncContext } from '@/features/sync/hooks/useSyncContext';
import SyncDebugger from '@/features/sync/components/SyncDebugger';

// Activer le débogage uniquement en développement
const enableDebugging = import.meta.env.DEV;

const GlobalSyncManager: React.FC = () => {
  const { syncAll, isOnline, forceProcessQueue } = useSyncContext();
  const [initialSyncDone, setInitialSyncDone] = useState(false);
  const mountedRef = useRef<boolean>(false);
  const initRef = useRef<boolean>(false);
  const lastSyncRef = useRef<number>(Date.now());
  const forceSyncRequiredRef = useRef<boolean>(false);
  
  // Séquence minimum entre deux synchronisations complètes (5 minutes)
  const MIN_SYNC_INTERVAL = 300000;
  
  // Assurer que le composant est bien monté avant d'exécuter des effets
  useEffect(() => {
    console.log("GlobalSyncManager - Composant monté");
    mountedRef.current = true;
    
    // Une fois au montage, créer un élément dans le DOM
    if (!initRef.current) {
      initRef.current = true;
      try {
        const syncInitElement = document.createElement('div');
        syncInitElement.id = 'global-sync-manager-initialized';
        syncInitElement.style.display = 'none';
        document.body.appendChild(syncInitElement);
      } catch (error) {
        console.error("GlobalSyncManager - Erreur lors de l'initialisation du marqueur DOM:", error);
      }
    }
    
    return () => {
      console.log("GlobalSyncManager - Composant démonté");
      mountedRef.current = false;
      
      // Nettoyer le marqueur DOM lors du démontage
      if (initRef.current) {
        try {
          const syncInitElement = document.getElementById('global-sync-manager-initialized');
          if (syncInitElement) {
            document.body.removeChild(syncInitElement);
          }
        } catch (error) {
          console.error("GlobalSyncManager - Erreur lors du nettoyage du marqueur DOM:", error);
        }
      }
    };
  }, []);
  
  // Écouter les événements de synchronisation forcée
  useEffect(() => {
    const handleForceSyncRequired = () => {
      if (!mountedRef.current) return;
      
      console.log("GlobalSyncManager - Événement de synchronisation forcée reçu");
      forceSyncRequiredRef.current = true;
      
      // Tenter une synchronisation
      const now = Date.now();
      if (isOnline && now - lastSyncRef.current > MIN_SYNC_INTERVAL) {
        console.log("GlobalSyncManager - Déclenchement de la synchronisation forcée");
        
        // Ajouter un délai pour éviter les synchronisations simultanées
        setTimeout(() => {
          if (mountedRef.current) {
            // Force le traitement de la file d'attente d'abord
            forceProcessQueue();
            
            // Puis lancer la synchronisation
            syncAll()
              .then(results => {
                console.log("GlobalSyncManager - Résultats de la synchronisation forcée:", results);
                lastSyncRef.current = Date.now();
                forceSyncRequiredRef.current = false;
              })
              .catch(error => {
                console.error("GlobalSyncManager - Erreur lors de la synchronisation forcée:", error);
              });
          }
        }, 1000);
      }
    };
    
    // Écouter les événements personnalisés
    window.addEventListener('force-sync-required', handleForceSyncRequired);
    window.addEventListener('connectivity-restored', handleForceSyncRequired);
    
    return () => {
      window.removeEventListener('force-sync-required', handleForceSyncRequired);
      window.removeEventListener('connectivity-restored', handleForceSyncRequired);
    };
  }, [isOnline, syncAll, forceProcessQueue]);
  
  // Synchronisation initiale et périodique
  useEffect(() => {
    if (!mountedRef.current) return;
    
    try {
      console.log("GlobalSyncManager - Initialisation de la synchronisation");
      
      // Déclencher la première synchronisation après un délai
      // pour laisser le temps à l'application de se stabiliser
      const initialSyncTimeout = setTimeout(() => {
        if (mountedRef.current && !initialSyncDone && isOnline) {
          console.log("GlobalSyncManager - Démarrage de la synchronisation initiale");
          
          syncAll()
            .then(() => {
              if (mountedRef.current) {
                console.log("GlobalSyncManager - Synchronisation initiale terminée");
                setInitialSyncDone(true);
                lastSyncRef.current = Date.now();
              }
            })
            .catch(error => {
              if (mountedRef.current) {
                console.error("GlobalSyncManager - Erreur lors de la synchronisation initiale:", error);
                // Même en cas d'erreur, marquer comme initialisé
                setInitialSyncDone(true);
              }
            });
        }
      }, 5000);
      
      // Synchronisations périodiques (toutes les 5 minutes)
      const periodicSyncInterval = setInterval(() => {
        if (!mountedRef.current) return;
        
        const now = Date.now();
        
        // N'exécuter que si en ligne et dernier sync > 5 min
        if (isOnline && now - lastSyncRef.current > 300000) {
          console.log("GlobalSyncManager - Démarrage de la synchronisation périodique");
          
          syncAll()
            .then(() => {
              if (mountedRef.current) {
                lastSyncRef.current = Date.now();
              }
            })
            .catch(error => {
              if (mountedRef.current) {
                console.error("GlobalSyncManager - Erreur lors de la synchronisation périodique:", error);
              }
            });
        }
      }, 300000); // 5 minutes au lieu de 30 minutes
      
      return () => {
        clearTimeout(initialSyncTimeout);
        clearInterval(periodicSyncInterval);
      };
    } catch (error) {
      console.error("GlobalSyncManager - Erreur lors de l'initialisation de la synchronisation:", error);
    }
  }, [syncAll, isOnline, initialSyncDone, forceProcessQueue]);
  
  // Afficher le débogueur uniquement en développement
  return <SyncDebugger enabled={enableDebugging} />;
};

export default GlobalSyncManager;
