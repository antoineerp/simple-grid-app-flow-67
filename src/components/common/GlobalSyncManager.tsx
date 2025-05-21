
import React, { useEffect, useState, useRef } from 'react';
import { useSyncContext } from '@/features/sync/hooks/useSyncContext';
import SyncDebugger from '@/features/sync/components/SyncDebugger';
import { getCurrentUser } from '@/services/core/databaseConnectionService';
import { useAuth } from '@/hooks/useAuth';

// Activer le débogage uniquement en développement
const enableDebugging = import.meta.env.DEV;

const GlobalSyncManager: React.FC = () => {
  const { syncAll, isOnline, forceProcessQueue } = useSyncContext();
  const [initialSyncDone, setInitialSyncDone] = useState(false);
  const { isLoggedIn } = useAuth();
  const mountedRef = useRef<boolean>(false);
  const initRef = useRef<boolean>(false);
  const lastSyncRef = useRef<number>(Date.now());
  const forceSyncRequiredRef = useRef<boolean>(false);
  const currentUserRef = useRef<string>(getCurrentUser());
  
  // Séquence minimum entre deux synchronisations complètes (5 minutes)
  const MIN_SYNC_INTERVAL = 300000;
  
  // Assurer que le composant est bien monté avant d'exécuter des effets
  useEffect(() => {
    console.log("GlobalSyncManager - Composant monté");
    mountedRef.current = true;
    currentUserRef.current = getCurrentUser();
    
    console.log(`GlobalSyncManager - Utilisateur actuel: ${currentUserRef.current}`);
    
    // Une fois au montage, créer un élément dans le DOM
    if (!initRef.current) {
      initRef.current = true;
      try {
        const syncInitElement = document.createElement('div');
        syncInitElement.id = 'global-sync-manager-initialized';
        syncInitElement.style.display = 'none';
        syncInitElement.setAttribute('data-user', currentUserRef.current);
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
  
  // Écouter les changements d'utilisateur
  useEffect(() => {
    const handleUserChange = (event: CustomEvent) => {
      if (!mountedRef.current) return;
      
      const newUserId = event.detail?.userId;
      if (!newUserId) return;
      
      if (newUserId !== currentUserRef.current) {
        console.log(`GlobalSyncManager - Changement d'utilisateur détecté: ${currentUserRef.current} -> ${newUserId}`);
        currentUserRef.current = newUserId;
        
        // Forcer une synchronisation complète
        forceSyncRequiredRef.current = true;
        
        // Déclencher une synchronisation immédiate
        setTimeout(() => {
          if (mountedRef.current && isOnline) {
            console.log("GlobalSyncManager - Déclenchement de synchronisation suite au changement d'utilisateur");
            forceProcessQueue();
            
            syncAll()
              .then(results => {
                console.log("GlobalSyncManager - Résultats de la synchronisation après changement d'utilisateur:", results);
                lastSyncRef.current = Date.now();
                forceSyncRequiredRef.current = false;
              })
              .catch(error => {
                console.error("GlobalSyncManager - Erreur lors de la synchronisation après changement d'utilisateur:", error);
              });
          }
        }, 1000);
      }
    };
    
    // S'abonner aux événements de changement d'utilisateur
    window.addEventListener('userChanged' as any, handleUserChange as EventListener);
    
    return () => {
      window.removeEventListener('userChanged' as any, handleUserChange as EventListener);
    };
  }, [isOnline, syncAll, forceProcessQueue]);
  
  // Écouter les événements de synchronisation forcée
  useEffect(() => {
    const handleForceSyncRequired = (event: CustomEvent) => {
      if (!mountedRef.current) return;
      
      console.log("GlobalSyncManager - Événement de synchronisation forcée reçu", event.detail);
      forceSyncRequiredRef.current = true;
      
      // Tenter une synchronisation
      const now = Date.now();
      if (isOnline) {
        console.log("GlobalSyncManager - Déclenchement de la synchronisation forcée");
        
        // Ajouter un délai pour éviter les synchronisations simultanées
        setTimeout(() => {
          if (mountedRef.current) {
            // Vérifier si l'utilisateur a changé
            const currentUser = getCurrentUser();
            if (currentUser !== currentUserRef.current) {
              console.log(`GlobalSyncManager - Utilisateur modifié pendant l'attente: ${currentUserRef.current} -> ${currentUser}`);
              currentUserRef.current = currentUser;
            }
            
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
    window.addEventListener('force-sync-required' as any, handleForceSyncRequired as EventListener);
    window.addEventListener('connectivity-restored' as any, handleForceSyncRequired as EventListener);
    
    return () => {
      window.removeEventListener('force-sync-required' as any, handleForceSyncRequired as EventListener);
      window.removeEventListener('connectivity-restored' as any, handleForceSyncRequired as EventListener);
    };
  }, [isOnline, syncAll, forceProcessQueue]);
  
  // Synchronisation initiale et périodique
  useEffect(() => {
    if (!mountedRef.current || !isLoggedIn) return;
    
    try {
      console.log(`GlobalSyncManager - Initialisation de la synchronisation pour ${currentUserRef.current}`);
      
      // Déclencher la première synchronisation après un délai
      // pour laisser le temps à l'application de se stabiliser
      const initialSyncTimeout = setTimeout(() => {
        if (mountedRef.current && !initialSyncDone && isOnline) {
          // Vérifier si l'utilisateur a changé
          const currentUser = getCurrentUser();
          if (currentUser !== currentUserRef.current) {
            console.log(`GlobalSyncManager - Utilisateur modifié: ${currentUserRef.current} -> ${currentUser}`);
            currentUserRef.current = currentUser;
          }
          
          console.log(`GlobalSyncManager - Démarrage de la synchronisation initiale pour ${currentUserRef.current}`);
          
          syncAll()
            .then(() => {
              if (mountedRef.current) {
                console.log(`GlobalSyncManager - Synchronisation initiale terminée pour ${currentUserRef.current}`);
                setInitialSyncDone(true);
                lastSyncRef.current = Date.now();
              }
            })
            .catch(error => {
              if (mountedRef.current) {
                console.error(`GlobalSyncManager - Erreur lors de la synchronisation initiale pour ${currentUserRef.current}:`, error);
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
          // Vérifier si l'utilisateur a changé
          const currentUser = getCurrentUser();
          if (currentUser !== currentUserRef.current) {
            console.log(`GlobalSyncManager - Utilisateur modifié lors de la synchronisation périodique: ${currentUserRef.current} -> ${currentUser}`);
            currentUserRef.current = currentUser;
          }
          
          console.log(`GlobalSyncManager - Démarrage de la synchronisation périodique pour ${currentUserRef.current}`);
          
          syncAll()
            .then(() => {
              if (mountedRef.current) {
                lastSyncRef.current = Date.now();
              }
            })
            .catch(error => {
              if (mountedRef.current) {
                console.error(`GlobalSyncManager - Erreur lors de la synchronisation périodique pour ${currentUserRef.current}:`, error);
              }
            });
        }
      }, 300000); // 5 minutes
      
      return () => {
        clearTimeout(initialSyncTimeout);
        clearInterval(periodicSyncInterval);
      };
    } catch (error) {
      console.error(`GlobalSyncManager - Erreur lors de l'initialisation de la synchronisation pour ${currentUserRef.current}:`, error);
    }
  }, [syncAll, isOnline, initialSyncDone, forceProcessQueue, isLoggedIn]);
  
  // Afficher le débogueur uniquement en développement
  return <SyncDebugger enabled={enableDebugging} />;
};

export default GlobalSyncManager;
