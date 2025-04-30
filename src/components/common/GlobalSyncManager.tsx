
import React, { useEffect, useState, useRef } from 'react';
import { useGlobalSync } from '@/contexts/GlobalSyncContext';

const GlobalSyncManager: React.FC = () => {
  const { syncAll, isOnline, syncStates } = useGlobalSync();
  const [syncingInProgress, setSyncingInProgress] = useState(false);
  const syncTimer = useRef<NodeJS.Timeout | null>(null);
  const syncAttempts = useRef<number>(0);
  const lastSyncRef = useRef<number>(Date.now());
  
  // Utiliser un effet pour démarrer la synchronisation en arrière-plan
  useEffect(() => {
    try {
      console.log("GlobalSyncManager - Initialisation de la synchronisation");
      
      // Déclencher la première synchronisation après 2 secondes
      const timeoutId = setTimeout(() => {
        console.log("GlobalSyncManager - Démarrage de la synchronisation initiale");
        setSyncingInProgress(true);
        syncAttempts.current = 1;
        
        syncAll()
          .then(results => {
            console.log("GlobalSyncManager - Résultats de la synchronisation initiale:", results);
            setSyncingInProgress(false);
            lastSyncRef.current = Date.now();
            
            // Vérifier les résultats pour les tables importantes
            Object.entries(results).forEach(([tableName, success]) => {
              if (!success && (tableName === 'membres' || tableName === 'bibliotheque' || tableName === 'collaboration')) {
                console.warn(`GlobalSyncManager - Échec de synchronisation pour ${tableName}`);
                // Ne pas afficher de notification visuelle mais logger pour debug
              }
            });
          })
          .catch(error => {
            console.error("GlobalSyncManager - Erreur lors de la synchronisation initiale:", error);
            setSyncingInProgress(false);
          });
      }, 2000);
      
      // Planifier des synchronisations périodiques (toutes les 3 minutes)
      const intervalId = setInterval(() => {
        if (isOnline && !syncingInProgress && Date.now() - lastSyncRef.current > 180000) {
          console.log("GlobalSyncManager - Exécution de la synchronisation périodique");
          
          syncAll().then(() => {
            lastSyncRef.current = Date.now();
          }).catch(error => {
            console.error("GlobalSyncManager - Erreur lors de la synchronisation périodique:", error);
          });
        }
      }, 180000); // 3 minutes
      
      syncTimer.current = intervalId;
      
      return () => {
        clearTimeout(timeoutId);
        if (syncTimer.current) clearInterval(syncTimer.current);
      };
    } catch (error) {
      console.error("GlobalSyncManager - Erreur lors de l'initialisation de la synchronisation:", error);
    }
  }, [syncAll, isOnline]);
  
  // Écouter les changements de route pour re-synchroniser les données
  useEffect(() => {
    const handleRouteChange = () => {
      if (isOnline && Date.now() - lastSyncRef.current > 30000) { // Au moins 30s entre les syncs
        console.log("GlobalSyncManager - Changement de route détecté, synchronisation");
        
        // Attendre un peu que la nouvelle page soit chargée
        setTimeout(() => {
          syncAll().then(() => {
            lastSyncRef.current = Date.now();
          }).catch(error => {
            console.error("GlobalSyncManager - Erreur lors de la synchronisation après changement de route:", error);
          });
        }, 500);
      }
    };
    
    // Écouter les événements de changement d'URL
    window.addEventListener('popstate', handleRouteChange);
    
    return () => {
      window.removeEventListener('popstate', handleRouteChange);
    };
  }, [isOnline, syncAll]);
  
  // S'assurer que l'indicateur de synchronisation disparaît après 30 secondes maximum
  useEffect(() => {
    let timeoutId: NodeJS.Timeout | null = null;
    
    if (syncingInProgress) {
      timeoutId = setTimeout(() => {
        console.log("GlobalSyncManager - Timeout de synchronisation atteint, réinitialisation");
        setSyncingInProgress(false);
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
