
import React, { useEffect, useState, useRef } from 'react';
import { useGlobalSync } from '@/contexts/GlobalSyncContext';

const GlobalSyncManager: React.FC = () => {
  const { syncAll, isOnline, syncStates } = useGlobalSync();
  const [syncingInProgress, setSyncingInProgress] = useState(false);
  const [initialSyncDone, setInitialSyncDone] = useState(false);
  const syncTimer = useRef<NodeJS.Timeout | null>(null);
  const syncAttempts = useRef<number>(0);
  const lastSyncRef = useRef<number>(Date.now());
  const syncLockRef = useRef<Record<string, boolean>>({});
  const mountedRef = useRef<boolean>(false);
  const initRef = useRef<boolean>(false);
  const lastNavigationTimeRef = useRef<number>(Date.now());
  const navigationDebounceRef = useRef<NodeJS.Timeout | null>(null);
  
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
    
    // Nettoyer tous les verrous de synchronisation au démarrage
    try {
      const keys = Object.keys(localStorage);
      const syncLockKeys = keys.filter(key => key.startsWith('sync_in_progress_') || key.startsWith('sync_lock_time_'));
      
      if (syncLockKeys.length > 0) {
        console.log("GlobalSyncManager - Nettoyage des verrous de synchronisation périmés:", syncLockKeys);
        syncLockKeys.forEach(key => {
          localStorage.removeItem(key);
        });
      }
    } catch (error) {
      console.error("GlobalSyncManager - Erreur lors du nettoyage des verrous:", error);
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
      
      if (navigationDebounceRef.current) {
        clearTimeout(navigationDebounceRef.current);
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
        if (mountedRef.current && !initialSyncDone) {
          console.log("GlobalSyncManager - Démarrage de la synchronisation initiale");
          setSyncingInProgress(true);
          syncAttempts.current = 1;
          
          syncAll()
            .then(results => {
              if (!mountedRef.current) return;
              
              console.log("GlobalSyncManager - Résultats de la synchronisation initiale:", results);
              setSyncingInProgress(false);
              setInitialSyncDone(true);
              lastSyncRef.current = Date.now();
              
              // Vérifier les résultats pour les tables importantes
              Object.entries(results).forEach(([tableName, success]) => {
                if (!success && (tableName === 'membres' || tableName === 'bibliotheque' || tableName === 'collaboration')) {
                  console.warn(`GlobalSyncManager - Échec de synchronisation pour ${tableName}`);
                }
              });
            })
            .catch(error => {
              if (mountedRef.current) {
                console.error("GlobalSyncManager - Erreur lors de la synchronisation initiale:", error);
                setSyncingInProgress(false);
                // Même en cas d'erreur, marquer comme initialisé pour éviter les boucles infinies
                setInitialSyncDone(true);
              }
            });
        }
      }, 2000);
      
      // Planifier des synchronisations périodiques (toutes les 5 minutes)
      const intervalId = setInterval(() => {
        if (!mountedRef.current) return; // Ne pas exécuter si le composant n'est pas monté
        
        if (isOnline && !syncingInProgress && mountedRef.current && Date.now() - lastSyncRef.current > 300000) {
          console.log("GlobalSyncManager - Exécution de la synchronisation périodique");
          
          // Utiliser un verrou pour éviter les synchronisations simultanées
          const hasActiveLock = Object.values(syncLockRef.current).some(lock => lock);
          if (!hasActiveLock) {
            syncAll().then(() => {
              if (mountedRef.current) {
                lastSyncRef.current = Date.now();
                
                // Nettoyer les verrous de synchronisation après une synchronisation réussie
                try {
                  const keys = Object.keys(localStorage);
                  const syncLockKeys = keys.filter(key => key.startsWith('sync_in_progress_') || key.startsWith('sync_lock_time_'));
                  
                  if (syncLockKeys.length > 0) {
                    console.log("GlobalSyncManager - Nettoyage des verrous après synchronisation périodique:", syncLockKeys);
                    syncLockKeys.forEach(key => {
                      localStorage.removeItem(key);
                    });
                  }
                } catch (error) {
                  console.error("GlobalSyncManager - Erreur lors du nettoyage des verrous:", error);
                }
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
  }, [syncAll, isOnline, syncingInProgress, initialSyncDone]);
  
  // Écouter les changements de route pour re-synchroniser les données
  useEffect(() => {
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
        
        // Attendre que la page soit complètement chargée
        navigationDebounceRef.current = setTimeout(() => {
          const hasActiveLock = Object.values(syncLockRef.current).some(lock => lock);
          if (!syncingInProgress && !hasActiveLock && mountedRef.current) {
            // Vérifier également les verrous dans localStorage
            let hasStorageLock = false;
            try {
              const keys = Object.keys(localStorage);
              hasStorageLock = keys.some(key => key.startsWith('sync_in_progress_') && localStorage.getItem(key) === 'true');
            } catch (error) {
              console.error("GlobalSyncManager - Erreur lors de la vérification des verrous localStorage:", error);
            }
            
            if (!hasStorageLock) {
              syncAll().then(() => {
                if (mountedRef.current) {
                  lastSyncRef.current = Date.now();
                  lastNavigationTimeRef.current = Date.now();
                  
                  // Nettoyer les verrous après la synchronisation
                  try {
                    const keys = Object.keys(localStorage);
                    const syncLockKeys = keys.filter(key => key.startsWith('sync_in_progress_') || key.startsWith('sync_lock_time_'));
                    
                    if (syncLockKeys.length > 0) {
                      console.log("GlobalSyncManager - Nettoyage des verrous après navigation:", syncLockKeys);
                      syncLockKeys.forEach(key => {
                        localStorage.removeItem(key);
                      });
                    }
                  } catch (error) {
                    console.error("GlobalSyncManager - Erreur lors du nettoyage des verrous:", error);
                  }
                }
              }).catch(error => {
                console.error("GlobalSyncManager - Erreur lors de la synchronisation après changement de route:", error);
              });
            } else {
              console.log("GlobalSyncManager - Synchronisation déjà en cours après navigation (verrou localStorage), requête ignorée");
            }
          } else {
            console.log("GlobalSyncManager - Synchronisation déjà en cours après navigation, requête ignorée");
          }
        }, 1500);
      }
    };
    
    // Écouter les événements de changement d'URL
    window.addEventListener('popstate', handleRouteChange);
    
    // Écouter également les clics sur les liens pour détecter les changements de route non gérés par popstate
    const handleLinkClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const link = target.closest('a');
      
      if (link && !link.getAttribute('download') && link.getAttribute('href')?.startsWith('/')) {
        console.log("GlobalSyncManager - Clic sur lien détecté, préparation pour synchronisation");
        lastNavigationTimeRef.current = Date.now() - 4000; // Réduire le délai pour permettre la synchronisation plus rapide
      }
    };
    
    document.body.addEventListener('click', handleLinkClick);
    
    return () => {
      window.removeEventListener('popstate', handleRouteChange);
      document.body.removeEventListener('click', handleLinkClick);
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
          
          // Nettoyer également tous les verrous
          try {
            const keys = Object.keys(localStorage);
            const syncLockKeys = keys.filter(key => key.startsWith('sync_in_progress_') || key.startsWith('sync_lock_time_'));
            
            if (syncLockKeys.length > 0) {
              console.log("GlobalSyncManager - Nettoyage des verrous après timeout:", syncLockKeys);
              syncLockKeys.forEach(key => {
                localStorage.removeItem(key);
              });
            }
          } catch (error) {
            console.error("GlobalSyncManager - Erreur lors du nettoyage des verrous:", error);
          }
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
