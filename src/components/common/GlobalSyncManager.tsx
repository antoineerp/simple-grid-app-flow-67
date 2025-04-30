
import React, { useEffect, useState, useRef } from 'react';
import { useGlobalSync } from '@/contexts/GlobalSyncContext';
import { syncQueue } from '@/features/sync/utils/syncQueue';

const GlobalSyncManager: React.FC = () => {
  const { syncAll, isOnline, syncStates } = useGlobalSync();
  const [syncingInProgress, setSyncingInProgress] = useState(false);
  const [initialSyncDone, setInitialSyncDone] = useState(false);
  const syncTimer = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef<boolean>(false);
  const initRef = useRef<boolean>(false);
  const lastSyncRef = useRef<number>(Date.now());
  const forceSyncRequiredRef = useRef<boolean>(false);
  
  // Séquence minimum entre deux synchronisations complètes (10 minutes)
  const MIN_SYNC_INTERVAL = 600000;
  
  // Assurer que le composant est bien monté avant d'exécuter des effets
  useEffect(() => {
    console.log("GlobalSyncManager - Composant monté");
    mountedRef.current = true;
    
    // Vérifier si l'élément existe déjà avant de le créer
    const existingElement = document.getElementById('global-sync-manager-initialized');
    
    // Une fois au montage, créer un élément dans le DOM pour indiquer que le GlobalSyncManager est initialisé
    if (!initRef.current && !existingElement) {
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
      
      // Nettoyer le marqueur DOM lors du démontage uniquement si nous l'avons créé
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
      
      // Nettoyer les timeouts
      if (syncTimer.current) {
        clearInterval(syncTimer.current);
      }
    };
  }, []);
  
  // Écouter les événements de synchronisation forcée
  useEffect(() => {
    const handleForceSyncRequired = (event: CustomEvent) => {
      if (!mountedRef.current) return;
      
      console.log("GlobalSyncManager - Événement de synchronisation forcée reçu:", event.detail);
      forceSyncRequiredRef.current = true;
      
      // Déclencher une synchronisation uniquement si assez de temps s'est écoulé depuis la dernière
      const now = Date.now();
      if (isOnline && !syncingInProgress && now - lastSyncRef.current > MIN_SYNC_INTERVAL) {
        console.log("GlobalSyncManager - Déclenchement de la synchronisation forcée");
        
        // Ajouter un petit délai pour éviter les synchronisations simultanées
        setTimeout(() => {
          if (mountedRef.current) {
            setSyncingInProgress(true);
            
            syncAll()
              .then(results => {
                console.log("GlobalSyncManager - Résultats de la synchronisation forcée:", results);
                lastSyncRef.current = Date.now();
                forceSyncRequiredRef.current = false;
                setSyncingInProgress(false);
              })
              .catch(error => {
                console.error("GlobalSyncManager - Erreur lors de la synchronisation forcée:", error);
                setSyncingInProgress(false);
              });
          }
        }, 1000);
      } else {
        console.log(`GlobalSyncManager - Synchronisation ignorée: ${
          !isOnline ? 'hors ligne' : 
          syncingInProgress ? 'synchronisation déjà en cours' : 
          'synchronisation récente'
        }`);
      }
    };
    
    // Écouter les événements personnalisés
    window.addEventListener('force-sync-required', handleForceSyncRequired as EventListener);
    window.addEventListener('connectivity-restored', handleForceSyncRequired as EventListener);
    
    return () => {
      window.removeEventListener('force-sync-required', handleForceSyncRequired as EventListener);
      window.removeEventListener('connectivity-restored', handleForceSyncRequired as EventListener);
    };
  }, [isOnline, syncAll, syncingInProgress]);
  
  // Synchronisation initiale et périodique
  useEffect(() => {
    if (!mountedRef.current) return;
    
    try {
      console.log("GlobalSyncManager - Initialisation de la synchronisation");
      
      // Déclencher la première synchronisation après 5 secondes
      const initialSyncTimeout = setTimeout(() => {
        if (mountedRef.current && !initialSyncDone && isOnline) {
          console.log("GlobalSyncManager - Démarrage de la synchronisation initiale");
          setSyncingInProgress(true);
          
          syncAll()
            .then(results => {
              if (!mountedRef.current) return;
              
              console.log("GlobalSyncManager - Résultats de la synchronisation initiale:", results);
              setInitialSyncDone(true);
              lastSyncRef.current = Date.now();
              setSyncingInProgress(false);
            })
            .catch(error => {
              if (mountedRef.current) {
                console.error("GlobalSyncManager - Erreur lors de la synchronisation initiale:", error);
                setSyncingInProgress(false);
                // Même en cas d'erreur, marquer comme initialisé
                setInitialSyncDone(true);
              }
            });
        }
      }, 5000);
      
      // Synchronisations périodiques (toutes les 30 minutes)
      const periodicSyncInterval = setInterval(() => {
        if (!mountedRef.current) return;
        
        const now = Date.now();
        
        // N'exécuter que si en ligne, pas de sync en cours, et dernier sync > 30 min
        if (isOnline && !syncingInProgress && now - lastSyncRef.current > 1800000) {
          console.log("GlobalSyncManager - Démarrage de la synchronisation périodique");
          setSyncingInProgress(true);
          
          syncAll()
            .then(() => {
              if (mountedRef.current) {
                lastSyncRef.current = Date.now();
                setSyncingInProgress(false);
              }
            })
            .catch(error => {
              if (mountedRef.current) {
                console.error("GlobalSyncManager - Erreur lors de la synchronisation périodique:", error);
                setSyncingInProgress(false);
              }
            });
        }
      }, 1800000); // 30 minutes
      
      syncTimer.current = periodicSyncInterval;
      
      return () => {
        clearTimeout(initialSyncTimeout);
        clearInterval(periodicSyncInterval);
      };
    } catch (error) {
      console.error("GlobalSyncManager - Erreur lors de l'initialisation de la synchronisation:", error);
    }
  }, [syncAll, isOnline, initialSyncDone]);
  
  // S'assurer que l'indicateur de synchronisation disparaît après 1 minute maximum
  useEffect(() => {
    if (syncingInProgress) {
      const timeoutId = setTimeout(() => {
        if (mountedRef.current) {
          console.log("GlobalSyncManager - Timeout de synchronisation atteint, réinitialisation");
          setSyncingInProgress(false);
        }
      }, 60000); // 1 minute maximum
      
      return () => {
        clearTimeout(timeoutId);
      };
    }
  }, [syncingInProgress]);
  
  // Script caché - pas d'affichage d'interface
  return null;
};

export default GlobalSyncManager;
