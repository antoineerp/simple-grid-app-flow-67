
import React, { useEffect, useState, useRef } from 'react';
import { useGlobalSync } from '@/contexts/GlobalSyncContext';

const GlobalSyncManager: React.FC = () => {
  const { syncAll, isOnline, syncStates } = useGlobalSync();
  const [syncingInProgress, setSyncingInProgress] = useState(false);
  const syncTimer = useRef<NodeJS.Timeout | null>(null);
  const syncAttempts = useRef<number>(0);
  const lastSyncRef = useRef<number>(Date.now());
  const syncLockRef = useRef<Record<string, boolean>>({});
  const mountedRef = useRef<boolean>(false);
  const initRef = useRef<boolean>(false);
  
  // Assurer que le composant est bien monté avant d'exécuter des effets
  useEffect(() => {
    console.log("GlobalSyncManager - Composant monté");
    mountedRef.current = true;
    
    // Une fois au montage, créer un élément dans le DOM pour indiquer que le GlobalSyncManager est initialisé
    // Ceci permet de vérifier dans d'autres composants que la synchronisation est prête
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
      try {
        const syncInitElement = document.getElementById('global-sync-manager-initialized');
        if (syncInitElement) {
          document.body.removeChild(syncInitElement);
        }
      } catch (error) {
        console.error("GlobalSyncManager - Erreur lors du nettoyage du marqueur DOM:", error);
      }
    };
  }, []);
  
  // Utiliser un effet pour démarrer la synchronisation en arrière-plan
  useEffect(() => {
    if (!mountedRef.current) return; // Ne pas exécuter si le composant n'est pas monté
    
    try {
      console.log("GlobalSyncManager - Initialisation de la synchronisation");
      
      // Déclencher la première synchronisation après 2 secondes
      const timeoutId = setTimeout(() => {
        if (!syncingInProgress && mountedRef.current) {
          console.log("GlobalSyncManager - Démarrage de la synchronisation initiale");
          setSyncingInProgress(true);
          syncAttempts.current = 1;
          
          syncAll()
            .then(results => {
              if (!mountedRef.current) return;
              
              console.log("GlobalSyncManager - Résultats de la synchronisation initiale:", results);
              setSyncingInProgress(false);
              lastSyncRef.current = Date.now();
              
              // Vérifier les résultats pour les tables importantes
              Object.entries(results).forEach(([tableName, success]) => {
                if (!success && (tableName === 'membres' || tableName === 'bibliotheque' || tableName === 'collaboration')) {
                  console.warn(`GlobalSyncManager - Échec de synchronisation pour ${tableName}`);
                }
              });
            })
            .catch(error => {
              if (!mountedRef.current) return;
              
              console.error("GlobalSyncManager - Erreur lors de la synchronisation initiale:", error);
              setSyncingInProgress(false);
            });
        }
      }, 2000);
      
      // Planifier des synchronisations périodiques (toutes les 5 minutes - augmenté pour réduire les conflits)
      const intervalId = setInterval(() => {
        if (!mountedRef.current) return; // Ne pas exécuter si le composant n'est pas monté
        
        if (isOnline && !syncingInProgress && mountedRef.current && Date.now() - lastSyncRef.current > 300000) {
          console.log("GlobalSyncManager - Exécution de la synchronisation périodique");
          
          // Utiliser un verrou pour éviter les synchronisations simultanées
          if (!Object.values(syncLockRef.current).some(lock => lock)) {
            syncAll().then(() => {
              if (mountedRef.current) {
                lastSyncRef.current = Date.now();
              }
            }).catch(error => {
              console.error("GlobalSyncManager - Erreur lors de la synchronisation périodique:", error);
            });
          } else {
            console.log("GlobalSyncManager - Synchronisation déjà en cours, requête ignorée");
          }
        }
      }, 300000); // 5 minutes
      
      syncTimer.current = intervalId;
      
      return () => {
        clearTimeout(timeoutId);
        if (syncTimer.current) clearInterval(syncTimer.current);
      };
    } catch (error) {
      console.error("GlobalSyncManager - Erreur lors de l'initialisation de la synchronisation:", error);
    }
  }, [syncAll, isOnline, syncingInProgress]);
  
  // Écouter les changements de route pour re-synchroniser les données avec délai
  useEffect(() => {
    // Utiliser une référence pour suivre la dernière navigation
    const lastNavigationTimeRef = useRef<number>(Date.now());
    const navigationDebounceRef = useRef<NodeJS.Timeout | null>(null);
    
    const handleRouteChange = () => {
      if (!mountedRef.current) return;
      
      // Ajouter un délai minimum entre les synchronisations (5 secondes)
      const now = Date.now();
      if (isOnline && now - lastNavigationTimeRef.current > 5000 && now - lastSyncRef.current > 30000) {
        console.log("GlobalSyncManager - Changement de route détecté, programmation de synchronisation");
        
        // Annuler tout délai précédent
        if (navigationDebounceRef.current) {
          clearTimeout(navigationDebounceRef.current);
        }
        
        // Attendre un peu plus longtemps que la page soit complètement chargée et stabilisée
        navigationDebounceRef.current = setTimeout(() => {
          if (!syncingInProgress && !Object.values(syncLockRef.current).some(lock => lock) && mountedRef.current) {
            syncAll().then(() => {
              if (mountedRef.current) {
                lastSyncRef.current = Date.now();
                lastNavigationTimeRef.current = Date.now();
              }
            }).catch(error => {
              console.error("GlobalSyncManager - Erreur lors de la synchronisation après changement de route:", error);
            });
          } else {
            console.log("GlobalSyncManager - Synchronisation déjà en cours après navigation, requête ignorée");
          }
        }, 1500); // 1.5 secondes pour éviter les conflits
      }
    };
    
    // Écouter les événements de changement d'URL
    window.addEventListener('popstate', handleRouteChange);
    
    return () => {
      window.removeEventListener('popstate', handleRouteChange);
      if (navigationDebounceRef.current) {
        clearTimeout(navigationDebounceRef.current);
      }
    };
  }, [isOnline, syncAll, syncingInProgress]);
  
  // S'assurer que l'indicateur de synchronisation disparaît après 30 secondes maximum
  useEffect(() => {
    let timeoutId: NodeJS.Timeout | null = null;
    
    if (syncingInProgress) {
      timeoutId = setTimeout(() => {
        if (mountedRef.current) {
          console.log("GlobalSyncManager - Timeout de synchronisation atteint, réinitialisation");
          setSyncingInProgress(false);
        }
      }, 30000); // 30 secondes maximum
    }
    
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [syncingInProgress]);
  
  // Script caché - pas d'affichage d'interface
  return null;
};

export default GlobalSyncManager;
