
import React, { useEffect, useState, useRef } from 'react';
import { useSyncContext } from '@/features/sync/hooks/useSyncContext';
import SyncDebugger from '@/features/sync/components/SyncDebugger';
import { cleanSyncStorage } from '@/utils/syncStorageCleaner';
import { getCurrentUser } from '@/services/core/databaseConnectionService';
import { SyncLoggingService } from '@/features/sync/components/SyncLoggingService';

// Activer le débogage uniquement en développement
const enableDebugging = import.meta.env.DEV;

const GlobalSyncManager: React.FC = () => {
  const { syncAll, isOnline, forceProcessQueue } = useSyncContext();
  const [initialSyncDone, setInitialSyncDone] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string>('non connecté');
  const mountedRef = useRef<boolean>(false);
  const initRef = useRef<boolean>(false);
  const lastSyncRef = useRef<number>(Date.now());
  const forceSyncRequiredRef = useRef<boolean>(false);
  
  // Séquence minimum entre deux synchronisations complètes (5 minutes)
  const MIN_SYNC_INTERVAL = 300000;
  
  // Mettre à jour l'ID utilisateur courant
  useEffect(() => {
    const updateCurrentUser = () => {
      const userId = getCurrentUser() || 'non connecté';
      setCurrentUserId(userId);
      
      // Journaliser l'utilisateur courant pour le débogage
      SyncLoggingService.logSyncAction('user-update', 'global', true, { userId });
      
      // Afficher des informations sur l'utilisateur actuel dans la console
      console.log(`GlobalSyncManager: Utilisateur actuel - ${userId}`);
    };
    
    // Initialiser et configurer l'écouteur de changement d'utilisateur
    updateCurrentUser();
    
    const userChangeListener = (event: Event) => {
      const customEvent = event as CustomEvent;
      console.log(`GlobalSyncManager: Changement d'utilisateur détecté`, customEvent.detail);
      
      updateCurrentUser();
      
      // Déclencher une synchronisation forcée lors du changement d'utilisateur
      forceSyncRequiredRef.current = true;
      setTimeout(() => {
        if (mountedRef.current) {
          console.log(`GlobalSyncManager: Forcer la synchronisation après changement d'utilisateur`);
          forceProcessQueue();
          syncAll().catch(error => {
            console.error("GlobalSyncManager - Erreur lors de la synchronisation après changement d'utilisateur:", error);
          });
        }
      }, 1000);
    };
    
    window.addEventListener('database-user-changed', userChangeListener);
    return () => {
      window.removeEventListener('database-user-changed', userChangeListener);
    };
  }, [forceProcessQueue, syncAll]);
  
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
        syncInitElement.setAttribute('data-user', currentUserId);
        syncInitElement.setAttribute('data-sync-enabled', 'true');
        document.body.appendChild(syncInitElement);
        console.log(`GlobalSyncManager: Élément de synchronisation initialisé pour l'utilisateur ${currentUserId}`);
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
  }, [currentUserId]);
  
  // Nettoyer le localStorage dès le chargement du composant
  useEffect(() => {
    if (mountedRef.current) {
      // Nettoyer les données corrompues dans localStorage
      setTimeout(() => {
        console.log("GlobalSyncManager - Nettoyage initial du localStorage");
        cleanSyncStorage();
      }, 500);
    }
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
                
                // Journaliser pour débogage
                SyncLoggingService.logSyncAction('force-sync', 'all', true, { results });
              })
              .catch(error => {
                console.error("GlobalSyncManager - Erreur lors de la synchronisation forcée:", error);
                
                // Journaliser l'erreur
                SyncLoggingService.logSyncAction('force-sync', 'all', false, { error: String(error) });
              });
          }
        }, 1000);
      }
    };
    
    // Écouter les événements personnalisés
    window.addEventListener('force-sync-required', handleForceSyncRequired);
    window.addEventListener('connectivity-restored', handleForceSyncRequired);
    window.addEventListener('sync-data-changed', handleForceSyncRequired);
    
    return () => {
      window.removeEventListener('force-sync-required', handleForceSyncRequired);
      window.removeEventListener('connectivity-restored', handleForceSyncRequired);
      window.removeEventListener('sync-data-changed', handleForceSyncRequired);
    };
  }, [isOnline, syncAll, forceProcessQueue]);
  
  // Synchronisation initiale et périodique
  useEffect(() => {
    if (!mountedRef.current) return;
    
    try {
      console.log("GlobalSyncManager - Initialisation de la synchronisation");
      
      // Déclencher la première synchronisation après un délai réduit
      const initialSyncTimeout = setTimeout(() => {
        if (mountedRef.current && !initialSyncDone && isOnline) {
          console.log("GlobalSyncManager - Démarrage de la synchronisation initiale");
          
          // Journaliser le début de la synchronisation initiale
          SyncLoggingService.logSyncAction('initial-sync-start', 'all', true, { userId: currentUserId });
          
          syncAll()
            .then((results) => {
              if (mountedRef.current) {
                console.log("GlobalSyncManager - Synchronisation initiale terminée", results);
                setInitialSyncDone(true);
                lastSyncRef.current = Date.now();
                
                // Journaliser pour débogage
                SyncLoggingService.logSyncAction('initial-sync', 'all', true, { results });
              }
            })
            .catch(error => {
              if (mountedRef.current) {
                console.error("GlobalSyncManager - Erreur lors de la synchronisation initiale:", error);
                // Même en cas d'erreur, marquer comme initialisé
                setInitialSyncDone(true);
                
                // Journaliser l'erreur
                SyncLoggingService.logSyncAction('initial-sync', 'all', false, { error: String(error) });
              }
            });
        }
      }, 3000); // Réduit à 3 secondes pour une meilleure réactivité
      
      // Synchronisations périodiques (toutes les 3 minutes)
      const periodicSyncInterval = setInterval(() => {
        if (!mountedRef.current) return;
        
        const now = Date.now();
        
        // Fréquence réduite à 3 minutes pour plus de réactivité
        if (isOnline && now - lastSyncRef.current > 180000) {
          console.log("GlobalSyncManager - Démarrage de la synchronisation périodique");
          
          syncAll()
            .then((results) => {
              if (mountedRef.current) {
                lastSyncRef.current = Date.now();
                
                // Journaliser pour débogage
                SyncLoggingService.logSyncAction('periodic-sync', 'all', true, { results });
              }
            })
            .catch(error => {
              if (mountedRef.current) {
                console.error("GlobalSyncManager - Erreur lors de la synchronisation périodique:", error);
                
                // Journaliser l'erreur
                SyncLoggingService.logSyncAction('periodic-sync', 'all', false, { error: String(error) });
              }
            });
        }
      }, 180000); // 3 minutes
      
      // Nettoyer localStorage périodiquement
      const cleanupInterval = setInterval(() => {
        if (mountedRef.current) {
          console.log("GlobalSyncManager - Nettoyage périodique du localStorage");
          cleanSyncStorage();
        }
      }, 300000); // Toutes les 5 minutes
      
      return () => {
        clearTimeout(initialSyncTimeout);
        clearInterval(periodicSyncInterval);
        clearInterval(cleanupInterval);
      };
    } catch (error) {
      console.error("GlobalSyncManager - Erreur lors de l'initialisation de la synchronisation:", error);
    }
  }, [syncAll, isOnline, initialSyncDone, forceProcessQueue, currentUserId]);
  
  // Afficher le débogueur uniquement en développement
  return (
    <>
      <div id="sync-debug-info" style={{ display: 'none' }} data-user={currentUserId} data-online={isOnline.toString()} />
      <SyncDebugger enabled={enableDebugging} />
    </>
  );
};

export default GlobalSyncManager;
